# ⚡ Quick Deploy Guide

## 🚀 Schnellste Option: Railway (5 Minuten)

### Schritt 1: Account & CLI

```bash
# Railway CLI installieren
npm install -g railway

# Login (öffnet Browser)
railway login
```

### Schritt 2: Backend deployen

```bash
cd backend

# Projekt erstellen
railway init

# Deployen!
railway up
```

### Schritt 3: Domain kopieren

```bash
# Deine Backend-URL anzeigen
railway domain
```

Du bekommst eine URL wie: `jumpit-backend-production-xyz.up.railway.app`

### Schritt 4: Frontend anpassen

**Öffne `api-client.js`:**

```javascript
getBaseURL() {
  const hostname = window.location.hostname;
  const customBackendURL = localStorage.getItem('jumpit_backend_url');
  if (customBackendURL) {
    return customBackendURL;
  }

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3001/api';
  } else {
    // Production: Railway Backend  👈 HIER DEINE URL EINTRAGEN!
    return 'https://jumpit-backend-production-xyz.up.railway.app/api';
  }
}
```

### Schritt 5: Testen!

```bash
# Frontend committen & pushen
git add .
git commit -m "Connect to Railway backend"
git push origin main
```

**Fertig!** 🎉 Dein Backend läuft jetzt online!

---

## ✅ Alternative: Render (Kostenlos)

### Schritt 1: Code committen

```bash
git add backend/
git commit -m "Add backend deployment configs"
git push origin main
```

### Schritt 2: Render.com öffnen

1. Gehe zu: https://render.com
2. Signup mit GitHub
3. "New" → "Web Service"
4. Repository `JumpIt` auswählen

### Schritt 3: Einstellungen

- **Name:** jumpit-backend
- **Root Directory:** `backend`
- **Build Command:** `npm install`
- **Start Command:** `node server.js`
- **Plan:** Free

### Schritt 4: Environment Variables

```
JWT_SECRET = dein-super-secret-key-change-me
ADMIN_PASSWORD = admin123
PORT = 3001
```

### Schritt 5: Deploy & URL kopieren

Render deployt automatisch. Du bekommst:
`https://jumpit-backend.onrender.com`

### Schritt 6: Frontend anpassen

```javascript
// api-client.js
} else {
  return 'https://jumpit-backend.onrender.com/api';
}
```

---

## 🧪 Backend testen

```bash
# Health Check
curl https://DEINE-URL/api/health

# Sollte returnen:
# {"status":"OK","timestamp":"..."}
```

---

## 📱 iPhone konfigurieren

Nachdem dein Backend online ist:

1. Öffne JumpIt auf dem iPhone
2. Registriere dich / Logge dich ein
3. **Fertig!** Das Backend wird automatisch genutzt

Das Frontend erkennt automatisch, dass es nicht auf `localhost` läuft und nutzt die Production-URL!

---

## 🔒 CORS für Production konfigurieren

**Backend `server.js` anpassen:**

```javascript
const cors = require("cors");

// Erlaubte Origins
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "https://moe8212.github.io", // Deine GitHub Pages URL
  "https://jumpit.app", // Falls Custom Domain
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Erlaube Requests ohne Origin (z.B. Mobile Apps)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.log("CORS blocked:", origin);
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
```

**Dann neu deployen:**

```bash
# Railway:
railway up

# Render:
git push origin main  # Auto-Deploy
```

---

## 🎯 Checkliste

- [ ] Backend deployed (Railway/Render)
- [ ] Backend URL kopiert
- [ ] `api-client.js` aktualisiert mit Production URL
- [ ] CORS konfiguriert
- [ ] Frontend committed & gepushed
- [ ] Health Check funktioniert
- [ ] iPhone-Test erfolgreich

---

## 🆘 Troubleshooting

### Problem: "CORS blocked"

→ Füge deine GitHub Pages URL zu `allowedOrigins` hinzu

### Problem: "Backend nicht erreichbar"

→ Prüfe Health Check: `https://DEINE-URL/api/health`

### Problem: "Datenbank leer nach Restart"

→ Bei Render: Persistent Disk konfigurieren
→ Oder: Wechsel zu PostgreSQL

### Problem: "Langsamer erster Request"

→ Render Free Plan schläft ein
→ Upgrade zu $7/Monat oder Railway nutzen

---

## 💰 Kosten-Vergleich

| Platform    | Kosten/Monat | Sleep Mode     | Speed        |
| ----------- | ------------ | -------------- | ------------ |
| Render Free | $0           | ⚠️ Ja (15 min) | Langsam      |
| Render Paid | $7           | ❌ Nein        | Schnell      |
| Railway     | $5           | ❌ Nein        | Sehr schnell |
| Fly.io Free | $0\*         | ❌ Nein        | Schnell      |

\*Fly.io: Kostenlos bis zu 3 Apps, dann Verbrauchsabhängig

---

## 🎓 Nächste Schritte

1. **Backend deployen** (Railway empfohlen)
2. **Frontend anpassen** (Production URL)
3. **Testen** auf PC & iPhone
4. **Custom Domain** (optional)
5. **Monitoring** einrichten (optional)

**Viel Erfolg!** 🚀
