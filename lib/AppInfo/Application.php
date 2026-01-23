<?php
declare(strict_types=1);

namespace OCA\CreateExternalConversation\AppInfo;

use OCA\CreateExternalConversation\Listener\LoadTalkIntegrationListener;
use OCA\CreateExternalConversation\Service\ConversationService;
use OCA\CreateExternalConversation\Service\SettingsService;
use OCP\AppFramework\App;
use OCP\AppFramework\Bootstrap\IBootContext;
use OCP\AppFramework\Bootstrap\IBootstrap;
use OCP\AppFramework\Bootstrap\IRegistrationContext;
use OCP\AppFramework\Http\Events\BeforeTemplateRenderedEvent;
use OCP\Http\Client\IClientService;
use OCP\IConfig;
use OCP\Security\ICrypto;
use Psr\Log\LoggerInterface;

class Application extends App implements IBootstrap {
    public const APP_ID = 'create_external_conversation';

    public function __construct(array $urlParams = []) {
        parent::__construct(self::APP_ID, $urlParams);
    }

    public function register(IRegistrationContext $context): void {
        // Register services
        $context->registerService(SettingsService::class, function ($c) {
            return new SettingsService(
                $c->get(IConfig::class),
                $c->get(ICrypto::class)
            );
        });

        $context->registerService(ConversationService::class, function ($c) {
            return new ConversationService(
                $c->get(IClientService::class),
                $c->get(SettingsService::class),
                $c->get(LoggerInterface::class)
            );
        });

        // Register event listeners
        $context->registerEventListener(
            BeforeTemplateRenderedEvent::class,
            LoadTalkIntegrationListener::class
        );
    }

    public function boot(IBootContext $context): void {
        // No boot logic required
    }
}
