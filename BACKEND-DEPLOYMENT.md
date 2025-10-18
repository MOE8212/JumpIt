# 🚀 JumpIt Backend - Deployment Optionen

## Übersicht: Cloud-Hosting für Node.js Backend

| Platform         | Kosten         | Komplexität     | SQLite Support | Empfehlung         |
| ---------------- | -------------- | --------------- | -------------- | ------------------ |
| **Railway**      | ⭐ $5/Monat    | ⭐ Sehr einfach | ✅ Ja          | 🏆 **BESTE WAHL**  |
| **Render**       | ✅ Kostenlos\* | ⭐ Einfach      | ✅ Ja          | ✅ Gut für Start   |
| **Heroku**       | $7/Monat       | ⭐⭐ Mittel     | ❌ Nein\*\*    | ⚠️ Umstieg nötig   |
| **Fly.io**       | ✅ Kostenlos\* | ⭐⭐ Mittel     | ✅ Ja          | ✅ Solide Option   |
| **DigitalOcean** | $6/Monat       | ⭐⭐⭐ Komplex  | ✅ Ja          | 💪 Fortgeschritten |

\*Kostenlos mit Einschränkungen (langsamer, schläft ein)
\*\*SQLite auf Heroku geht verloren bei Restart - PostgreSQL nötig

---

## 🏆 EMPFEHLUNG: Railway (Beste Balance)

### ✅ Vorteile:

- Super einfaches Deployment
- SQLite funktioniert perfekt
- Automatische HTTPS
- $5/Monat (500h Free Trial)
- Kein Einschlafen

### 📋 Setup-Schritte:

**1. Account erstellen:**

- Gehe zu: https://railway.app
- Signup mit GitHub

**2. Projekt deployen:**

```bash
# In deinem Projekt-Verzeichnis
npm install -g railway

# Login
railway login

# Neues Projekt
railway init

# Backend deployen
cd backend
railway up
```

**3. Umgebungsvariablen setzen:**

```bash
railway variables set JWT_SECRET="dein-super-secret-key-2024"
railway variables set ADMIN_PASSWORD="admin123"
railway variables set PORT="3001"
```

**4. Domain erhalten:**

- Railway gibt dir automatisch eine URL wie: `jumpit-backend-production.up.railway.app`
- Oder: Custom Domain verbinden

**5. Frontend anpassen:**

```javascript
// api-client.js - Production URL setzen
if (hostname === "localhost" || hostname === "127.0.0.1") {
  return "http://localhost:3001/api";
} else {
  // Production: Railway Backend
  return "https://jumpit-backend-production.up.railway.app/api";
}
```

**Fertig!** Backend läuft 24/7 online ✅

---

## ✅ OPTION 2: Render (Kostenlos für Start)

### Vorteile:

- Komplett kostenlos (mit Einschränkungen)
- Einfaches Deployment über GitHub
- HTTPS inklusive

### ⚠️ Nachteile:

- Schläft nach 15 Min Inaktivität ein
- Erste Anfrage nach Sleep dauert ~30 Sekunden
- Monatliches Limit (750h)

### Setup-Schritte:

**1. Code zu GitHub pushen:**

```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

**2. Render.com Account:**

- Gehe zu: https://render.com
- Signup mit GitHub

**3. Neuen Web Service erstellen:**

- "New" → "Web Service"
- Repository auswählen: `JumpIt`
- Settings:
  - **Name:** jumpit-backend
  - **Root Directory:** backend
  - **Build Command:** `npm install`
  - **Start Command:** `node server.js`
  - **Plan:** Free

**4. Environment Variables:**

```
JWT_SECRET=dein-super-secret-key-2024
ADMIN_PASSWORD=admin123
PORT=3001
```

**5. Deploy!**

- Render deployt automatisch
- Du bekommst eine URL: `https://jumpit-backend.onrender.com`

**6. Frontend anpassen:**

```javascript
// api-client.js
} else {
  return 'https://jumpit-backend.onrender.com/api';
}
```

---

## 🔥 OPTION 3: Fly.io (Modern & Schnell)

### Vorteile:

- Kostenlos bis zu 3 Apps
- Sehr schnell (kein Sleep)
- Persistent Storage für SQLite

### Setup:

**1. Fly CLI installieren:**

```powershell
# Windows
iwr https://fly.io/install.ps1 -useb | iex
```

**2. Login & Deploy:**

```bash
cd backend
fly auth login
fly launch

# Folge dem Setup-Wizard
# Wähle Region: Frankfurt (fra)
```

**3. Persistent Volume für SQLite:**

```bash
fly volumes create jumpit_data --region fra --size 1
```

**4. fly.toml anpassen:**

```toml
[mounts]
  source = "jumpit_data"
  destination = "/data"
```

**5. Environment Variables:**

```bash
fly secrets set JWT_SECRET="dein-super-secret-key-2024"
fly secrets set ADMIN_PASSWORD="admin123"
```

**6. Deploy:**

```bash
fly deploy
```

---

## 🔧 OPTION 4: DigitalOcean App Platform

### Vorteile:

- Volle Kontrolle
- Sehr zuverlässig
- Skalierbar

### Kosten:

- $6/Monat für Basic

### Setup:

1. DigitalOcean Account erstellen
2. "Apps" → "Create App"
3. GitHub Repository verbinden
4. Root Directory: `backend`
5. Build Command: `npm install`
6. Run Command: `node server.js`

---

## 🗃️ Datenbank-Migration: SQLite → PostgreSQL (Optional)

Falls du auf **Heroku** oder eine **skalierbare Lösung** willst:

### Backend-Code anpassen:

**1. PostgreSQL installieren:**

```bash
npm install pg pg-hstore
```

**2. server.js erweitern:**

```javascript
// Statt SQLite:
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

// Queries anpassen:
pool.query("SELECT * FROM users WHERE username = $1", [username]);
```

**3. Tabellen in PostgreSQL erstellen:**

```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255),
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE scores (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    score INTEGER NOT NULL,
    coins INTEGER NOT NULL,
    time INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 📝 Zusammenfassung & Empfehlung

### Für Anfänger:

**→ Render.com (Kostenlos)**

- Einfachstes Setup
- Gut zum Testen
- Nachteile: Langsam beim Aufwachen

### Für Production:

**→ Railway.app ($5/Monat)**

- Perfekte Balance
- Schnell & zuverlässig
- SQLite funktioniert

### Für Skalierung:

**→ DigitalOcean + PostgreSQL ($6-12/Monat)**

- Professionell
- Unbegrenzt skalierbar

---

## 🚀 Quick Start: Railway (Empfohlen)

```bash
# 1. Railway CLI installieren
npm install -g railway

# 2. Login
railway login

# 3. Projekt erstellen
railway init

# 4. Backend deployen
cd backend
railway up

# 5. Domain erhalten
railway domain

# 6. URL in Frontend eintragen (api-client.js)
# return 'https://DEINE-RAILWAY-URL/api';
```

**Fertig in 5 Minuten! ✅**

---

## 💡 Tipp: CORS & Sicherheit

**Backend CORS anpassen für Production:**

```javascript
// server.js
const cors = require("cors");

const allowedOrigins = [
  "http://localhost:3000",
  "https://moe8212.github.io", // Deine GitHub Pages URL
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  })
);
```

---

## 📞 Support

Bei Fragen:

- Railway Docs: https://docs.railway.app
- Render Docs: https://render.com/docs
- Fly.io Docs: https://fly.io/docs
