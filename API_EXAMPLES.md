# API Examples

This document provides examples of how the Create External Conversation app uses the Nextcloud API.

## Authentication

All API requests use Bearer token authentication:

```bash
Authorization: Bearer YOUR_API_TOKEN
```

## Creating a Conversation

### Request

```bash
curl -X POST \
  'https://external-nextcloud.com/ocs/v2.php/apps/spreed/api/v4/room' \
  -H 'OCS-APIRequest: true' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json' \
  -d '{
    "roomType": 2,
    "roomName": "Team Meeting"
  }'
```

### Response

```json
{
  "ocs": {
    "meta": {
      "status": "ok",
      "statuscode": 201
    },
    "data": {
      "id": 12345,
      "token": "abc123def456",
      "type": 2,
      "name": "Team Meeting",
      "displayName": "Team Meeting",
      "participantType": 1,
      "attendeeId": 1,
      "attendeePin": "",
      "actorType": "users",
      "actorId": "admin",
      "permissions": 0,
      "attendeePermissions": 0,
      "callPermissions": 0,
      "defaultPermissions": 0,
      "notificationLevel": 1
    }
  }
}
```

### Room Types

- `1` - One-to-one conversation
- `2` - Group conversation
- `3` - Public conversation
- `4` - Changelog conversation

## Adding Participants

### Add Local User

```bash
curl -X POST \
  'https://external-nextcloud.com/ocs/v2.php/apps/spreed/api/v4/room/abc123def456/participants' \
  -H 'OCS-APIRequest: true' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json' \
  -d '{
    "newParticipant": "username",
    "source": "users"
  }'
```

### Add Federated User

```bash
curl -X POST \
  'https://external-nextcloud.com/ocs/v2.php/apps/spreed/api/v4/room/abc123def456/participants' \
  -H 'OCS-APIRequest: true' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Content-Type: application/json' \
  -H 'Accept: application/json' \
  -d '{
    "newParticipant": "user@other-nextcloud.com",
    "source": "federated"
  }'
```

### Response

```json
{
  "ocs": {
    "meta": {
      "status": "ok",
      "statuscode": 200
    },
    "data": {
      "id": 12345,
      "token": "abc123def456",
      "type": 2,
      "name": "Team Meeting",
      "displayName": "Team Meeting"
    }
  }
}
```

## Searching Users

### Request

```bash
curl -X GET \
  'https://external-nextcloud.com/ocs/v2.php/cloud/users?search=john' \
  -H 'OCS-APIRequest: true' \
  -H 'Authorization: Bearer YOUR_TOKEN' \
  -H 'Accept: application/json'
```

### Response

```json
{
  "ocs": {
    "meta": {
      "status": "ok",
      "statuscode": 200
    },
    "data": {
      "users": [
        "john",
        "johnny",
        "john.doe"
      ]
    }
  }
}
```

## JavaScript Usage in App

### Create Conversation

```javascript
// In js/main.js
OCA.CreateExternalConversation.createConversation = function(conversationName, federatedUserId, callback) {
    $.ajax({
        url: OC.generateUrl('/apps/create_external_conversation/api/v1/conversation'),
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({
            conversationName: conversationName,
            federatedUserId: federatedUserId
        }),
        success: function(response) {
            callback(response);
        },
        error: function(xhr) {
            const response = xhr.responseJSON || { error: 'Unknown error' };
            callback(response);
        }
    });
};
```

### Search Users

```javascript
// In js/main.js
OCA.CreateExternalConversation.searchUsers = function(searchTerm, callback) {
    $.ajax({
        url: OC.generateUrl('/apps/create_external_conversation/api/v1/users'),
        type: 'GET',
        data: { search: searchTerm },
        success: function(response) {
            callback(response.users || []);
        },
        error: function() {
            callback([]);
        }
    });
};
```

## PHP Backend Examples

### Making API Request

```php
// In lib/Controller/ApiController.php
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
```

### Create Conversation

```php
// In lib/Controller/ApiController.php
public function createConversation(string $conversationName, string $federatedUserId): JSONResponse {
    $externalUrl = $this->config->getUserValue($this->userId, 'create_external_conversation', 'external_url', '');
    $apiToken = $this->config->getUserValue($this->userId, 'create_external_conversation', 'api_token', '');

    if (empty($externalUrl) || empty($apiToken)) {
        return new JSONResponse([
            'error' => 'External Nextcloud not configured'
        ], 400);
    }

    $externalUrl = rtrim($externalUrl, '/');
    $createConversationUrl = $externalUrl . '/ocs/v2.php/apps/spreed/api/v4/room';
    
    $conversationData = [
        'roomType' => 2,
        'roomName' => $conversationName,
    ];

    $conversationResponse = $this->makeApiRequest($createConversationUrl, 'POST', $apiToken, $conversationData);
    
    if (!$conversationResponse || isset($conversationResponse['error'])) {
        return new JSONResponse([
            'error' => 'Failed to create conversation: ' . ($conversationResponse['error'] ?? 'Unknown error')
        ], 500);
    }

    $roomToken = $conversationResponse['ocs']['data']['token'] ?? null;
    
    return new JSONResponse([
        'success' => true,
        'conversationName' => $conversationName,
        'roomToken' => $roomToken,
        'externalUrl' => $externalUrl . '/call/' . $roomToken,
    ]);
}
```

## Error Handling

### Common Error Responses

#### 401 Unauthorized
```json
{
  "error": "HTTP 401: Unauthorized"
}
```

**Causes**: Invalid or expired token

#### 404 Not Found
```json
{
  "error": "HTTP 404: Not Found"
}
```

**Causes**: User doesn't exist, conversation not found

#### 400 Bad Request
```json
{
  "error": "External Nextcloud not configured"
}
```

**Causes**: Missing configuration in settings

#### 500 Internal Server Error
```json
{
  "error": "Failed to create conversation: Unknown error"
}
```

**Causes**: Server error, network issues, SSL problems

## Testing with curl

### Complete Flow Example

```bash
#!/bin/bash

# Configuration
EXTERNAL_URL="https://external-nextcloud.com"
API_TOKEN="your-api-token-here"

# 1. Create conversation
ROOM_RESPONSE=$(curl -s -X POST \
  "${EXTERNAL_URL}/ocs/v2.php/apps/spreed/api/v4/room" \
  -H "OCS-APIRequest: true" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "roomType": 2,
    "roomName": "Test Conversation"
  }')

echo "Room created:"
echo "$ROOM_RESPONSE" | jq .

# Extract room token
ROOM_TOKEN=$(echo "$ROOM_RESPONSE" | jq -r '.ocs.data.token')

# 2. Add local user
USER_RESPONSE=$(curl -s -X POST \
  "${EXTERNAL_URL}/ocs/v2.php/apps/spreed/api/v4/room/${ROOM_TOKEN}/participants" \
  -H "OCS-APIRequest: true" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "newParticipant": "alice",
    "source": "users"
  }')

echo "User added:"
echo "$USER_RESPONSE" | jq .

# 3. Add federated user
FEDERATED_RESPONSE=$(curl -s -X POST \
  "${EXTERNAL_URL}/ocs/v2.php/apps/spreed/api/v4/room/${ROOM_TOKEN}/participants" \
  -H "OCS-APIRequest: true" \
  -H "Authorization: Bearer ${API_TOKEN}" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{
    "newParticipant": "bob@other-nextcloud.com",
    "source": "federated"
  }')

echo "Federated user added:"
echo "$FEDERATED_RESPONSE" | jq .

echo ""
echo "Conversation URL: ${EXTERNAL_URL}/call/${ROOM_TOKEN}"
```

Make the script executable and run:

```bash
chmod +x test-api.sh
./test-api.sh
```
