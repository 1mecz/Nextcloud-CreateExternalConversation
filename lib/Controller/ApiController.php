<?php
declare(strict_types=1);

namespace OCA\CreateExternalConversation\Controller;

use OCA\CreateExternalConversation\AppInfo\Application;
use OCA\CreateExternalConversation\Service\ConversationService;
use OCA\CreateExternalConversation\Service\SettingsService;
use OCP\AppFramework\Http;
use OCP\AppFramework\Http\DataResponse;
use OCP\AppFramework\OCSController;
use OCP\IRequest;
use OCP\IUserSession;
use OCP\IUserManager;

/**
 * OCS API Controller for Create External Conversation
 */
class ApiController extends OCSController {
    private ConversationService $conversationService;
    private SettingsService $settingsService;
    private IUserSession $userSession;
    private IUserManager $userManager;

    public function __construct(
        IRequest $request,
        ConversationService $conversationService,
        SettingsService $settingsService,
        IUserSession $userSession,
        IUserManager $userManager
    ) {
        parent::__construct(Application::APP_ID, $request);
        $this->conversationService = $conversationService;
        $this->settingsService = $settingsService;
        $this->userSession = $userSession;
        $this->userManager = $userManager;
    }

    /**
     * Simple ping route (non-OCS) to verify routing
     *
     * @NoAdminRequired
     * @NoCSRFRequired
     */
    public function ping(): DataResponse {
        return new DataResponse([
            'success' => true,
            'message' => 'Ping works',
        ]);
    }

    /**
     * Test connection to the external server
     * 
     * @NoAdminRequired
     * @NoCSRFRequired
     */
    public function testConnection(): DataResponse {
        if (!$this->settingsService->isConfigured()) {
            return new DataResponse(
                ['error' => 'App is not configured. Please configure in admin settings.'],
                Http::STATUS_BAD_REQUEST
            );
        }

        $result = $this->conversationService->testConnection();

        if (!$result['success']) {
            return new DataResponse(
                ['error' => $result['error'] ?? 'Connection test failed'],
                Http::STATUS_INTERNAL_SERVER_ERROR
            );
        }

        return new DataResponse([
            'success' => true,
            'message' => $result['message'] ?? 'Connection successful',
            'details' => $result,
        ]);
    }

    /**
     * Create a conversation on the external server
     * 
     * @NoAdminRequired
     * @NoCSRFRequired
     */
    public function createConversation(string $conversationName = '', array $participants = []): DataResponse {
        $conversationName = trim($conversationName);

        if (empty($conversationName)) {
            return new DataResponse(
                ['error' => 'Conversation name is required'],
                Http::STATUS_BAD_REQUEST
            );
        }

        $currentUser = $this->userSession->getUser();
        if ($currentUser === null) {
            return new DataResponse(
                ['error' => 'User not logged in'],
                Http::STATUS_UNAUTHORIZED
            );
        }

        // Get current user's federated cloud ID (e.g., tomas@nextcloud.com)
        $currentUserFederatedId = $currentUser->getUID() . '@' . $this->request->getServerHost();

        // Add current user to participants if not already there
        $allParticipants = array_unique(array_merge([$currentUserFederatedId], $participants));

        $result = $this->conversationService->createExternalConversation(
            $conversationName,
            $allParticipants
        );

        if (!$result['success']) {
            return new DataResponse(
                ['error' => $result['error'] ?? 'Failed to create conversation'],
                Http::STATUS_INTERNAL_SERVER_ERROR
            );
        }

        return new DataResponse([
            'success' => true,
            'link' => $result['link'],
            'token' => $result['token'],
            'conversationName' => $conversationName,
            'participantsAdded' => $result['participantsAdded'] ?? 0,
            'participantsFailed' => $result['participantsFailed'] ?? 0,
            'message' => 'Conversation created successfully'
        ]);
    }

    /**
     * Search for users on the external server
     * 
     * @NoAdminRequired
     * @NoCSRFRequired
     */
    public function searchUsers(string $search = ''): DataResponse {
        $result = $this->conversationService->searchUsers($search);

        if (!$result['success']) {
            return new DataResponse(
                ['error' => $result['error'] ?? 'Failed to search users'],
                Http::STATUS_INTERNAL_SERVER_ERROR
            );
        }

        return new DataResponse([
            'success' => true,
            'users' => $result['users']
        ]);
    }

    /**
     * Search for local users (for inviting to external conversation)
     * 
     * @NoAdminRequired
     * @NoCSRFRequired
     */
    public function searchLocalUsers(string $search = ''): DataResponse {
        $search = trim($search);
        
        if (strlen($search) < 2) {
            return new DataResponse([
                'success' => true,
                'users' => []
            ]);
        }

        $currentUser = $this->userSession->getUser();
        if ($currentUser === null) {
            return new DataResponse(
                ['error' => 'User not logged in'],
                Http::STATUS_UNAUTHORIZED
            );
        }

        try {
            // Search for users
            $foundUsers = $this->userManager->searchDisplayName($search, 20);
            
            $users = [];
            $serverHost = $this->request->getServerHost();
            
            foreach ($foundUsers as $user) {
                $userId = $user->getUID();
                
                // Skip current user
                if ($userId === $currentUser->getUID()) {
                    continue;
                }
                
                $users[] = [
                    'id' => $userId,
                    'displayName' => $user->getDisplayName(),
                    'federatedId' => $userId . '@' . $serverHost,
                ];
            }

            return new DataResponse([
                'success' => true,
                'users' => $users
            ]);
        } catch (\Exception $e) {
            return new DataResponse(
                ['error' => 'Failed to search local users: ' . $e->getMessage()],
                Http::STATUS_INTERNAL_SERVER_ERROR
            );
        }
    }
}
