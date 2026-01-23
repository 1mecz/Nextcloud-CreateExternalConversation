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
    public function setConfig(string $external_url = '', string $external_username = '', string $external_password = ''): JSONResponse {
        $this->config->setAppValue('create_external_conversation', 'external_url', $external_url);
        $this->config->setAppValue('create_external_conversation', 'external_username', $external_username);
        $this->config->setAppValue('create_external_conversation', 'external_password', $external_password);

        return new JSONResponse(['status' => 'success']);
    }
}
