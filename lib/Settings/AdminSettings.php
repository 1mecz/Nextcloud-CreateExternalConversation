<?php
declare(strict_types=1);

namespace OCA\CreateExternalConversation\Settings;

use OCA\CreateExternalConversation\AppInfo\Application;
use OCA\CreateExternalConversation\Service\SettingsService;
use OCP\AppFramework\Http\TemplateResponse;
use OCP\AppFramework\Services\IInitialState;
use OCP\Settings\ISettings;

class AdminSettings implements ISettings {
    public function __construct(
        private SettingsService $settingsService,
        private IInitialState $initialState
    ) {
    }

    public function getForm(): TemplateResponse {
        // Provide initial state to the frontend
        $this->initialState->provideInitialState(
            'admin-settings',
            $this->settingsService->getAllSettings()
        );

        return new TemplateResponse(
            Application::APP_ID,
            'admin-settings',
            [],
            ''
        );
    }

    public function getSection(): string {
        return Application::APP_ID;
    }

    public function getPriority(): int {
        return 50;
    }
}
