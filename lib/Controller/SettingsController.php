<?php
declare(strict_types=1);

namespace OCA\CreateExternalConversation\Controller;

use OCP\AppFramework\Controller;
use OCP\AppFramework\Http\JSONResponse;
use OCP\IConfig;
use OCP\IRequest;

class SettingsController extends Controller {
    private $config;
    private $userId;

    public function __construct(
        string $appName,
        IRequest $request,
        IConfig $config,
        ?string $userId
    ) {
        parent::__construct($appName, $request);
        $this->config = $config;
        $this->userId = $userId;
    }

    /**
     * @NoAdminRequired
     */
    public function setConfig(string $external_url, string $api_token): JSONResponse {
        $this->config->setUserValue($this->userId, 'create_external_conversation', 'external_url', $external_url);
        $this->config->setUserValue($this->userId, 'create_external_conversation', 'api_token', $api_token);

        return new JSONResponse(['status' => 'success']);
    }
}
