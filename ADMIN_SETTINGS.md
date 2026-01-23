# Admin nastavení - návod

## ✅ Změněno na Admin nastavení

Aplikace nyní používá **admin nastavení** pro celý Nextcloud. 

### Kde najít nastavení:

1. **Přihlaste se jako admin**
2. **Nastavení** (Settings) → **Administrace** (Administration)
3. V levém menu najděte sekci **"External Conversation"**
4. Vyplňte:
   - **External Nextcloud URL**: `https://external-nextcloud.com`
   - **API Token**: token z externího Nextcloudu

### Po uložení:

- **Všichni uživatelé** mohou vytvářet konverzace na externím Nextcloudu
- Není třeba nastavovat pro každého uživatele zvlášť

## 🔧 Kroky pro zprovoznění:

```bash
cd /var/www/nextcloud/apps

# Aktualizujte aplikaci (překopírujte nové soubory)
sudo cp -r /path/to/source/create_external_conversation .
sudo chown -R www-data:www-data create_external_conversation

# Restartujte aplikaci
sudo -u www-data php /var/www/nextcloud/occ app:disable create_external_conversation
sudo -u www-data php /var/www/nextcloud/occ app:enable create_external_conversation

# Vyčistěte cache
sudo -u www-data php /var/www/nextcloud/occ maintenance:repair

# Restartujte webserver
sudo systemctl restart apache2  # nebo nginx
```

## 🌐 V prohlížeči:

1. **Ctrl + Shift + Delete** → Vymazat cache
2. **Ctrl + F5** → Hard refresh
3. Přihlaste se jako **admin**
4. **Nastavení** → **Administrace** → **External Conversation**

## 📍 Kde hledat tlačítko:

1. Jděte na: `https://your-nextcloud.com/apps/spreed/`
2. Tlačítko **"Create External Conversation"** by mělo být:
   - V **levém panelu** (navigace)
   - Nahoře, modré
   - Vedle seznamu konverzací

## 🐛 Debugging:

Otevřete JavaScript konzoli (F12) a měli byste vidět:
```
CreateExternalConversation: Initializing...
CreateExternalConversation: In Talk app, adding button
CreateExternalConversation: Attempting to add button...
CreateExternalConversation: Found container: app-navigation
CreateExternalConversation: Button added successfully!
```

Pokud nevidíte tyto zprávy, script se nenačítá.

## 📝 Rozdíly oproti předchozí verzi:

| Před | Po |
|------|-----|
| Osobní nastavení | **Admin nastavení** |
| Každý uživatel si nastavuje | **Admin nastaví pro všechny** |
| `getUserValue()` | **`getAppValue()`** |
| Menu: Další nastavení | **Menu: External Conversation** |
