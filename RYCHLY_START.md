# Create External Conversation - Rychlý Start

## Co to je?

Nextcloud aplikace, která přidá do Talk tlačítko **"Create External Conversation"** vedle "Create a new conversation". Umožňuje vytvářet konverzace na jiném (externím) Nextcloudu pomocí API tokenu.

## Stručný návod

### 1. Instalace

```bash
cd /home/tomas/git/kara/create_external_conversation
sudo ./install.sh /path/to/nextcloud
```

Nebo ručně:
```bash
sudo cp -r /home/tomas/git/kara/create_external_conversation /var/www/nextcloud/apps/
sudo chown -R www-data:www-data /var/www/nextcloud/apps/create_external_conversation
sudo -u www-data php /var/www/nextcloud/occ app:enable create_external_conversation
```

### 2. Vytvoření API tokenu na externím Nextcloudu

Na **externím Nextcloudu** (kde chcete vytvářet konverzace):
1. Přihlaste se
2. Nastavení → Zabezpečení → Zařízení a relace
3. Název aplikace: `External Conversation Creator`
4. Vytvořit nový token aplikace
5. **Zkopírujte token** (už ho neuvidíte!)

### 3. Konfigurace v lokálním Nextcloudu

Na **vašem Nextcloudu**:
1. Nastavení → Osobní → Create External Conversation
2. Vyplňte:
   - External Nextcloud URL: `https://external-nextcloud.com` (bez `/` na konci)
   - API Token: token z kroku 2
3. Uložit

### 4. Použití

1. Otevřete **Talk**
2. Klikněte na modré tlačítko **"Create External Conversation"**
3. Vyplňte:
   - **Conversation Name**: název konverzace
   - **Search External User**: vyhledejte uživatele
4. Vyberte uživatele
5. Klikněte **Create**

Hotovo! Konverzace je vytvořena, vy i vybraný uživatel jste pozváni.

## Struktura projektu

```
create_external_conversation/
├── appinfo/
│   ├── app.php                  # Hlavní vstupní bod
│   ├── info.xml                 # Metadata aplikace
│   └── routes.php               # API routy
├── lib/
│   ├── AppInfo/
│   │   └── Application.php      # Bootstrap aplikace
│   ├── Controller/
│   │   ├── ApiController.php    # API pro vytváření konverzací
│   │   └── SettingsController.php # API pro nastavení
│   └── Settings/
│       └── Personal.php         # Osobní nastavení
├── templates/
│   └── settings/
│       └── personal.php         # Formulář nastavení
├── js/
│   └── main.js                  # Frontend JavaScript
├── css/
│   └── main.css                 # Styly
├── README.md                    # Základní dokumentace
├── INSTALL.md                   # Detailní instalační návod
├── API_EXAMPLES.md              # Příklady API volání
└── CHANGELOG.md                 # Seznam změn
```

## Jak to funguje?

1. **JavaScript** (`js/main.js`) přidá tlačítko do Talk UI
2. Po kliknutí se zobrazí dialog pro zadání názvu konverzace a výběr uživatele
3. **Backend** (`lib/Controller/ApiController.php`):
   - Načte konfiguraci (URL + token)
   - Zavolá API externího Nextcloudu
   - Vytvoří konverzaci (POST `/ocs/v2.php/apps/spreed/api/v4/room`)
   - Přidá vybraného uživatele
   - Přidá aktuálního uživatele (federovaně)
4. Vrátí odkaz na novou konverzaci

## Používané API

### Nextcloud Talk API v4

- **Vytvoření konverzace**:
  ```
  POST /ocs/v2.php/apps/spreed/api/v4/room
  ```

- **Přidání účastníka**:
  ```
  POST /ocs/v2.php/apps/spreed/api/v4/room/{token}/participants
  ```

- **Vyhledání uživatelů**:
  ```
  GET /ocs/v2.php/cloud/users?search={query}
  ```

### Autentizace

```
Authorization: Bearer {token}
OCS-APIRequest: true
```

## Časté problémy

| Problém | Řešení |
|---------|--------|
| "External Nextcloud not configured" | Vyplňte URL a token v nastavení |
| "HTTP 401" | Neplatný token - vygenerujte nový |
| Tlačítko se nezobrazuje | Vyčistěte cache prohlížeče, zkontrolujte že je app aktivovaná |
| "Failed to add federated user" | Zkontrolujte že je federace povolená na obou instancích |

## Bezpečnost

- ✅ Token autentizace (ne heslo)
- ✅ Per-user konfigurace
- ✅ SSL/TLS required
- ✅ Token uložen v DB, ne v plaintext
- ⚠️ Doporučení: Vytvořte vyhrazeného uživatele s minimálními právy

## Další dokumentace

- **[INSTALL.md](INSTALL.md)** - Detailní instalační a konfigurační návod
- **[API_EXAMPLES.md](API_EXAMPLES.md)** - Příklady API volání a testování
- **[CHANGELOG.md](CHANGELOG.md)** - Seznam změn

## Podpora

Pro detailní dokumentaci viz:
- `INSTALL.md` - Kompletní instalační návod s řešením problémů
- `API_EXAMPLES.md` - Příklady použití API
- README.md v angličtině

## Požadavky

- Nextcloud 25+
- PHP 7.4+
- Talk aplikace na obou instancích
- Povolená federace
