# Instalace a konfigurace

## Požadavky

- Nextcloud 27 nebo novější (testováno až do 32)
- PHP 8.1 nebo novější
- Nextcloud Talk nainstalovaný a aktivní na externím Nextcloudu

## Instalace

### Instalace přes Git (doporučeno)

```bash
cd /var/www/nextcloud/apps
git clone https://github.com/1mecz/Nextcloud-CreateExternalConversation.git create_external_conversation
sudo chown -R www-data:www-data create_external_conversation
sudo -u www-data php /var/www/nextcloud/occ app:enable create_external_conversation
```

### Ruční instalace

```bash
# Zkopírujte aplikaci do apps složky
sudo cp -r create_external_conversation /var/www/nextcloud/apps/

# Nastavte oprávnění
sudo chown -R www-data:www-data /var/www/nextcloud/apps/create_external_conversation

# Aktivujte aplikaci
sudo -u www-data php /var/www/nextcloud/occ app:enable create_external_conversation
```

## Konfigurace externího Nextcloudu

Na **externím Nextcloudu**, kde budou vytvářeny konverzace:

### 1. Vytvořte dedikovaného uživatele

1. Vytvořte nový uživatel účet (např. `guest_user` nebo `conversation_creator`)
2. Přihlaste se jako tento uživatel
3. Otevřete Talk a ověřte, že může vytvářet konverzace
4. Tento uživatel bude použit pro API přístup

### 2. Ověřte Talk API

Můžete otestovat, že Talk API funguje:

```bash
curl -u "username:password" \
     -H "OCS-APIRequest: true" \
     -H "Accept: application/json" \
     https://external-nextcloud.com/ocs/v2.php/apps/spreed/api/v4/room
```

## Konfigurace lokálního Nextcloudu

Na **lokálním Nextcloudu**, odkud budete vytvářet externí konverzace:

### 1. Nastavte připojení k externímu Nextcloudu (jako admin)

1. Přihlaste se jako **správce**
2. Jděte do **Nastavení** → **Administrace** → **External Nextcloud Talk Server**
3. Vyplňte:
   - **External Nextcloud URL**: 
     - Formát: `https://external-nextcloud.com`
     - **Bez** koncového lomítka
     - Musí začínat `https://`
   - **Username**: 
     - Uživatelské jméno dedikovaného účtu na externím Nextcloudu
   - **Password**: 
     - Heslo k tomuto účtu (ukládá se šifrované)
4. Klikněte na **Uložit**
5. Klikněte na **Test Connection** pro ověření připojení

### 2. Testování konfigurace

1. Otevřete **Talk** aplikaci (jako jakýkoli uživatel)
2. V dashboardu vedle "Create a new conversation" uvidíte nové tlačítko s ikonou glóbusu
3. Klikněte na něj
4. Zadejte název konverzace
5. Po vytvoření dostanete veřejný odkaz

## Použití

### Vytvoření externí konverzace

1. **Otevřete Talk**
2. **Klikněte na tlačítko s glóbusem** (vedle "Create a new conversation")
3. **Vyplňte dialog:**
   - **Conversation Name**: Zadejte název konverzace (např. "Meeting s týmem")
4. **Klikněte Create**
5. **Zkopírujte veřejný odkaz** a sdílejte ho s kýmkoli
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
