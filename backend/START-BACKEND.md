# 🚀 JumpIt Backend - Schnellstart

## ✅ Backend starten

```bash
cd backend
npm install
npm start
```

**Backend läuft dann auf: `http://localhost:3001`**

## 🔐 Konfiguration

Das Backend nutzt diese Einstellungen (aus `.env`):

- **PORT**: 3001
- **JWT_SECRET**: jumpit-secret-key-2024-development
- **ADMIN_PASSWORD**: admin123

## 📊 Datenbank

Die Datenbank `game.db` wird **automatisch** erstellt beim ersten Start.

**WICHTIG:** Die `.db` Datei ist in `.gitignore` und wird **NICHT** committed!
→ Deine Daten bleiben lokal und gehen bei Git-Commits NICHT verloren!

## 🧪 Backend testen

```bash
# Health Check
curl http://localhost:3001/api/health

# Sollte returnen:
# {"status":"OK","timestamp":"2024-..."}
```

## 📡 API Endpoints

### Public APIs:

- `POST /api/register` - Neuen User registrieren
- `POST /api/login` - User einloggen
- `GET /api/leaderboard` - Top 10 Scores
- `GET /api/health` - Health Check

### Authenticated APIs (benötigt JWT Token):

- `POST /api/scores` - Score einreichen
- `GET /api/user/best-score` - Bester Score des Users

### Admin APIs (benötigt Admin-Passwort):

- `GET /api/admin/users` - Alle User
- `PUT /api/admin/users/:id` - User bearbeiten
- `DELETE /api/admin/users/:id` - User löschen
- `GET /api/admin/sessions` - Alle Sessions
- `PUT /api/admin/sessions/:id` - Session bearbeiten
- `DELETE /api/admin/sessions/:id` - Session löschen
- `GET /api/admin/stats` - Admin-Statistiken

## 🎮 Frontend verbinden

Das Frontend ist bereits konfiguriert!

Starte einfach:

```bash
# Im Hauptverzeichnis
npm start
```

Das Frontend connected automatisch zu `http://localhost:3001`

## 🔧 Troubleshooting

**Problem:** Backend startet nicht

```bash
# Prüfe ob Port 3001 frei ist
netstat -ano | findstr :3001

# Falls belegt, ändere Port in .env
```

**Problem:** "Cannot connect to database"

```bash
# Lösche die alte Datenbank und starte neu
rm game.db
npm start
```

**Problem:** Admin-Login funktioniert nicht

- Prüfe Admin-Passwort in `backend/.env`
- Standard ist: `admin123`

## 📦 Production Deployment

Für Production:

1. Ändere `JWT_SECRET` in `.env`
2. Ändere `ADMIN_PASSWORD`
3. Nutze HTTPS
4. Deploye Backend zu Heroku/Railway/etc.
5. Update `API_BASE_URL` im Frontend

## 🗃️ Datenbank-Struktur

### users

- id, username, email, password (bcrypt), created_at

### scores

- id, user_id, score, coins, time, created_at
