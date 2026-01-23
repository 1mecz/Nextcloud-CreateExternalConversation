<?php
declare(strict_types=1);

namespace OCA\CreateExternalConversation\Service;

use OCA\CreateExternalConversation\AppInfo\Application;
use OCP\IConfig;

/**
 * Service for managing app settings
 */
class SettingsService {
    private const CONFIG_EXTERNAL_URL = 'external_url';
    private const CONFIG_USERNAME = 'external_username';
    private const CONFIG_PASSWORD = 'external_password';

    public function __construct(
        private IConfig $config
    ) {
    }

    public function getExternalUrl(): string {
        return $this->config->getAppValue(
            Application::APP_ID,
            self::CONFIG_EXTERNAL_URL,
            ''
        );
    }

    public function setExternalUrl(string $url): void {
        $url = rtrim(trim($url), '/');
        $this->config->setAppValue(
            Application::APP_ID,
            self::CONFIG_EXTERNAL_URL,
            $url
        );
    }

    public function getUsername(): string {
        return $this->config->getAppValue(
            Application::APP_ID,
            self::CONFIG_USERNAME,
            ''
        );
    }

    public function setUsername(string $username): void {
        $this->config->setAppValue(
            Application::APP_ID,
            self::CONFIG_USERNAME,
            trim($username)
        );
    }

    public function getPassword(): string {
        return $this->config->getAppValue(
            Application::APP_ID,
            self::CONFIG_PASSWORD,
            ''
        );
    }

    public function setPassword(string $password): void {
        $this->config->setAppValue(
            Application::APP_ID,
            self::CONFIG_PASSWORD,
            $password
        );
    }

    public function isConfigured(): bool {
        return !empty($this->getExternalUrl())
            && !empty($this->getUsername())
            && !empty($this->getPassword());
    }

    public function getAllSettings(): array {
        return [
            'external_url' => $this->getExternalUrl(),
            'external_username' => $this->getUsername(),
            'hasPassword' => !empty($this->getPassword()),
            'isConfigured' => $this->isConfigured(),
        ];
    }

    public function saveAllSettings(string $url, string $username, ?string $password): void {
        $this->setExternalUrl($url);
        $this->setUsername($username);
        
        if ($password !== null && $password !== '') {
            $this->setPassword($password);
        }
    }
}
