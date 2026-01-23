<?php
declare(strict_types=1);

namespace OCA\CreateExternalConversation\Settings;

use OCP\AppFramework\Http\TemplateResponse;
use OCP\IConfig;
use OCP\Settings\ISettings;

class Admin implements ISettings {
    private $config;

    public function __construct(IConfig $config) {
        $this->config = $config;
    }

    public function getForm(): TemplateResponse {
        $parameters = [
            'external_url' => $this->config->getAppValue('create_external_conversation', 'external_url', ''),
            'external_username' => $this->config->getAppValue('create_external_conversation', 'external_username', ''),
            'external_password' => $this->config->getAppValue('create_external_conversation', 'external_password', ''),
        ];

        return new TemplateResponse('create_external_conversation', 'settings/admin', $parameters, '');
    }

    public function getSection(): string {
        return 'create_external_conversation';
    }

    public function getPriority(): int {
        return 50;
    }
}
