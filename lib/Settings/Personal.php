<?php
declare(strict_types=1);

namespace OCA\CreateExternalConversation\Settings;

use OCP\AppFramework\Http\TemplateResponse;
use OCP\IConfig;
use OCP\Settings\ISettings;

class Personal implements ISettings {
    private $config;
    private $userId;

    public function __construct(IConfig $config, ?string $userId) {
        $this->config = $config;
        $this->userId = $userId;
    }

    public function getForm(): TemplateResponse {
        $parameters = [
            'external_url' => $this->config->getUserValue($this->userId, 'create_external_conversation', 'external_url', ''),
            'api_token' => $this->config->getUserValue($this->userId, 'create_external_conversation', 'api_token', ''),
        ];

        return new TemplateResponse('create_external_conversation', 'settings/personal', $parameters, '');
    }

    public function getSection(): string {
        return 'additional';
    }

    public function getPriority(): int {
        return 50;
    }
}
