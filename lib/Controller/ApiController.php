<?php
declare(strict_types=1);

namespace OCA\CreateExternalConversation\Controller;

use OCA\CreateExternalConversation\AppInfo\Application;
use OCP\AppFramework\Http\DataResponse;
use OCP\AppFramework\OCSController;
use OCP\IRequest;

/**
 * OCS API Controller for Create External Conversation
 */
class ApiController extends OCSController {
    
    public function __construct(IRequest $request) {
        parent::__construct(Application::APP_ID, $request);
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
        return new DataResponse([
            'success' => true,
            'message' => 'Test connection works'
        ]);
    }

    /**
     * Create a conversation on the external server
     * 
     * @NoAdminRequired
     * @NoCSRFRequired
     */
    public function createConversation(): DataResponse {
        return new DataResponse([
            'success' => true,
            'message' => 'Create conversation endpoint works'
        ]);
    }

    /**
     * Search for users on the external server
     * 
     * @NoAdminRequired
     * @NoCSRFRequired
     */
    public function searchUsers(): DataResponse {
        return new DataResponse([
            'success' => true,
            'users' => []
        ]);
    }
}
