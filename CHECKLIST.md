# Kontrolní seznam po instalaci

## ✅ 1. Je aplikace aktivovaná?

```bash
sudo -u www-data php occ app:list | grep create_external_conversation
```

**Očekávaný výstup:**
```
  - create_external_conversation: 1.0.0
```

## ✅ 2. Existují všechny soubory?

```bash
ls -la apps/create_external_conversation/js/talk-integration.js
ls -la apps/create_external_conversation/js/admin-settings.js
```

Oba by měly existovat.

## ✅ 3. Vyčistěte cache

```bash
sudo -u www-data php occ maintenance:repair
sudo systemctl restart apache2  # nebo nginx
```

## ✅ 4. V prohlížeči

1. **Vyčistěte cache**: Ctrl + Shift + Delete
2. **Obnovte**: Ctrl + F5 (hard refresh)
3. **Otevřete Talk**

## ✅ 5. Kde hledat nastavení? (ADMIN POUZE)

1. Přihlaste se jako **správce**
2. Jděte do **Nastavení** → **Administrace**
3. V levém menu najděte: **External Nextcloud Talk Server**
4. Vyplňte:
   - External Nextcloud URL
   - Username
   - Password
5. **Uložte** a klikněte **Test Connection**

**JE v admin nastavení!** Není to v osobním nastavení.

## ✅ 6. Kde hledat tlačítko? (VŠICHNI UŽIVATELÉ)

1. Otevřete **Talk** (ikona bubliny v horním menu)
2. V dashboardu vedle tlačítka "Create a new conversation" hledejte **tlačítko s ikonou glóbusu**
3. Text tlačítka: **"External conversation"**
4. Pozice: 3. tlačítko v dashboard actions

## 🔧 Pokud tlačítko nevidíte

Zkontrolujte JavaScript konzoli:
1. **F12** (Developer Tools)
2. Záložka **Console**
3. Hledejte červené chyby

Napište do konzole:
```javascript
OCA.CreateExternalConversation
```

Pokud vrátí `undefined`, script se nenačetl.

## 📝 Další pomoc

Viz soubor **TROUBLESHOOTING.md** pro detailní řešení problémů.
