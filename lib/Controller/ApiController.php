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

/**
 * OCS API Controller for Create External Conversation
 */
class ApiController extends OCSController {
    private ConversationService $conversationService;
    private SettingsService $settingsService;
    private IUserSession $userSession;

    public function __construct(
        IRequest $request,
        ConversationService $conversationService,
        SettingsService $settingsService,
        IUserSession $userSession
    ) {
        parent::__construct(Application::APP_ID, $request);
        $this->conversationService = $conversationService;
        $this->settingsService = $settingsService;
        $this->userSession = $userSession;
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
    public function createConversation(string $conversationName = '', string $federatedUserId = ''): DataResponse {
        $conversationName = trim($conversationName);
        $federatedUserId = trim($federatedUserId);

        if (empty($conversationName)) {
            return new DataResponse(
                ['error' => 'Conversation name is required'],
                Http::STATUS_BAD_REQUEST
            );
        }

        if (empty($federatedUserId)) {
            return new DataResponse(
                ['error' => 'User ID is required'],
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

        $currentUserFederatedId = $currentUser->getUID() . '@' . $this->request->getServerHost();

        $result = $this->conversationService->createExternalConversation(
            $conversationName,
            $currentUserFederatedId,
            $federatedUserId
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
            'conversationName' => $conversationName
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
}
