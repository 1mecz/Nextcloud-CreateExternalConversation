<?php
declare(strict_types=1);

namespace OCA\CreateExternalConversation\Controller;

use OCP\AppFramework\Controller;
use OCP\AppFramework\Http\JSONResponse;
use OCP\IConfig;
use OCP\IRequest;
use OCP\IUserSession;

class ApiController extends Controller {
    private $config;
    private $userSession;
    private $userId;

    public function __construct(
        string $appName,
        IRequest $request,
        IConfig $config,
        IUserSession $userSession,
        ?string $userId
    ) {
        parent::__construct($appName, $request);
        $this->config = $config;
        $this->userSession = $userSession;
        $this->userId = $userId;
    }

    /**
     * @NoAdminRequired
     */
    public function createConversation(string $conversationName, string $federatedUserId): JSONResponse {
        // Get external Nextcloud configuration from system config
        $externalUrl = $this->config->getAppValue('create_external_conversation', 'external_url', '');
        $apiToken = $this->config->getAppValue('create_external_conversation', 'api_token', '');

        if (empty($externalUrl) || empty($apiToken)) {
            return new JSONResponse([
                'error' => 'External Nextcloud not configured. Please ask administrator to configure it in admin settings.'
            ], 400);
        }

        $currentUser = $this->userSession->getUser();
        if ($currentUser === null) {
            return new JSONResponse(['error' => 'User not logged in'], 401);
        }

        // Remove trailing slash from URL
        $externalUrl = rtrim($externalUrl, '/');

        // Step 1: Create conversation on external Nextcloud
        $createConversationUrl = $externalUrl . '/ocs/v2.php/apps/spreed/api/v4/room';
        
        $conversationData = [
            'roomType' => 2, // Group conversation
            'roomName' => $conversationName,
        ];

        $conversationResponse = $this->makeApiRequest($createConversationUrl, 'POST', $apiToken, $conversationData);
        
        if (!$conversationResponse || isset($conversationResponse['error'])) {
            return new JSONResponse([
                'error' => 'Failed to create conversation: ' . ($conversationResponse['error'] ?? 'Unknown error')
            ], 500);
        }

        $roomToken = $conversationResponse['ocs']['data']['token'] ?? null;
        if (!$roomToken) {
            return new JSONResponse(['error' => 'Failed to get conversation token'], 500);
        }

        // Step 2: Add federated user to the conversation
        $addParticipantUrl = $externalUrl . '/ocs/v2.php/apps/spreed/api/v4/room/' . $roomToken . '/participants';
        
        $participantData = [
            'newParticipant' => $federatedUserId,
            'source' => 'users', // or 'federated' if needed
        ];

        $addParticipantResponse = $this->makeApiRequest($addParticipantUrl, 'POST', $apiToken, $participantData);
        
        if (!$addParticipantResponse || isset($addParticipantResponse['error'])) {
            // Continue even if adding participant fails - conversation is created
            error_log('Failed to add federated user: ' . json_encode($addParticipantResponse));
        }

        // Step 3: Add current user to the conversation (federated invitation back)
        // Get current user's federated cloud ID
        $currentUserFederatedId = $currentUser->getUID() . '@' . $this->request->getServerHost();
        
        $addCurrentUserData = [
            'newParticipant' => $currentUserFederatedId,
            'source' => 'federated',
        ];

        $addCurrentUserResponse = $this->makeApiRequest($addParticipantUrl, 'POST', $apiToken, $addCurrentUserData);
        
        if (!$addCurrentUserResponse || isset($addCurrentUserResponse['error'])) {
            error_log('Failed to add current user: ' . json_encode($addCurrentUserResponse));
        }

        return new JSONResponse([
            'success' => true,
            'conversationName' => $conversationName,
            'roomToken' => $roomToken,
            'externalUrl' => $externalUrl . '/call/' . $roomToken,
        ]);
    }

    /**
     * @NoAdminRequired
     */
    public function getExternalUsers(string $search = ''): JSONResponse {
        // Get external Nextcloud configuration from system config
        $externalUrl = $this->config->getAppValue('create_external_conversation', 'external_url', '');
        $apiToken = $this->config->getAppValue('create_external_conversation', 'api_token', '');

        if (empty($externalUrl) || empty($apiToken)) {
            return new JSONResponse([
                'error' => 'External Nextcloud not configured'
            ], 400);
        }

        // Remove trailing slash from URL
        $externalUrl = rtrim($externalUrl, '/');

        // Search for users on external Nextcloud
        $searchUrl = $externalUrl . '/ocs/v2.php/cloud/users?search=' . urlencode($search);
        
        $response = $this->makeApiRequest($searchUrl, 'GET', $apiToken);
        
        if (!$response || isset($response['error'])) {
            return new JSONResponse([
                'error' => 'Failed to search users: ' . ($response['error'] ?? 'Unknown error')
            ], 500);
        }

        $users = $response['ocs']['data']['users'] ?? [];
        
        return new JSONResponse([
            'users' => $users
        ]);
    }

    private function makeApiRequest(string $url, string $method, string $token, array $data = []): ?array {
        $ch = curl_init();

        $headers = [
            'OCS-APIRequest: true',
            'Authorization: Bearer ' . $token,
            'Accept: application/json',
            'Content-Type: application/json',
        ];

        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);

        if ($method === 'POST' && !empty($data)) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        
        if (curl_errno($ch)) {
            $error = curl_error($ch);
            curl_close($ch);
            return ['error' => $error];
        }

        curl_close($ch);

        if ($httpCode >= 400) {
            return ['error' => 'HTTP ' . $httpCode . ': ' . $response];
        }

        return json_decode($response, true);
    }
}
