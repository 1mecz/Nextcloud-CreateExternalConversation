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
ls -la apps/create_external_conversation/js/main.js
ls -la apps/create_external_conversation/css/main.css
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

## ✅ 5. Kde hledat nastavení?

1. Klikněte na **avatar** (pravý horní roh)
2. **Nastavení**
3. V levém menu: **Další nastavení** (nebo "Additional")
4. Scrollujte dolů → sekce **"Create External Conversation"**

**NENÍ v admin nastavení!** Je to v **osobním nastavení**.

## ✅ 6. Kde hledat tlačítko?

1. Otevřete **Talk** (ikona bubliny v horním menu)
2. Hledejte **modré tlačítko** s textem "Create External Conversation"
3. Mělo by být v levém panelu, kde jsou konverzace

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
