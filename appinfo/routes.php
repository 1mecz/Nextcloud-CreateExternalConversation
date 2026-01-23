<?php
declare(strict_types=1);

return [
    'routes' => [
        ['name' => 'Api#createConversation', 'url' => '/api/v1/conversation', 'verb' => 'POST'],
        ['name' => 'Api#getExternalUsers', 'url' => '/api/v1/users', 'verb' => 'GET'],
        ['name' => 'Settings#setConfig', 'url' => '/settings', 'verb' => 'POST'],
    ]
];
