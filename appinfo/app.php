<?php
declare(strict_types=1);

// No vendor autoload needed - using Nextcloud's autoloader
use OCA\CreateExternalConversation\AppInfo\Application;

$app = new Application();

// Load JS and CSS on every page (so it's available in Talk)
\OCP\Util::addScript('create_external_conversation', 'main');
\OCP\Util::addStyle('create_external_conversation', 'main');
