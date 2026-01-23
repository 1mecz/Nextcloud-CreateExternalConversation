#!/bin/bash

# Instalační skript pro Create External Conversation Nextcloud app
# Použití: ./install.sh /path/to/nextcloud

set -e

if [ -z "$1" ]; then
    echo "Použití: $0 /path/to/nextcloud"
    echo "Příklad: $0 /var/www/nextcloud"
    exit 1
fi

NEXTCLOUD_PATH="$1"
APP_NAME="create_external_conversation"
APPS_DIR="${NEXTCLOUD_PATH}/apps"

# Kontrola, že Nextcloud adresář existuje
if [ ! -d "$NEXTCLOUD_PATH" ]; then
    echo "Chyba: Nextcloud adresář neexistuje: $NEXTCLOUD_PATH"
    exit 1
fi

# Kontrola, že apps adresář existuje
if [ ! -d "$APPS_DIR" ]; then
    echo "Chyba: Apps adresář neexistuje: $APPS_DIR"
    exit 1
fi

echo "================================================"
echo "Instalace Create External Conversation"
echo "================================================"
echo ""

# Vytvoření cílového adresáře
TARGET_DIR="${APPS_DIR}/${APP_NAME}"

if [ -d "$TARGET_DIR" ]; then
    echo "Varování: Aplikace již existuje v $TARGET_DIR"
    read -p "Chcete ji přepsat? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Instalace zrušena."
        exit 1
    fi
    echo "Mažu starý adresář..."
    rm -rf "$TARGET_DIR"
fi

echo "Kopíruji soubory..."
cp -r "$(dirname "$0")" "$TARGET_DIR"

# Odstranění install scriptu z cíle
rm -f "${TARGET_DIR}/install.sh"

echo "Nastavuji oprávnění..."
# Získání www-data uživatele (může být různý na různých systémech)
WEB_USER="www-data"
if ! id "$WEB_USER" &>/dev/null; then
    # Zkusit apache
    WEB_USER="apache"
    if ! id "$WEB_USER" &>/dev/null; then
        # Zkusit nginx
        WEB_USER="nginx"
        if ! id "$WEB_USER" &>/dev/null; then
            echo "Varování: Nepodařilo se zjistit webového uživatele."
            echo "Prosím, nastavte oprávnění ručně:"
            echo "  chown -R <web-user>:<web-group> $TARGET_DIR"
        fi
    fi
fi

if id "$WEB_USER" &>/dev/null; then
    chown -R "$WEB_USER:$WEB_USER" "$TARGET_DIR"
    echo "Oprávnění nastavena pro uživatele: $WEB_USER"
fi

echo ""
echo "================================================"
echo "Instalace dokončena!"
echo "================================================"
echo ""
echo "Další kroky:"
echo "1. Aktivujte aplikaci:"
echo "   sudo -u $WEB_USER php ${NEXTCLOUD_PATH}/occ app:enable ${APP_NAME}"
echo ""
echo "2. Nebo aktivujte aplikaci v admin rozhraní Nextcloudu"
echo ""
echo "3. Nakonfigurujte aplikaci v osobním nastavení:"
echo "   Nastavení → Osobní → Další nastavení → Create External Conversation"
echo ""
echo "4. Zadejte URL externího Nextcloudu a API token"
echo ""
