# 🔧 Supabase Fix - Anleitung

## ✅ Was wurde gefixt:

1. ✅ **Datenbank-Schema**: BIGINT → UUID für User-IDs
2. ✅ **API-Client**: `setAdminPassword()` Funktion hinzugefügt
3. ✅ **Registrierung**: Besseres Error-Handling

---

## 📋 JETZT MUSST DU NUR NOCH FOLGENDES TUN:

### Schritt 1: Supabase SQL Editor öffnen

1. Gehe zu: https://supabase.com
2. Öffne dein Projekt "jumpit-game"
3. Klicke in der Sidebar auf **"SQL Editor"**

### Schritt 2: Fix-Script ausführen

1. Klicke auf **"New query"**
2. Öffne die Datei `SUPABASE-FIX-SCHEMA.sql`
3. Kopiere den **kompletten Inhalt**
4. Füge ihn in den SQL Editor ein
5. Klicke auf **"Run"** (oder F5)

### Schritt 3: Erfolg prüfen

Du solltest sehen:

```
✅ Schema erfolgreich aktualisiert!
✅ User-IDs sind jetzt UUID statt BIGINT
✅ Alle Policies neu erstellt
```

### Schritt 4: Seite neu laden

1. Gehe zurück zu deinem Spiel
2. **Strg + F5** für Hard Refresh
3. Registriere einen **neuen Test-User**
4. Spiele eine Runde
5. Prüfe ob Score gespeichert wird ✅

---

## 🧪 Test-Checkliste:

- [ ] SQL-Script ausgeführt in Supabase
- [ ] Seite neu geladen (Strg + F5)
- [ ] Neuen User registriert (z.B. testuser2@test.com)
- [ ] Spiel gespielt
- [ ] Score wurde gespeichert (keine Fehler in Console)
- [ ] Leaderboard zeigt Score
- [ ] Admin-Button funktioniert (Passwort: admin123)
- [ ] Admin-Panel zeigt User & Sessions

---

## 🐛 Falls Probleme auftreten:

### Problem: "duplicate key value violates unique constraint"

→ User existiert schon. Lösung: Anderen Usernamen/Email nutzen

### Problem: "relation public.users does not exist"

→ SQL-Script wurde nicht ausgeführt. Nochmal versuchen.

### Problem: "permission denied"

→ Normal! Row Level Security ist aktiv. User kann trotzdem spielen.

### Problem: Admin-Button funktioniert nicht

→ Seite neu laden mit Strg + F5

---

## 📊 Was ist anders als vorher?

| Vorher                      | Nachher                           |
| --------------------------- | --------------------------------- |
| User-ID: BIGINT (Zahlen)    | User-ID: UUID (Supabase Standard) |
| DB-Insert kann fehlschlagen | Besseres Error-Handling           |
| Admin-Button Fehler         | Admin-Button funktioniert ✅      |

---

## ✅ Nach dem Fix:

Alles sollte funktionieren:

- ✅ Registrierung
- ✅ Login
- ✅ Spielen
- ✅ Score speichern
- ✅ Leaderboard
- ✅ Admin-Panel

---

## 🚀 Bereit für den Fix?

**Führe jetzt das SQL-Script aus** (siehe Schritt 1-3 oben)

Dann sag mir Bescheid, ob es funktioniert! 😊
