<?php
declare(strict_types=1);

namespace OCA\CreateExternalConversation\Settings;

use OCP\IL10N;
use OCP\IURLGenerator;
use OCP\Settings\IIconSection;

class AdminSection implements IIconSection {
    private $l;
    private $urlGenerator;

    public function __construct(IL10N $l, IURLGenerator $urlGenerator) {
        $this->l = $l;
        $this->urlGenerator = $urlGenerator;
    }

    public function getID(): string {
        return 'create_external_conversation';
    }

    public function getName(): string {
        return $this->l->t('External Conversation');
    }

    public function getPriority(): int {
        return 75;
    }

    public function getIcon(): string {
        return $this->urlGenerator->imagePath('core', 'actions/comment.svg');
    }
}
