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
    public function __construct(
        IRequest $request,
        private ConversationService $conversationService,
        private SettingsService $settingsService,
        private IUserSession $userSession
    ) {
        parent::__construct(Application::APP_ID, $request);
    }

    /**
     * Create a conversation on the external server
     * 
     * @NoAdminRequired
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

        // Get current user's federated cloud ID
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
     * Test connection to the external server
     * 
     * @NoAdminRequired
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
            'message' => 'Connection successful'
        ]);
    }
}
