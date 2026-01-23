<?php
declare(strict_types=1);

namespace OCA\CreateExternalConversation\Service;

use OCA\CreateExternalConversation\AppInfo\Application;
use OCP\IConfig;
use OCP\Security\ICrypto;

/**
 * Service for managing app settings
 */
class SettingsService {
    private const CONFIG_EXTERNAL_URL = 'external_server_url';
    private const CONFIG_USERNAME = 'auth_username';
    private const CONFIG_PASSWORD = 'auth_password_encrypted';

    public function __construct(
        private IConfig $config,
        private ICrypto $crypto
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
        $encrypted = $this->config->getAppValue(
            Application::APP_ID,
            self::CONFIG_PASSWORD,
            ''
        );

        if (empty($encrypted)) {
            return '';
        }

        try {
            return $this->crypto->decrypt($encrypted);
        } catch (\Exception $e) {
            return '';
        }
    }

    public function setPassword(string $password): void {
        if (empty($password)) {
            $this->config->setAppValue(
                Application::APP_ID,
                self::CONFIG_PASSWORD,
                ''
            );
            return;
        }

        $encrypted = $this->crypto->encrypt($password);
        $this->config->setAppValue(
            Application::APP_ID,
            self::CONFIG_PASSWORD,
            $encrypted
        );
    }

    public function isConfigured(): bool {
        return !empty($this->getExternalUrl())
            && !empty($this->getUsername())
            && !empty($this->getPassword());
    }

    public function getAllSettings(): array {
        return [
            'externalServerUrl' => $this->getExternalUrl(),
            'username' => $this->getUsername(),
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
