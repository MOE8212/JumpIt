# 📱 JumpIt - iPhone Setup Guide

## 🎮 Offline-Modus (Standard auf iPhone)

Das Spiel funktioniert **automatisch im Offline-Modus** auf dem iPhone!

✅ **Funktioniert ohne Backend:**

- Registrierung & Login (localStorage)
- Spielen & Scores speichern (localStorage)
- Leaderboard (lokale Scores)

## 🌐 Backend-Verbindung vom iPhone (Optional)

Falls du die Backend-Features nutzen willst (zentrale Datenbank, Online-Leaderboard):

### Schritt 1: PC IP-Adresse herausfinden

**Windows:**

```powershell
ipconfig
# Suche nach "IPv4-Adresse" (z.B. 192.168.178.45)
```

**Mac/Linux:**

```bash
ifconfig | grep "inet "
# Suche nach der lokalen IP (z.B. 192.168.178.45)
```

### Schritt 2: Backend-Server auf allen Interfaces starten

```bash
cd backend
node server.js
```

Der Server läuft dann auf `http://0.0.0.0:3001` (erreichbar von allen Geräten im Netzwerk)

### Schritt 3: iPhone mit Backend verbinden

1. Öffne JumpIt auf dem iPhone
2. Öffne die Browser-Konsole (Safari Developer Tools)
3. Führe folgendes aus:

```javascript
// Setze deine PC IP-Adresse
localStorage.setItem("jumpit_backend_url", "http://192.168.178.45:3001/api");

// Lade Seite neu
location.reload();
```

**Ersetze `192.168.178.45` mit deiner tatsächlichen IP-Adresse!**

### Schritt 4: Teste Backend-Verbindung

Nach dem Reload solltest du in der Konsole sehen:

```
✅ Backend connected: 2024-...
```

Falls nicht:

```
⚠️ Backend nicht erreichbar - Fallback auf localStorage
```

## 🔧 Troubleshooting

### Problem: "Backend nicht erreichbar"

**Firewall-Prüfung:**

```powershell
# Windows: Erlaube Port 3001
netsh advfirewall firewall add rule name="JumpIt Backend" dir=in action=allow protocol=TCP localport=3001
```

**Netzwerk-Prüfung:**

- PC und iPhone müssen im **gleichen WLAN** sein
- Manche Router blockieren Geräte-zu-Gerät-Kommunikation

### Problem: Backend-URL zurücksetzen

```javascript
// Entferne Custom Backend URL
localStorage.removeItem("jumpit_backend_url");
location.reload();
```

## 🎯 Feature-Vergleich

| Feature             | Offline-Modus   | Backend-Modus  |
| ------------------- | --------------- | -------------- |
| Registrierung       | ✅ localStorage | ✅ SQLite DB   |
| Login               | ✅ localStorage | ✅ JWT Auth    |
| Spielen             | ✅              | ✅             |
| Scores speichern    | ✅ localStorage | ✅ Backend API |
| Leaderboard         | ✅ Lokal        | ✅ Global      |
| Admin-Panel         | ✅ Lokal        | ✅ Backend     |
| Geräte-übergreifend | ❌              | ✅             |

## 💡 Empfehlung

Für **Testen auf dem iPhone**: Nutze den Offline-Modus (Standard)

Für **Produktiv-Deployment**: Backend auf Cloud-Server (Heroku, Railway, etc.)

## 🚀 Cloud-Deployment (Fortgeschritten)

1. Backend auf Heroku/Railway deployen
2. Backend-URL in `api-client.js` für Production setzen
3. HTTPS nutzen für sichere Verbindung
