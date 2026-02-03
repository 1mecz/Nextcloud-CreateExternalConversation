<?php

declare(strict_types=1);

namespace OCA\CreateExternalConversation\Listener;

use OCA\CreateExternalConversation\AppInfo\Application;
use OCP\AppFramework\Http\Events\BeforeTemplateRenderedEvent;
use OCP\EventDispatcher\Event;
use OCP\EventDispatcher\IEventListener;
use OCP\Util;

/**
 * Listener to load Calendar integration script
 *
 * @template-implements IEventListener<BeforeTemplateRenderedEvent>
 */
class LoadCalendarIntegrationListener implements IEventListener
{
    public function handle(Event $event): void
    {
        if (!($event instanceof BeforeTemplateRenderedEvent)) {
            return;
        }

        // Check if we're on a Calendar page
        $appId = $event->getResponse()->getApp();
        if ($appId !== 'calendar') {
            return;
        }

        // Load our Calendar integration script
        Util::addScript(Application::APP_ID, 'calendar-integration');
    }
}
