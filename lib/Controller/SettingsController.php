<?php
declare(strict_types=1);

namespace OCA\CreateExternalConversation\Controller;

use OCA\CreateExternalConversation\AppInfo\Application;
use OCA\CreateExternalConversation\Service\SettingsService;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Http;
use OCP\AppFramework\Http\JSONResponse;
use OCP\AppFramework\Http\TemplateResponse;
use OCP\IRequest;

/**
 * Controller for admin settings
 */
class SettingsController extends Controller {
    
    private SettingsService $settingsService;
    
    public function __construct(
        IRequest $request,
        SettingsService $settingsService
    ) {
        parent::__construct(Application::APP_ID, $request);
        $this->settingsService = $settingsService;
    }

    /**
     * Show the settings page
     * 
     * @AuthorizedAdminSetting(settings=OCA\CreateExternalConversation\Settings\AdminSettings)
     */
    public function index(): TemplateResponse {
        return new TemplateResponse(
            Application::APP_ID,
            'settings',
            [
                'settings' => $this->settingsService->getAllSettings(),
            ]
        );
    }

    /**
     * Save settings
     * 
     * @AuthorizedAdminSetting(settings=OCA\CreateExternalConversation\Settings\AdminSettings)
     */
    public function save(): JSONResponse {
        $externalServerUrl = $this->request->getParam('externalServerUrl', '');
        $username = $this->request->getParam('username', '');
        $password = $this->request->getParam('password', null);

        // Validate required fields
        if (empty($externalServerUrl)) {
            return new JSONResponse(
                ['error' => 'External server URL is required'],
                Http::STATUS_BAD_REQUEST
            );
        }

        if (empty($username)) {
            return new JSONResponse(
                ['error' => 'Username is required'],
                Http::STATUS_BAD_REQUEST
            );
        }

        // Validate URL
        if (!filter_var('https://' . ltrim($externalServerUrl, 'https://'), FILTER_VALIDATE_URL)) {
            return new JSONResponse(
                ['error' => 'Invalid external server URL format'],
                Http::STATUS_BAD_REQUEST
            );
        }

        // Save settings
        $this->settingsService->saveAllSettings(
            $externalServerUrl,
            $username,
            $password
        );

        return new JSONResponse([
            'success' => true,
            'message' => 'Settings saved successfully',
            'settings' => $this->settingsService->getAllSettings()
        ]);
    }
}
