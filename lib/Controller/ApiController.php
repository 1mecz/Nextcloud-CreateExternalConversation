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
     * Add participant to existing conversation on external server
     * 
     * @NoAdminRequired
     * @NoCSRFRequired
     */
    public function addParticipant(string $token = ''): DataResponse {
        $token = trim($token);
        
        // Extract federatedId from request body
        // Support both JSON and form-data
        $federatedId = trim($this->request->getParam('federatedId', ''));
        if (empty($federatedId)) {
            // Try getting from raw JSON body as fallback
            $body = $this->request->getStream()->getContents();
            if (!empty($body)) {
                try {
                    $data = json_decode($body, true);
                    if (is_array($data) && isset($data['federatedId'])) {
                        $federatedId = trim($data['federatedId']);
                    }
                } catch (\Exception $e) {
                    // Ignore JSON parsing errors
                }
            }
        }

        if (empty($token)) {
            return new DataResponse(
                ['error' => 'Token is required'],
                Http::STATUS_BAD_REQUEST
            );
        }

        if (empty($federatedId)) {
            return new DataResponse(
                ['error' => 'Federated ID is required'],
                Http::STATUS_BAD_REQUEST
            );
        }

        try {
            $result = $this->conversationService->addParticipantToConversation($token, $federatedId);

            if (!$result['success']) {
                return new DataResponse(
                    ['error' => $result['error'] ?? 'Failed to add participant'],
                    Http::STATUS_INTERNAL_SERVER_ERROR
                );
            }

            return new DataResponse([
                'success' => true,
                'message' => 'Participant added successfully',
                'federatedId' => $federatedId,
            ]);
        } catch (\Exception $e) {
            return new DataResponse(
                ['error' => $e->getMessage()],
                Http::STATUS_INTERNAL_SERVER_ERROR
            );
        }
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
            $users = [];
            $serverHost = $this->request->getServerHost();
            
            // Search by display name
            $foundByDisplay = $this->userManager->searchDisplayName($search, 20);
            foreach ($foundByDisplay as $user) {
                $userId = $user->getUID();
                $users[$userId] = [
                    'id' => $userId,
                    'displayName' => $user->getDisplayName(),
                    'federatedId' => $userId . '@' . $serverHost,
                ];
            }

            // Fallback search by userId/uid (some instances have empty display names)
            $foundByUid = $this->userManager->search($search, 20);
            foreach ($foundByUid as $user) {
                $userId = $user->getUID();
                if (!isset($users[$userId])) {
                    $users[$userId] = [
                        'id' => $userId,
                        'displayName' => $user->getDisplayName() ?: $userId,
                        'federatedId' => $userId . '@' . $serverHost,
                    ];
                }
            }

            // Remove current user from results
            unset($users[$currentUser->getUID()]);

            return new DataResponse([
                'success' => true,
                'users' => array_values($users)
            ]);
        } catch (\Exception $e) {
            return new DataResponse(
                ['error' => 'Failed to search local users: ' . $e->getMessage()],
                Http::STATUS_INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * Get external conversation token for a local conversation
     * 
     * @NoAdminRequired
     * @NoCSRFRequired
     */
    public function getExternalToken(string $token = ''): DataResponse {
        $token = trim($token);

        if (empty($token)) {
            return new DataResponse(
                ['error' => 'Token is required'],
                Http::STATUS_BAD_REQUEST
            );
        }

        $result = $this->conversationService->getExternalTokenForConversation($token);

        if (!$result['success']) {
            return new DataResponse(
                ['error' => $result['error'] ?? 'Failed to get external token'],
                Http::STATUS_INTERNAL_SERVER_ERROR
            );
        }

        return new DataResponse([
            'success' => true,
            'externalToken' => $result['externalToken'],
            'conversationName' => $result['conversationName'] ?? null,
        ]);
    }

    /**
     * Search for rooms on external server by name
     *
     * @NoAdminRequired
     * @NoCSRFRequired
     */
    public function searchRooms(string $name = ''): DataResponse {
        $name = trim($name);

        if (empty($name)) {
            return new DataResponse(
                ['success' => false, 'error' => 'Name is required'],
                Http::STATUS_BAD_REQUEST
            );
        }

        try {
            $rooms = $this->conversationService->searchRoomsByName($name);
            
            return new DataResponse([
                'success' => true,
                'rooms' => $rooms
            ]);
        } catch (\Exception $e) {
            $this->logger->error('Error searching external server rooms', [
                'exception' => $e->getMessage()
            ]);

            return new DataResponse(
                ['success' => false, 'error' => 'Failed to search external server'],
                Http::STATUS_INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * Get room link (token and info) from external server by name
     * Similar to federatedtalklink plugin
     *
     * @NoAdminRequired
     * @NoCSRFRequired
     */
    public function getRoomLink(string $name = ''): DataResponse {
        $name = trim($name);

        if (empty($name)) {
            return new DataResponse(
                ['error' => 'Name is required'],
                Http::STATUS_BAD_REQUEST
            );
        }

        try {
            $result = $this->conversationService->getRoomLink($name);
            
            if (!$result['success']) {
                return new DataResponse(
                    ['error' => $result['error'] ?? 'Room not found'],
                    Http::STATUS_NOT_FOUND
                );
            }

            return new DataResponse([
                'link' => $result['link'],
                'token' => $result['token'],
                'roomInfo' => $result['roomInfo'] ?? [],
            ]);
        } catch (\Exception $e) {
            $this->logger->error('Error getting room link', [
                'exception' => $e->getMessage()
            ]);

            return new DataResponse(
                ['error' => 'Failed to get room link'],
                Http::STATUS_INTERNAL_SERVER_ERROR
            );
        }
    }

    /**
     * Add federated participant to external conversation
     * Connects to external server using guest credentials from settings
    /**
     * Add federated participant to external conversation
     * Connects to external server using guest credentials from settings
     *
     * @NoAdminRequired
     * @NoCSRFRequired
     */
    public function addFederatedParticipant(string $token = ''): DataResponse {
        $token = trim($token);

        if (empty($token)) {
            return new DataResponse(
                ['error' => 'Token is required'],
                Http::STATUS_BAD_REQUEST
            );
        }

        // Extract federatedId from request body (supports FormData)
        $federatedId = trim($this->request->getParam('federatedId', ''));

        if (empty($federatedId)) {
            return new DataResponse(
                ['error' => 'Federated ID is required'],
                Http::STATUS_BAD_REQUEST
            );
        }

        try {
            $result = $this->conversationService->addParticipantToConversation($token, $federatedId);

            if (!$result['success']) {
                return new DataResponse(
                    ['error' => $result['error'] ?? 'Failed to add participant'],
                    Http::STATUS_INTERNAL_SERVER_ERROR
                );
            }

            return new DataResponse([
                'success' => true,
                'message' => 'Participant added successfully',
                'federatedId' => $federatedId,
            ]);
        } catch (\Exception $e) {
            $this->logger->error('Error adding federated participant', [
                'exception' => $e->getMessage()
            ]);

            return new DataResponse(
                ['error' => 'Failed to add participant'],
                Http::STATUS_INTERNAL_SERVER_ERROR
            );
        }
    }
}
