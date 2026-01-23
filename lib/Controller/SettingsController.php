<?php
declare(strict_types=1);

namespace OCA\CreateExternalConversation\Controller;

use OCP\AppFramework\Controller;
use OCP\AppFramework\Http\JSONResponse;
use OCP\IRequest;
use OCA\CreateExternalConversation\Service\SettingsService;

class SettingsController extends Controller {
    private $settingsService;

    public function __construct(
        string $appName,
        IRequest $request,
        SettingsService $settingsService
    ) {
        parent::__construct($appName, $request);
        $this->settingsService = $settingsService;
    }

    /**
     * @NoCSRFRequired
     */
    public function setConfig(): JSONResponse {
        $external_url = $this->request->getParam('external_url', '');
        $external_username = $this->request->getParam('external_username', '');
        $external_password = $this->request->getParam('external_password', '');
        
        $this->settingsService->saveAllSettings($external_url, $external_username, $external_password);

        return new JSONResponse([
            'status' => 'success',
            'data' => $this->settingsService->getAllSettings()
        ]);
    }
}
