<?php

declare(strict_types=1);

return [
    'routes' => [
        // Admin settings page
        [
            'name' => 'settings#index',
            'url' => '/settings',
            'verb' => 'GET',
        ],
        [
            'name' => 'settings#save',
            'url' => '/settings',
            'verb' => 'POST',
        ],

        // Web API endpoint to search local users (fallback when OCS is blocked)
        [
            'name' => 'api#searchLocalUsers',
            'url' => '/local-users',
            'verb' => 'GET',
        ],

        // Simple ping endpoint (web route) to verify routing works
        [
            'name' => 'api#ping',
            'url' => '/ping',
            'verb' => 'GET',
        ],
    ],

    'ocs' => [
        // OCS API endpoint to create conversation
        [
            'name' => 'api#createConversation',
            'url' => '/api/v1/conversation',
            'verb' => 'POST',
        ],

        // OCS API endpoint to search users on external server
        [
            'name' => 'api#searchUsers',
            'url' => '/api/v1/users',
            'verb' => 'GET',
        ],

        // OCS API endpoint to search local users (for inviting)
        [
            'name' => 'api#searchLocalUsers',
            'url' => '/api/v1/local-users',
            'verb' => 'GET',
        ],

        // OCS API endpoint to test connection
        [
            'name' => 'api#testConnection',
            'url' => '/api/v1/test',
            'verb' => 'GET',
        ],

        // OCS API endpoint to add participant to existing conversation
        [
            'name' => 'api#addParticipant',
            'url' => '/api/v1/conversation/{token}/participants',
            'verb' => 'POST',
        ],
    ],
];
