<?php
declare(strict_types=1);

namespace OCA\CreateExternalConversation\AppInfo;

use OCA\CreateExternalConversation\Listener\LoadCalendarIntegrationListener;
use OCA\CreateExternalConversation\Listener\LoadTalkIntegrationListener;
use OCP\AppFramework\App;
use OCP\AppFramework\Bootstrap\IBootContext;
use OCP\AppFramework\Bootstrap\IBootstrap;
use OCP\AppFramework\Bootstrap\IRegistrationContext;
use OCP\AppFramework\Http\Events\BeforeTemplateRenderedEvent;

class Application extends App implements IBootstrap {
    public const APP_ID = 'create_external_conversation';

    public function __construct(array $urlParams = []) {
        parent::__construct(self::APP_ID, $urlParams);
    }

    public function register(IRegistrationContext $context): void {
        // Register event listeners for Talk
        $context->registerEventListener(
            BeforeTemplateRenderedEvent::class,
            LoadTalkIntegrationListener::class
        );
        
        // Register event listeners for Calendar
        $context->registerEventListener(
            BeforeTemplateRenderedEvent::class,
            LoadCalendarIntegrationListener::class
        );
    }

    public function boot(IBootContext $context): void {
        // No boot logic required
    }
}
