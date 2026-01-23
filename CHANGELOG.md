# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2026-01-23

### Added
- Initial release
- Create external conversations on remote Nextcloud Talk instances
- API token authentication (no admin account needed)
- User search on external Nextcloud
- Federated conversation support
- Personal settings for external Nextcloud configuration
- Support for Nextcloud 25+

### Features
- **External Conversation Creation**: Create Talk conversations on external Nextcloud instances via API
- **Federated Invitations**: Automatically invite users via Nextcloud federation
- **User Search**: Search for users on external Nextcloud before creating conversations
- **Secure Authentication**: Uses API tokens instead of passwords
- **Per-User Configuration**: Each user can configure their own external Nextcloud connection
- **Simple UI**: Adds a button directly in Talk interface

### Security
- Token-based authentication
- Per-user token storage
- SSL/TLS required for external connections
- No plaintext password storage

### Technical Details
- Compatible with Nextcloud 25-30
- PHP 7.4 - 8.3 support
- Uses Nextcloud Talk API v4
- Vanilla JavaScript (no build process required)
