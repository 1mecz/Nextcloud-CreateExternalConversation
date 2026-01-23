<?php
declare(strict_types=1);

namespace OCA\CreateExternalConversation\Controller;

use OCP\AppFramework\Controller;
use OCP\AppFramework\Http\JSONResponse;
use OCP\IConfig;
use OCP\IRequest;

class SettingsController extends Controller {
    private $config;

    public function __construct(
        string $appName,
        IRequest $request,
        IConfig $config
    ) {
        parent::__construct($appName, $request);
        $this->config = $config;
    }

    /**
     * @NoCSRFRequired
     */
    public function setConfig(): JSONResponse {
        $external_url = $this->request->getParam('external_url', '');
        $external_username = $this->request->getParam('external_username', '');
        $external_password = $this->request->getParam('external_password', '');
        
        // Normalize URL - remove trailing slash
        $external_url = rtrim(trim($external_url), '/');
        
        $this->config->setAppValue('create_external_conversation', 'external_url', $external_url);
        $this->config->setAppValue('create_external_conversation', 'external_username', trim($external_username));
        $this->config->setAppValue('create_external_conversation', 'external_password', $external_password);

        return new JSONResponse([
            'status' => 'success',
            'data' => [
                'external_url' => $external_url,
                'external_username' => $external_username
            ]
        ]);
    }
}
