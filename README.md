# Create External Conversation

Nextcloud aplikace pro vytváření konverzací na externím Nextcloud Talk.

## Funkce

- Přidává tlačítko "Create External Conversation" vedle "Create a new conversation" v Talk
- Připojuje se k externímu Nextcloudu přes API (používá token, ne admin účet)
- Vytváří novou konverzaci na externím Nextcloudu
- Zve federativního uživatele z externího Nextcloudu
- Zve uživatele, který na tlačítko klikl

## Instalace

1. Zkopírujte složku `create_external_conversation` do složky `apps` ve vašem Nextcloudu:
   ```bash
   cp -r create_external_conversation /path/to/nextcloud/apps/
   ```

2. Nastavte správná oprávnění:
   ```bash
   chown -R www-data:www-data /path/to/nextcloud/apps/create_external_conversation
   ```

3. Aktivujte aplikaci v Nextcloud admin rozhraní nebo přes occ:
   ```bash
   sudo -u www-data php /path/to/nextcloud/occ app:enable create_external_conversation
   ```

## Konfigurace

### Generování API tokenu na externím Nextcloudu

1. Přihlaste se na externí Nextcloud
2. Jděte do **Nastavení** → **Zabezpečení** → **Zařízení a relace**
3. Vytvořte nový token aplikace (zadejte název, např. "External Conversation Creator")
4. Zkopírujte vygenerovaný token

### Nastavení v lokálním Nextcloudu

1. Přihlaste se do svého Nextcloudu
2. Jděte do **Nastavení** → **Osobní** → **Další nastavení**
3. Najděte sekci "Create External Conversation"
4. Vyplňte:
   - **External Nextcloud URL**: URL externího Nextcloudu (např. `https://nextcloud.example.com`)
   - **API Token**: Token, který jste vygenerovali na externím Nextcloudu
5. Klikněte na **Uložit**

## Použití

1. Otevřete Talk aplikaci
2. Klikněte na tlačítko **Create External Conversation**
3. V dialogu vyplňte:
   - **Conversation Name**: Název nové konverzace
   - **Search External User**: Vyhledejte uživatele na externím Nextcloudu
4. Vyberte uživatele ze seznamu výsledků
5. Klikněte na **Create**

Aplikace vytvoří konverzaci na externím Nextcloudu, pozve vybraného uživatele a pozve také vás (přes federaci). Po úspěšném vytvoření se automaticky otevře odkaz na novou konverzaci.

## Technické detaily

### API endpointy

Aplikace používá následující Nextcloud Talk API endpointy:

- **Vytvoření konverzace**: `POST /ocs/v2.php/apps/spreed/api/v4/room`
- **Přidání účastníka**: `POST /ocs/v2.php/apps/spreed/api/v4/room/{token}/participants`
- **Vyhledání uživatelů**: `GET /ocs/v2.php/cloud/users?search={search}`

### Federace

Aplikace využívá Nextcloud federaci pro pozvání aktuálního uživatele zpět do konverzace. Federované ID je ve formátu: `username@hostname`

### Bezpečnost

- Používá se Bearer token autentizace
- Token je uložen v uživatelském nastavení (ne v globálním)
- Každý uživatel má vlastní konfiguraci
- SSL/TLS je vyžadováno pro komunikaci s externím Nextcloudem

## Řešení problémů

### Nepodařilo se vytvořit konverzaci

- Zkontrolujte, že je URL externího Nextcloudu správná
- Ověřte, že je API token platný
- Ujistěte se, že má token potřebná oprávnění
- Zkontrolujte, že je na externím Nextcloudu nainstalována a aktivní aplikace Talk

### Nepodařilo se přidat uživatele

- Zkontrolujte, že uživatel existuje na externím Nextcloudu
- Ověřte, že je federace povolena na obou instancích
- Ujistěte se, že je správně nakonfigurován DNS a SSL certifikát

### Tlačítko se nezobrazuje

- Zkontrolujte, že je aplikace aktivovaná
- Ověřte, že je v prohlížeči načten JavaScript
- Zkuste vyčistit cache prohlížeče
- Zkontrolujte konzoli prohlížeče pro JavaScript chyby

## Licence

AGPL-3.0

## Autor

Tomas
