# Create External Conversation

Nextcloud aplikace pro vytváření veřejných konverzací na externím Nextcloud Talk serveru přímo z Talk dashboardu.

## Funkce

- 🌐 Tlačítko "Create External Conversation" přímo v Talk dashboardu
- ⚙️ Centrální konfigurace externího serveru (Admin Settings)
- 👥 Vytváří veřejné konverzace s podporou přístupu hostů
- 🔗 Generuje veřejný odkaz pro sdílení konverzace
- 🔐 Bezpečná komunikace přes Basic Auth s dedikovaným uživatelem

## Instalace

### Jednoduchý způsob

```bash
cd /path/to/nextcloud/apps
git clone https://github.com/1mecz/Nextcloud-CreateExternalConversation.git create_external_conversation
sudo -u www-data php /path/to/nextcloud/occ app:enable create_external_conversation
```

### Ruční instalace

1. Zkopírujte složku do `apps`:
   ```bash
   cp -r create_external_conversation /path/to/nextcloud/apps/
   ```

2. Nastavte správná oprávnění:
   ```bash
   chown -R www-data:www-data /path/to/nextcloud/apps/create_external_conversation
   ```

3. Aktivujte aplikaci:
   ```bash
   sudo -u www-data php /path/to/nextcloud/occ app:enable create_external_conversation
   ```

## Konfigurace

### Příprava externího Nextcloud serveru

1. Vytvořte dedikovaného uživatele na externím Nextcloudu (např. `guest_user`)
2. Ujistěte se, že má právo vytvářet konverzace v Talk aplikaci

### Nastavení v administraci

1. Přihlaste se jako správce
2. Jděte do **Nastavení** → **Administrace** → **External Nextcloud Talk Server**
3. Vyplňte:
   - **External Nextcloud URL**: URL externího serveru (např. `https://ext.example.com`)
   - **Username**: Uživatelské jméno na externím serveru (např. `guest_user`)
   - **Password**: Heslo k účtu
4. Klikněte **Uložit**
5. Klikněte **Test Connection** pro ověření připojení

## Použití

1. Otevřete Talk aplikaci
2. V dashboardu vedle "Create a new conversation" najdete nové tlačítko s ikonou glóbusu
3. Klikněte na **Create External Conversation**
4. V modálním dialogu:
   - Zadejte **Conversation Name** (název nové konverzace)
   - Klikněte **Create**
5. Po vytvoření se zobrazí:
   - **Veřejný odkaz** - sdílitelný odkaz na konverzaci
   - Tlačítko **Kopírovat odkaz**
   - Tlačítko **Otevřít konverzaci**

## Technické detaily

### API komunikace

- **Ověřování**: Basic Auth (uživatelské jméno + heslo)
- **Formát**: Form-data encoding
- **OCS API**: Přímé cesty bez OC.generateUrl()

### Endpointy

- Vytvoření konverzace: `POST /ocs/v2.php/apps/spreed/api/v4/room`
- Typ konverzace: `3` (veřejná, přístupná hostům)

### Bezpečnost

- Přihlašovací údaje jsou uloženy v šifrované podobě
- Komunikace je centralizovaná (všichni uživatelé používají stejný dedikovaný účet)
- Vyžaduje HTTPS pro externí komunikaci

## Řešení problémů

### Chyba "Connection failed"

- Ověřte správnost URL (bez lomítka na konci)
- Zkontrolujte dostupnost externího serveru
- Ověřte správnost uživatelského jména a hesla
- Ujistěte se, že je Talk aplikace instalovaná a aktivní na externím serveru

### Tlačítko se nezobrazuje v Talk

- Zkontrolujte, že je aplikace aktivovaná: `sudo -u www-data php occ app:enable create_external_conversation`
- Vymažte cache prohlížeče (Ctrl+Shift+Delete)
- Zkontrolujte JavaScript konzoli prohlížeče (F12) pro chyby
- Pokud používáte proxy, ujistěte se, že neblokuje `/ocs/` cesty

### Nepodařilo se vytvořit konverzaci

- Ověřte, že je dedikovaný uživatel na externím serveru aktivní
- Zkontrolujte, že má uživatel práva v Talk aplikaci
- Vyzkoušejte test connection v admin settings

## Kompatibilita

- **Nextcloud**: 27.0 až 32.0
- **PHP**: 8.1+
- **Talk aplikace**: Povinná na externím serveru

## Licence

AGPL-3.0

## Autor

Tomas
