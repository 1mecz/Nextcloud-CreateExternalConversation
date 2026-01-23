<?php
declare(strict_types=1);

namespace OCA\CreateExternalConversation\AppInfo;

use OCP\AppFramework\App;
use OCP\AppFramework\Bootstrap\IBootContext;
use OCP\AppFramework\Bootstrap\IBootstrap;
use OCP\AppFramework\Bootstrap\IRegistrationContext;
use OCP\Util;

class Application extends App implements IBootstrap {
    public const APP_ID = 'create_external_conversation';

    public function __construct(array $urlParams = []) {
        parent::__construct(self::APP_ID, $urlParams);
    }

    public function register(IRegistrationContext $context): void {
        // Register any services here
    }

    public function boot(IBootContext $context): void {
        // Load scripts and styles when Talk is active
        $context->injectFn(function() {
            Util::addScript(self::APP_ID, 'main');
            Util::addStyle(self::APP_ID, 'main');
        });
    }
}
