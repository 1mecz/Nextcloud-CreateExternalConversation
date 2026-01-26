# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2026-01-26

### Added
- Initial release
- Create public conversations on external Nextcloud Talk servers
- Basic Auth authentication with dedicated service account
- Talk dashboard integration with globe icon button
- Admin settings for centralized configuration
- Public conversation links for guest access
- Support for Nextcloud 27-32

### Features
- **Talk Dashboard Integration**: Button with globe icon next to "Create a new conversation"
- **Public Conversations**: Creates guest-accessible rooms on external servers
- **Direct Links**: Generate and share public conversation links instantly
- **Centralized Configuration**: Admin configures connection, all users can use it
- **Simple UI**: Modal dialog with conversation name input only
- **Test Connection**: Admin can verify external server connectivity

### Security
- Basic Auth with encrypted password storage
- Centralized credentials (one service account for all users)
- SSL/TLS required for external connections
- No plaintext password storage

### Technical Details
- Compatible with Nextcloud 27-32
- PHP 8.1 - 8.3 support
- Uses Nextcloud Talk API v4
- Form-data encoding for Talk API calls
- Direct OCS endpoint paths (not via OC.generateUrl)
- Vanilla JavaScript (no build process required)
- Material Design globe icon for UI consistency
