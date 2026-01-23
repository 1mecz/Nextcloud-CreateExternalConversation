<?php

declare(strict_types=1);

namespace OCA\CreateExternalConversation\Listener;

use OCA\CreateExternalConversation\AppInfo\Application;
use OCA\CreateExternalConversation\Service\SettingsService;
use OCP\AppFramework\Http\Events\BeforeTemplateRenderedEvent;
use OCP\EventDispatcher\Event;
use OCP\EventDispatcher\IEventListener;
use OCP\Util;

/**
 * Listener to load Talk integration script
 *
 * @template-implements IEventListener<BeforeTemplateRenderedEvent>
 */
class LoadTalkIntegrationListener implements IEventListener
{
    public function __construct(
        private SettingsService $settingsService
    ) {
    }

    public function handle(Event $event): void
    {
        if (!($event instanceof BeforeTemplateRenderedEvent)) {
            return;
        }

        // Only load if the app is configured
        if (!$this->settingsService->isConfigured()) {
            return;
        }

        // Check if we're on a Talk page
        $appId = $event->getResponse()->getApp();
        if ($appId !== 'spreed') {
            return;
        }

        // Load our Talk integration script and styles
        Util::addScript(Application::APP_ID, 'main');
        Util::addStyle(Application::APP_ID, 'main');
    }
}
