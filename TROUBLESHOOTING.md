# Troubleshooting - Řešení problémů

## Nevidím tlačítko v Talk

### 1. Vyčistěte cache

V příkazové řádce:
```bash
sudo -u www-data php /var/www/nextcloud/occ maintenance:repair
sudo systemctl restart apache2  # nebo nginx
```

V prohlížeči:
- **Ctrl + Shift + Delete** → Vymazat cache
- Nebo **Ctrl + F5** (hard refresh)

### 2. Zkontrolujte že je aplikace aktivovaná

```bash
sudo -u www-data php /var/www/nextcloud/occ app:list | grep create_external_conversation
```

Měli byste vidět:
```
  - create_external_conversation: 1.0.0
```

Pokud je v sekci "Disabled", aktivujte ji:
```bash
sudo -u www-data php /var/www/nextcloud/occ app:enable create_external_conversation
```

### 3. Zkontrolujte JavaScript konzoli

1. Otevřete Talk
2. Stiskněte **F12** (Developer Tools)
3. Jděte na záložku **Console**
4. Hledejte chyby (červené zprávy)

Pokud vidíte:
- `Failed to load resource` → JS soubor se nenačte
- `OCA.CreateExternalConversation is undefined` → Script se nenačetl správně

### 4. Ověřte že se JS načítá

V Developer Tools (F12):
1. Záložka **Network**
2. Obnovte stránku (F5)
3. Filtr: **JS**
4. Hledejte: `main.js` z `create_external_conversation`

Pokud soubor není v seznamu, script se nenačítá.

### 5. Kde přesně hledat tlačítko?

Tlačítko by mělo být:
- **V Talk aplikaci** (ikona bubliny v horním menu)
- **Vedle nebo pod** tlačítkem "New conversation" / "Nová konverzace"
- Barva: **modrá**
- Text: **"Create External Conversation"**

### 6. Ruční test JavaScript

V konzoli prohlížeče (F12 → Console) napište:
```javascript
OCA.CreateExternalConversation
```

Pokud vrátí `undefined`, script se nenačetl.

## Nevidím nastavení aplikace

### Nastavení je v OSOBNÍM nastavení, ne admin!

1. Klikněte na **avatar** (vpravo nahoře)
2. **Nastavení** (Settings)
3. V levém menu: **Další nastavení** (Additional)
4. Scrollujte dolů na sekci **"Create External Conversation"**

**NENÍ** to v:
- ❌ Nastavení → Administrace
- ❌ Aplikace → Create External Conversation

**JE** to v:
- ✅ Nastavení → Osobní → Další nastavení

### Pokud tam sekci nevidíte

Zkontrolujte že existuje soubor:
```bash
ls -la /var/www/nextcloud/apps/create_external_conversation/lib/Settings/Personal.php
```

A že je v `appinfo/info.xml`:
```bash
grep -A 2 "<settings>" /var/www/nextcloud/apps/create_external_conversation/appinfo/info.xml
```

Měli byste vidět:
```xml
<settings>
    <personal>OCA\CreateExternalConversation\Settings\Personal</personal>
</settings>
```

## Nastavení se neukládá

Zkontrolujte logy:
```bash
tail -f /var/www/nextcloud/data/nextcloud.log
```

Nebo v prohlížeči (F12 → Network):
1. Vyplňte nastavení
2. Klikněte **Uložit**
3. Hledejte POST request na `/settings`
4. Zkontrolujte odpověď (Response)

## Další ladění

### Zkontrolujte PHP logy

```bash
tail -f /var/log/apache2/error.log  # nebo
tail -f /var/log/nginx/error.log
```

### Zapněte debug mode v Nextcloudu

V `config/config.php`:
```php
'debug' => true,
'loglevel' => 0,
```

Pak znovu zkuste a podívejte se na logy.

### Zkontrolujte oprávnění

```bash
ls -la /var/www/nextcloud/apps/create_external_conversation/
```

Všechny soubory by měly patřit `www-data` (nebo `apache`/`nginx`):
```bash
sudo chown -R www-data:www-data /var/www/nextcloud/apps/create_external_conversation
```

## Rychlé řešení - Přeinstalace

```bash
cd /var/www/nextcloud/apps
sudo rm -rf create_external_conversation
sudo cp -r /path/to/source/create_external_conversation .
sudo chown -R www-data:www-data create_external_conversation
sudo -u www-data php /var/www/nextcloud/occ app:disable create_external_conversation
sudo -u www-data php /var/www/nextcloud/occ app:enable create_external_conversation
```

Pak vyčistěte cache prohlížeče a obnovte stránku.

## Stále nefunguje?

1. Zkontrolujte že máte Nextcloud 25+
2. Zkontrolujte že je nainstalovaná aplikace **Talk**
3. Zkuste jiný prohlížeč
4. Zkontrolujte že nejste v anonymním režimu prohlížeče
5. Podívejte se do `/var/www/nextcloud/data/nextcloud.log` pro detailní chyby
