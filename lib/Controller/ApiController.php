<?php
declare(strict_types=1);

namespace OCA\CreateExternalConversation\Controller;

use OCP\AppFramework\Controller;
use OCP\AppFramework\Http\JSONResponse;
use OCP\AppFramework\Http\Attribute\NoAdminRequired;
use OCP\IRequest;
use OCP\IUserSession;
use OCA\CreateExternalConversation\Service\ConversationService;
use OCA\CreateExternalConversation\Service\SettingsService;

class ApiController extends Controller {
    private $userSession;
    private $conversationService;
    private $settingsService;

    public function __construct(
        string $appName,
        IRequest $request,
        IUserSession $userSession,
        ConversationService $conversationService,
        SettingsService $settingsService
    ) {
        parent::__construct($appName, $request);
        $this->userSession = $userSession;
        $this->conversationService = $conversationService;
        $this->settingsService = $settingsService;
    }

    /**
     * @NoAdminRequired
     */
    public function createConversation(string $conversationName = '', string $federatedUserId = ''): JSONResponse {
        $conversationName = trim($conversationName);
        $federatedUserId = trim($federatedUserId);

        if (empty($conversationName)) {
            return new JSONResponse([
                'success' => false,
                'error' => 'Conversation name is required.'
            ], 400);
        }

        if (empty($federatedUserId)) {
            return new JSONResponse([
                'success' => false,
                'error' => 'User ID is required.'
            ], 400);
        }

        $currentUser = $this->userSession->getUser();
        if ($currentUser === null) {
            return new JSONResponse([
                'success' => false,
                'error' => 'User not logged in'
            ], 401);
        }

        // Get current user's federated cloud ID
        $currentUserFederatedId = $currentUser->getUID() . '@' . $this->request->getServerHost();

        $result = $this->conversationService->createExternalConversation(
            $conversationName,
            $currentUserFederatedId,
            $federatedUserId
        );

        if (!$result['success']) {
            return new JSONResponse($result, 500);
        }

        return new JSONResponse($result);
    }

    /**
     * @NoAdminRequired
     */
    public function getExternalUsers(string $search = ''): JSONResponse {
        $result = $this->conversationService->searchUsers($search);

        if (!$result['success']) {
            return new JSONResponse($result, 500);
        }

        return new JSONResponse([
            'users' => $result['users']
        ]);
    }
}
