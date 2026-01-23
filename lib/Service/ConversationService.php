<?php
declare(strict_types=1);

namespace OCA\CreateExternalConversation\Service;

use OCP\Http\Client\IClientService;
use Psr\Log\LoggerInterface;

/**
 * Service for creating conversations on external Nextcloud
 */
class ConversationService {
    private const TALK_API_ENDPOINT = '/ocs/v2.php/apps/spreed/api/v4/room';
    private const USERS_API_ENDPOINT = '/ocs/v2.php/cloud/users';

    public function __construct(
        private SettingsService $settingsService,
        private IClientService $clientService,
        private LoggerInterface $logger
    ) {
    }

    /**
     * Create a new conversation on external Nextcloud
     *
     * @param string $conversationName Name of the conversation
     * @param string $currentUserFederatedId Federated ID of current user (user@domain)
     * @return array
     */
    public function createExternalConversation(
        string $conversationName,
        string $currentUserFederatedId
    ): array {
        if (!$this->settingsService->isConfigured()) {
            return [
                'success' => false,
                'error' => 'App is not configured. Please ask administrator to configure it.',
            ];
        }

        $conversationName = trim($conversationName);
        if (empty($conversationName)) {
            return [
                'success' => false,
                'error' => 'Conversation name cannot be empty.',
            ];
        }

        try {
            // Step 1: Create conversation
            $createResult = $this->createRoom($conversationName);
            
            if (!$createResult['success']) {
                return $createResult;
            }

            $token = $createResult['token'];
            $roomId = $createResult['roomId'];

            // Step 2: Add current user as federated participant
            $addCurrentUserResult = $this->addParticipant($token, $currentUserFederatedId, 'federated');

            // Generate the link
            $externalUrl = $this->settingsService->getExternalUrl();
            $link = rtrim($externalUrl, '/') . '/call/' . $token;

            return [
                'success' => true,
                'link' => $link,
                'token' => $token,
                'roomId' => $roomId,
                'conversationName' => $conversationName,
                'currentUserAdded' => $addCurrentUserResult['success'] ?? false,
            ];

        } catch (\Exception $e) {
            $this->logger->error('Failed to create external conversation', [
                'app' => 'create_external_conversation',
                'exception' => $e,
                'conversationName' => $conversationName,
            ]);

            return [
                'success' => false,
                'error' => 'Failed to create conversation: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Create a new room on external server
     */
    private function createRoom(string $roomName): array {
        $externalUrl = $this->settingsService->getExternalUrl();
        $url = rtrim($externalUrl, '/') . self::TALK_API_ENDPOINT;

        $data = [
            'roomType' => 3, // Public conversation (allows guests via link)
            'roomName' => $roomName,
        ];

        $response = $this->makeRequest('POST', $url, $data, true);  // true = form data

        if (!isset($response['ocs']['data']['token'])) {
            return [
                'success' => false,
                'error' => 'Failed to create room: ' . ($response['error'] ?? 'Unknown error'),
            ];
        }

        $token = $response['ocs']['data']['token'];
        
        // Enable guest access via link by setting it public
        try {
            $this->enableGuestAccess($token);
        } catch (\Exception $e) {
            $this->logger->warning('Failed to enable guest access', [
                'app' => 'create_external_conversation',
                'token' => $token,
                'error' => $e->getMessage(),
            ]);
        }

        return [
            'success' => true,
            'token' => $token,
            'roomId' => $response['ocs']['data']['id'] ?? null,
        ];
    }

    /**
     * Enable guest access for a room
     */
    private function enableGuestAccess(string $token): void {
        $externalUrl = $this->settingsService->getExternalUrl();
        $url = rtrim($externalUrl, '/') . self::TALK_API_ENDPOINT . '/' . $token;

        $data = [
            'allowGuests' => 'yes',  // Talk API expects 'yes' string
        ];

        $this->makeRequest('PUT', $url, $data, true);  // true = form data
    }

    /**
     * Add participant to room
     */
    private function addParticipant(string $token, string $participantId, string $source = 'users'): array {
        $externalUrl = $this->settingsService->getExternalUrl();
        // source is a query parameter, not in body
        $url = rtrim($externalUrl, '/') . self::TALK_API_ENDPOINT . '/' . $token . '/participants?source=' . urlencode($source);

        $data = [
            'newParticipant' => $participantId,
        ];

        try {
            $response = $this->makeRequest('POST', $url, $data, true);  // true = form data
            
            $this->logger->info('Add participant response', [
                'app' => 'create_external_conversation',
                'participant' => $participantId,
                'source' => $source,
                'response' => $response,
            ]);
            
            return [
                'success' => true,
                'participant' => $participantId,
            ];
        } catch (\Exception $e) {
            $this->logger->error('Failed to add participant', [
                'app' => 'create_external_conversation',
                'participant' => $participantId,
                'source' => $source,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Search for users on external server
     */
    public function searchUsers(string $search = ''): array {
        if (!$this->settingsService->isConfigured()) {
            return [
                'success' => false,
                'error' => 'App is not configured.',
            ];
        }

        $externalUrl = $this->settingsService->getExternalUrl();
        $url = rtrim($externalUrl, '/') . self::USERS_API_ENDPOINT;
        
        if (!empty($search)) {
            $url .= '?search=' . urlencode($search);
        }

        try {
            $response = $this->makeRequest('GET', $url);
            
            $users = $response['ocs']['data']['users'] ?? [];
            
            return [
                'success' => true,
                'users' => $users,
            ];
        } catch (\Exception $e) {
            $this->logger->error('Failed to search users', [
                'app' => 'create_external_conversation',
                'exception' => $e,
            ]);

            return [
                'success' => false,
                'error' => 'Failed to search users: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Test connection to external server
     */
    public function testConnection(): array {
        if (!$this->settingsService->isConfigured()) {
            return [
                'success' => false,
                'error' => 'App is not configured.',
            ];
        }

        try {
            $externalUrl = $this->settingsService->getExternalUrl();
            $url = rtrim($externalUrl, '/') . '/ocs/v2.php/cloud/capabilities';

            $response = $this->makeRequest('GET', $url);

            if (isset($response['ocs']['meta']['status']) && $response['ocs']['meta']['status'] === 'ok') {
                return [
                    'success' => true,
                    'message' => 'Connection successful',
                ];
            }

            return [
                'success' => false,
                'error' => 'Invalid response from server',
            ];
        } catch (\Exception $e) {
            $this->logger->error('Connection test failed', [
                'app' => 'create_external_conversation',
                'exception' => $e,
            ]);

            return [
                'success' => false,
                'error' => 'Connection failed: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Make HTTP request to external server
     * 
     * @param string $method HTTP method
     * @param string $url Full URL
     * @param array $data Request data
     * @param bool $useFormData Whether to send as form data (default: false = JSON)
     */
    private function makeRequest(string $method, string $url, array $data = [], bool $useFormData = false): array {
        $username = $this->settingsService->getUsername();
        $password = $this->settingsService->getPassword();

        $client = $this->clientService->newClient();
        
        $options = [
            'auth' => [$username, $password],
            'headers' => [
                'OCS-APIRequest' => 'true',
                'Accept' => 'application/json',
            ],
        ];

        if (!empty($data)) {
            if ($useFormData) {
                // Send as form data (application/x-www-form-urlencoded)
                $options['form_params'] = $data;
                $options['headers']['Content-Type'] = 'application/x-www-form-urlencoded';
            } else {
                // Send as JSON
                $options['json'] = $data;
                $options['headers']['Content-Type'] = 'application/json';
            }
        }

        $response = $client->request($method, $url, $options);
        $body = $response->getBody();
        
        return json_decode($body, true) ?? [];
    }
}
