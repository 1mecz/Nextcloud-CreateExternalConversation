# Instalace a konfigurace

## Požadavky

- Nextcloud 25 nebo novější
- PHP 7.4 nebo novější
- Nextcloud Talk nainstalovaný a aktivní na obou instancích (lokální i externí)
- Federace povolena na obou instancích

## Instalace

### Metoda 1: Pomocí instalačního skriptu

```bash
cd /path/to/create_external_conversation
chmod +x install.sh
sudo ./install.sh /path/to/nextcloud
```

### Metoda 2: Ruční instalace

```bash
# Zkopírujte aplikaci do apps složky
sudo cp -r create_external_conversation /var/www/nextcloud/apps/

# Nastavte oprávnění
sudo chown -R www-data:www-data /var/www/nextcloud/apps/create_external_conversation

# Aktivujte aplikaci
sudo -u www-data php /var/www/nextcloud/occ app:enable create_external_conversation
```

## Konfigurace externího Nextcloudu

Na **externím Nextcloudu**, kde chcete vytvářet konverzace:

### 1. Vygenerujte API token

1. Přihlaste se jako uživatel, který bude vytvářet konverzace
2. Jděte do **Nastavení** (ikona ozubeného kola v horním pravém rohu)
3. V levém menu vyberte **Zabezpečení**
4. Scrollujte dolů na sekci **Zařízení a relace**
5. V poli "Název aplikace" zadejte například: `External Conversation Creator`
6. Klikněte na **Vytvořit nový token aplikace**
7. **DŮLEŽITÉ**: Zkopírujte zobrazený token - už ho neuvidíte!

### 2. Ověřte, že je povolena federace

1. Jděte do **Nastavení** → **Administrace** → **Sdílení**
2. Ujistěte se, že je zaškrtnuto:
   - **Povolit uživatelům sdílení prostřednictvím federovaného cloudového ID**
   - **Povolit uživatelům přidávání vzdálených sdílených položek**

### 3. Ověřte Talk API

Můžete otestovat, že Talk API funguje:

```bash
curl -H "OCS-APIRequest: true" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Accept: application/json" \
     https://external-nextcloud.com/ocs/v2.php/apps/spreed/api/v4/room
```

## Konfigurace lokálního Nextcloudu

Na **lokálním Nextcloudu**, odkud chcete vytvářet externí konverzace:

### 1. Nastavte připojení k externímu Nextcloudu

1. Přihlaste se
2. Jděte do **Nastavení** → **Osobní**
3. Scrollujte dolů na sekci **Create External Conversation**
4. Vyplňte:
   - **External Nextcloud URL**: 
     - Formát: `https://external-nextcloud.com`
     - **Bez** koncového lomítka
     - Musí začínat `https://`
   - **API Token**: 
     - Token, který jste vygenerovali na externím Nextcloudu
5. Klikněte na **Uložit**

### 2. Testování konfigurace

Po uložení nastavení:

1. Otevřete **Talk** aplikaci
2. Mělo by se zobrazit modré tlačítko **Create External Conversation**
3. Klikněte na něj
4. Zkuste vyhledat uživatele - pokud funguje vyhledávání, konfigurace je správná

## Použití

### Vytvoření externí konverzace

1. **Otevřete Talk**
2. **Klikněte na "Create External Conversation"**
3. **Vyplňte formulář:**
   - **Conversation Name**: Zadejte název konverzace (např. "Meeting s týmem")
   - **Search External User**: Začněte psát jméno uživatele z externího Nextcloudu
4. **Vyberte uživatele** ze seznamu výsledků
5. **Klikněte na "Create"**

Po úspěšném vytvoření:
- Konverzace je vytvořena na externím Nextcloudu
- Vybraný uživatel je pozván
- Vy jste pozváni prostřednictvím federace
- Automaticky se otevře nová záložka s odkazem na konverzaci

### Federované pozvání

Po vytvoření konverzace:
1. Ve **vašem** Talk se zobrazí pozvánka do federované konverzace
2. Přijměte pozvánku
3. Nyní můžete komunikovat s uživateli z externího Nextcloudu

## Řešení problémů

### "External Nextcloud not configured"

**Příčina**: Není nastavená URL nebo token externího Nextcloudu

**Řešení**:
1. Jděte do Nastavení → Osobní → Create External Conversation
2. Zkontrolujte, že jsou vyplněná obě pole
3. Klikněte na Uložit

### "Failed to create conversation: HTTP 401"

**Příčina**: Neplatný nebo expirovaný API token

**Řešení**:
1. Na externím Nextcloudu vygenerujte nový token
2. V lokálním Nextcloudu zadejte nový token do nastavení

### "Failed to search users"

**Možné příčiny**:
- Nesprávná URL externího Nextcloudu
- SSL certifikát externího Nextcloudu není důvěryhodný
- Firewall blokuje spojení

**Řešení**:
1. Zkontrolujte, že URL je správná: `https://domain.com` (bez `/` na konci)
2. Ověřte, že SSL certifikát je platný:
   ```bash
   curl https://external-nextcloud.com
   ```
3. Zkontrolujte firewall pravidla

### "Failed to add federated user"

**Příčina**: Federace není správně nakonfigurována

**Řešení**:
1. Na **obou** Nextcloud instancích:
   - Nastavení → Administrace → Sdílení
   - Povolte federované sdílení
2. Zkontrolujte, že jsou obě instance dostupné přes HTTPS
3. Ověřte DNS záznamy obou domén

### Tlačítko se nezobrazuje v Talk

**Možné příčiny**:
- Aplikace není aktivována
- JavaScript není načten
- Cache prohlížeče

**Řešení**:
1. Ověřte, že je aplikace aktivována:
   ```bash
   sudo -u www-data php /var/www/nextcloud/occ app:list | grep create_external_conversation
   ```
2. Vymažte cache prohlížeče (Ctrl+Shift+Del)
3. Zkuste jiný prohlížeč
4. Zkontrolujte konzoli prohlížeče (F12) pro chyby

### Problémy s oprávněními

Pokud vidíte chyby týkající se oprávnění:

```bash
# Nastavte správná oprávnění
sudo chown -R www-data:www-data /var/www/nextcloud/apps/create_external_conversation
sudo chmod -R 755 /var/www/nextcloud/apps/create_external_conversation
```

## Bezpečnostní poznámky

### Token Security
- Token poskytuje plný přístup k účtu uživatele na externím Nextcloudu
- **Nikdy nesdílejte** token s jinými osobami
- Token je uložen **pouze** v databázi Nextcloudu, ne v plaintext souborech
- Každý uživatel má vlastní token

### Doporučení
- Vytvořte na externím Nextcloudu **vyhrazeného uživatele** pro vytváření konverzací
- Tento uživatel by měl mít **minimální oprávnění** (jen Talk)
- Pravidelně obnovujte tokeny
- Používejte **silné heslo** pro tento účet

### Monitorování
- Zkontrolujte logy Nextcloudu pro podezřelou aktivitu:
  ```bash
  tail -f /var/www/nextcloud/data/nextcloud.log
  ```

## Pokročilá konfigurace

### Více externích Nextcloud instancí

Momentálně aplikace podporuje připojení k jedné externí instanci. Pro více instancí:

1. Můžete vytvořit více uživatelských účtů v lokálním Nextcloudu
2. Každý účet může mít nakonfigurovanou jinou externí instanci

### Firemní proxy

Pokud používáte proxy server, může být potřeba nakonfigurovat PHP:

```php
// V config/config.php přidejte:
'proxy' => 'http://proxy.example.com:8080',
'proxyuserpwd' => 'username:password',
```

## API Reference

### Použité Nextcloud Talk API endpointy

#### Vytvoření konverzace
```http
POST /ocs/v2.php/apps/spreed/api/v4/room
Headers:
  OCS-APIRequest: true
  Authorization: Bearer {token}
  Accept: application/json
  Content-Type: application/json
Body:
  {
    "roomType": 2,
    "roomName": "Conversation Name"
  }
```

#### Přidání účastníka
```http
POST /ocs/v2.php/apps/spreed/api/v4/room/{token}/participants
Headers:
  OCS-APIRequest: true
  Authorization: Bearer {token}
  Accept: application/json
  Content-Type: application/json
Body:
  {
    "newParticipant": "username",
    "source": "users"
  }
```

#### Vyhledání uživatelů
```http
GET /ocs/v2.php/cloud/users?search={query}
Headers:
  OCS-APIRequest: true
  Authorization: Bearer {token}
  Accept: application/json
```

## Podpora

Pro hlášení chyb nebo návrhy na vylepšení:
- GitHub Issues: [your-repo-url]
- Email: [your-email]
