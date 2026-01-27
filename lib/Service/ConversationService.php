<?php
declare(strict_types=1);

namespace OCA\CreateExternalConversation\Service;

use OCP\Http\Client\IClientService;
use OCP\IRequest;
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
        private LoggerInterface $logger,
        private IRequest $request
    ) {
    }

    /**
     * Create a new conversation on external Nextcloud
     *
     * @param string $conversationName Name of the conversation
     * @param array $participants Array of federated IDs (user@domain)
     * @return array
     */
    public function createExternalConversation(
        string $conversationName,
        array $participants = []
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

            // Step 2: Add participants
            $participantsAdded = 0;
            $participantsFailed = 0;
            
            foreach ($participants as $federatedId) {
                $federatedId = trim($federatedId);
                if (empty($federatedId)) {
                    continue;
                }
                
                $result = $this->addFederatedParticipant($token, $federatedId);
                if ($result['success']) {
                    $participantsAdded++;
                } else {
                    $participantsFailed++;
                    $this->logger->warning('Could not add federated participant', [
                        'app' => 'create_external_conversation',
                        'federatedId' => $federatedId,
                        'error' => $result['error'] ?? 'Unknown error',
                        'note' => 'User can still join via public link',
                    ]);
                }
            }

            // Generate the link
            $externalUrl = $this->settingsService->getExternalUrl();
            $link = rtrim($externalUrl, '/') . '/call/' . $token;

            return [
                'success' => true,
                'link' => $link,
                'token' => $token,
                'roomId' => $roomId,
                'conversationName' => $conversationName,
                'participantsAdded' => $participantsAdded,
                'participantsFailed' => $participantsFailed,
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
        
        // roomType 3 already allows guest access - no need to enable it separately

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
     * Add federated participant to room
     */
    private function addFederatedParticipant(string $token, string $federatedId): array {
        $externalUrl = $this->settingsService->getExternalUrl();
        $url = rtrim($externalUrl, '/') . self::TALK_API_ENDPOINT . '/' . $token . '/participants';

        // Use guest credentials to connect to external server
        $settings = $this->settingsService->getSettings();
        $guestUser = $settings['external_user'] ?? '';
        $guestPassword = $settings['external_password'] ?? '';

        $this->logger->info('Adding federated participant', [
            'app' => 'create_external_conversation',
            'url' => $url,
            'federatedId' => $federatedId,
            'guestUser' => $guestUser,
        ]);

        // Use 'source=federated_users' for federated participants
        $data = [
            'newParticipant' => $federatedId,  // username@domain.com format
            'source' => 'federated_users',     // Correct source type for federated users
        ];

        try {
            $client = $this->clientService->newClient();
            $response = $client->request('POST', $url, [
                'auth' => [$guestUser, $guestPassword],
                'form_params' => $data,
                'headers' => [
                    'OCS-APIRequest' => 'true',
                    'Accept' => 'application/json',
                ],
            ]);

            $body = $response->getBody();
            $responseData = json_decode($body, true) ?? [];
            
            $this->logger->info('Response from external server', [
                'app' => 'create_external_conversation',
                'body' => substr($body, 0, 500),
                'decoded' => $responseData,
            ]);
            
            // Check if response indicates success
            $statuscode = $responseData['ocs']['meta']['statuscode'] ?? null;
            if ($statuscode !== 200) {
                $message = $responseData['ocs']['meta']['message'] ?? 'Unknown error';
                throw new \Exception('Talk API error: ' . $message . ' (status: ' . $statuscode . ')');
            }
            
            $this->logger->info('Add federated participant response', [
                'app' => 'create_external_conversation',
                'federatedId' => $federatedId,
            ]);
            
            return [
                'success' => true,
                'participant' => $federatedId,
            ];
        } catch (\Exception $e) {
            $this->logger->error('Failed to add federated participant', [
                'app' => 'create_external_conversation',
                'federatedId' => $federatedId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Add participant to existing conversation on external server
     */
    public function addParticipantToConversation(string $token, string $federatedId): array {
        if (!$this->settingsService->isConfigured()) {
            return [
                'success' => false,
                'error' => 'App is not configured.',
            ];
        }

        return $this->addFederatedParticipant($token, $federatedId);
    }

    /**
     * Add participant to room (for local users)
     */
    private function addParticipant(string $token, string $participantId, string $source = 'users'): array {
        $externalUrl = $this->settingsService->getExternalUrl();
        // Don't include source in URL - it goes in form data
        $url = rtrim($externalUrl, '/') . self::TALK_API_ENDPOINT . '/' . $token . '/participants';

        $data = [
            'newParticipant' => $participantId,
            'source' => $source,
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

        try {
            $response = $client->request($method, $url, $options);
            $body = $response->getBody();
            $decoded = json_decode($body, true);
            
            if ($decoded === null && !empty($body)) {
                // Not valid JSON - likely an error response
                $this->logger->error('Non-JSON response from external server', [
                    'app' => 'create_external_conversation',
                    'url' => $url,
                    'body' => substr($body, 0, 500),
                ]);
                throw new \Exception('Invalid response from external server: not JSON');
            }
            
            return $decoded ?? [];
        } catch (\GuzzleHttp\Exception\ClientException $e) {
            $body = $e->getResponse()->getBody()->getContents();
            $this->logger->error('HTTP Client Error', [
                'app' => 'create_external_conversation',
                'url' => $url,
                'status' => $e->getResponse()->getStatusCode(),
                'body' => substr($body, 0, 500),
            ]);
            throw new \Exception('HTTP ' . $e->getResponse()->getStatusCode() . ': ' . $e->getMessage());
        } catch (\GuzzleHttp\Exception\ServerException $e) {
            $body = $e->getResponse()->getBody()->getContents();
            $this->logger->error('HTTP Server Error', [
                'app' => 'create_external_conversation',
                'url' => $url,
                'status' => $e->getResponse()->getStatusCode(),
                'body' => substr($body, 0, 500),
            ]);
            throw new \Exception('HTTP ' . $e->getResponse()->getStatusCode() . ': ' . $e->getMessage());
        }
    }

    /**
     * Get external conversation token for a local conversation
     * by fetching the room name and searching on external server
     */
    public function getExternalTokenForConversation(string $localToken): array {
        if (!$this->settingsService->isConfigured()) {
            return [
                'success' => false,
                'error' => 'App is not configured.',
            ];
        }

        try {
            // Step 1: Fetch the local room info from Talk API
            $localUrl = '/ocs/v2.php/apps/spreed/api/v4/room/' . $localToken;
            $localRoom = $this->fetchLocalRoom($localToken);

            if (!$localRoom) {
                return [
                    'success' => false,
                    'error' => 'Local conversation not found.',
                ];
            }

            $conversationName = $localRoom['displayName'] ?? $localRoom['name'] ?? null;
            
            if (!$conversationName) {
                return [
                    'success' => false,
                    'error' => 'Could not determine conversation name.',
                ];
            }

            $this->logger->info('Found local room', [
                'app' => 'create_external_conversation',
                'token' => $localToken,
                'name' => $conversationName,
            ]);

            // Step 2: Fetch rooms from external server
            $externalUrl = $this->settingsService->getExternalUrl();
            $roomsUrl = rtrim($externalUrl, '/') . self::TALK_API_ENDPOINT;

            $data = [];
            $response = $this->makeRequest('GET', $roomsUrl, $data, false);

            if (!isset($response['ocs']['data']) || !is_array($response['ocs']['data'])) {
                return [
                    'success' => false,
                    'error' => 'Failed to fetch rooms from external server.',
                ];
            }

            // Step 3: Search for matching room by name
            foreach ($response['ocs']['data'] as $room) {
                $externalName = $room['displayName'] ?? $room['name'] ?? null;
                
                // Check if names match
                if ($externalName && strcasecmp($externalName, $conversationName) === 0) {
                    $externalToken = $room['token'] ?? null;
                    
                    if ($externalToken) {
                        $this->logger->info('Found matching external room', [
                            'app' => 'create_external_conversation',
                            'localToken' => $localToken,
                            'externalToken' => $externalToken,
                            'name' => $conversationName,
                        ]);

                        return [
                            'success' => true,
                            'externalToken' => $externalToken,
                            'conversationName' => $conversationName,
                        ];
                    }
                }
            }

            $this->logger->warning('No matching external room found', [
                'app' => 'create_external_conversation',
                'localToken' => $localToken,
                'conversationName' => $conversationName,
                'availableRooms' => count($response['ocs']['data']),
            ]);

            return [
                'success' => false,
                'error' => 'Could not find matching conversation on external server. Make sure the conversation name matches exactly.',
            ];

        } catch (\Exception $e) {
            $this->logger->error('Failed to get external token', [
                'app' => 'create_external_conversation',
                'localToken' => $localToken,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'error' => 'Error: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Fetch local room info from Talk API
     */
    private function fetchLocalRoom(string $token): ?array {
        try {
            // Get the server host/base URL
            $baseUrl = $this->request->getServerProtocol() . '://' . $this->request->getServerHost();
            
            $url = $baseUrl . '/ocs/v2.php/apps/spreed/api/v4/room/' . urlencode($token);
            
            $this->logger->debug('Fetching local room from:', [
                'app' => 'create_external_conversation',
                'url' => $url,
                'token' => $token,
            ]);
            
            // Use local Nextcloud API without authentication (internal request)
            $client = $this->clientService->newClient();
            $response = $client->request('GET', $url, [
                'headers' => [
                    'OCS-APIRequest' => 'true',
                    'Accept' => 'application/json',
                ],
            ]);

            $body = $response->getBody();
            $data = json_decode($body, true) ?? [];

            $this->logger->debug('Local room response:', [
                'app' => 'create_external_conversation',
                'statuscode' => $data['ocs']['meta']['statuscode'] ?? null,
            ]);

            return $data['ocs']['data'] ?? null;
        } catch (\Exception $e) {
            $this->logger->warning('Failed to fetch local room', [
                'app' => 'create_external_conversation',
                'token' => $token,
                'error' => $e->getMessage(),
            ]);

            return null;
        }
    }

    /**
     * Search for rooms on external server by name
     *
     * @param string $name Name or partial name to search for
     * @return array Array of matching rooms with their tokens
     */
    public function searchRoomsByName(string $name): array {
        if (!$this->settingsService->isConfigured()) {
            throw new \Exception('External server not configured');
        }

        $settings = $this->settingsService->getSettings();
        $externalUrl = $settings['external_url'] ?? '';

        if (empty($externalUrl)) {
            throw new \Exception('External server URL not configured');
        }

        try {
            // Fetch all rooms from external server
            $url = rtrim($externalUrl, '/') . self::TALK_API_ENDPOINT;

            $client = $this->clientService->newClient();
            $response = $client->request('GET', $url, [
                'headers' => [
                    'OCS-APIRequest' => 'true',
                    'Accept' => 'application/json',
                    'Authorization' => 'Basic ' . base64_encode(
                        $settings['external_user'] . ':' . $settings['external_password']
                    ),
                ],
            ]);

            $body = $response->getBody();
            $data = json_decode($body, true) ?? [];

            $rooms = $data['ocs']['data'] ?? [];
            $nameLower = strtolower($name);
            $matches = [];

            // Filter rooms by name (case-insensitive)
            foreach ($rooms as $room) {
                $displayName = $room['displayName'] ?? $room['name'] ?? '';
                if (stripos($displayName, $name) !== false) {
                    $matches[] = [
                        'token' => $room['token'] ?? '',
                        'displayName' => $displayName,
                        'type' => $room['type'] ?? 0,
                    ];
                }
            }

            return $matches;
        } catch (\Exception $e) {
            $this->logger->error('Error searching external server rooms', [
                'app' => 'create_external_conversation',
                'name' => $name,
                'error' => $e->getMessage(),
            ]);

            throw $e;
        }
    }

    /**
     * Get room link and info from external server by name
     * Similar to federatedtalklink plugin endpoint
     *
     * @param string $name Room name to search for
     * @return array Array with 'success', 'link', 'token', 'roomInfo'
     */
    public function getRoomLink(string $name): array {
        if (!$this->settingsService->isConfigured()) {
            return [
                'success' => false,
                'error' => 'External server not configured',
            ];
        }

        $settings = $this->settingsService->getSettings();
        $externalUrl = $settings['external_url'] ?? '';

        if (empty($externalUrl)) {
            return [
                'success' => false,
                'error' => 'External server URL not configured',
            ];
        }

        try {
            // Fetch all rooms from external server
            $url = rtrim($externalUrl, '/') . self::TALK_API_ENDPOINT;

            $client = $this->clientService->newClient();
            $response = $client->request('GET', $url, [
                'headers' => [
                    'OCS-APIRequest' => 'true',
                    'Accept' => 'application/json',
                    'Authorization' => 'Basic ' . base64_encode(
                        $settings['external_user'] . ':' . $settings['external_password']
                    ),
                ],
            ]);

            $body = $response->getBody();
            $data = json_decode($body, true) ?? [];

            $rooms = $data['ocs']['data'] ?? [];

            // Find matching room
            foreach ($rooms as $room) {
                $displayName = $room['displayName'] ?? $room['name'] ?? '';
                if (stripos($displayName, $name) !== false) {
                    $token = $room['token'] ?? '';
                    $externalUrlTrimmed = rtrim($externalUrl, '/');
                    
                    return [
                        'success' => true,
                        'link' => str_replace(['https://', 'http://'], '', $externalUrlTrimmed) . '/call/' . $token,
                        'token' => $token,
                        'roomInfo' => [
                            'token' => $token,
                            'name' => $room['name'] ?? '',
                            'displayName' => $displayName,
                            'description' => $room['description'] ?? '',
                            'type' => $room['type'] ?? 0,
                        ],
                    ];
                }
            }

            return [
                'success' => false,
                'error' => 'Room not found',
            ];
        } catch (\Exception $e) {
            $this->logger->error('Error getting room link', [
                'app' => 'create_external_conversation',
                'name' => $name,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Add federated participant to external conversation
     * Uses guest credentials from settings to connect to external server
     *
     * @param string $externalToken Token of room on external server
     * @param string $federatedId Federated user ID (user@domain)
     * @return array Success status and message
     */
    public function addFederatedParticipantAsGuest(string $externalToken, string $federatedId): array {
        if (!$this->settingsService->isConfigured()) {
            return [
                'success' => false,
                'error' => 'External server not configured',
            ];
        }

        $settings = $this->settingsService->getSettings();
        $externalUrl = $settings['external_url'] ?? '';
        $guestUser = $settings['external_user'] ?? '';
        $guestPassword = $settings['external_password'] ?? '';

        if (empty($externalUrl) || empty($guestUser) || empty($guestPassword)) {
            return [
                'success' => false,
                'error' => 'Guest credentials not configured',
            ];
        }

        try {
            $url = rtrim($externalUrl, '/') . self::TALK_API_ENDPOINT . '/' . $externalToken . '/participants';

            $client = $this->clientService->newClient();
            $response = $client->request('POST', $url, [
                'auth' => [$guestUser, $guestPassword],
                'form_params' => [
                    'newParticipant' => $federatedId,
                    'source' => 'federated_users',
                ],
                'headers' => [
                    'OCS-APIRequest' => 'true',
                    'Accept' => 'application/json',
                ],
            ]);

            $body = $response->getBody();
            $data = json_decode($body, true) ?? [];

            $statusCode = $data['ocs']['meta']['statuscode'] ?? null;
            if ($statusCode === 200) {
                $this->logger->info('Added federated participant to external conversation', [
                    'app' => 'create_external_conversation',
                    'token' => $externalToken,
                    'federatedId' => $federatedId,
                ]);

                return [
                    'success' => true,
                ];
            } else {
                $message = $data['ocs']['meta']['message'] ?? 'Unknown error';
                return [
                    'success' => false,
                    'error' => 'Talk API error: ' . $message . ' (status: ' . $statusCode . ')',
                ];
            }
        } catch (\Exception $e) {
            $this->logger->error('Error adding federated participant to external conversation', [
                'app' => 'create_external_conversation',
                'token' => $externalToken,
                'federatedId' => $federatedId,
                'error' => $e->getMessage(),
            ]);

            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }


```
