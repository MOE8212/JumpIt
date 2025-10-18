# 🎮 JumpIt Backend API

Node.js backend mit Express, SQLite, JWT Authentication, und Admin Panel.

## 🚀 Features

- ✅ User Registration & Login (JWT Auth)
- ✅ Score Tracking mit Coins & Time
- ✅ Leaderboard (Top 10)
- ✅ Admin Panel APIs (CRUD für Users & Sessions)
- ✅ SQLite Database (Persistent Storage)
- ✅ CORS konfiguriert für Frontend
- ✅ Health Check Endpoint

## 📦 Installation

```bash
npm install
```

## 🔧 Konfiguration

Erstelle eine `.env` Datei:

```bash
PORT=3001
JWT_SECRET=dein-super-secret-key-change-in-production
ADMIN_PASSWORD=admin123
```

## ▶️ Starten

### Development (localhost):

```bash
npm start
# oder
node server.js
```

Server läuft auf: `http://localhost:3001`

### Production (Online Hosting):

Siehe `../BACKEND-DEPLOYMENT.md` und `../QUICK-DEPLOY.md`

## 📡 API Endpoints

### Public APIs

#### Health Check

```http
GET /api/health
```

Response: `{ "status": "OK", "timestamp": "2024-..." }`

#### Register

```http
POST /api/register
Content-Type: application/json

{
  "username": "player1",
  "email": "player@example.com",
  "password": "secure123"
}
```

#### Login

```http
POST /api/login
Content-Type: application/json

{
  "username": "player1",
  "password": "secure123"
}
```

Response: `{ "token": "jwt_token...", "user": {...} }`

#### Leaderboard

```http
GET /api/leaderboard?limit=10
```

### Authenticated APIs (Require JWT Token)

#### Submit Score

```http
POST /api/scores
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "score": 1000,
  "coins": 50,
  "time": 120
}
```

#### Get User Best Score

```http
GET /api/user/best-score
Authorization: Bearer <jwt_token>
```

### Admin APIs (Require Admin Password)

#### Get All Users

```http
GET /api/admin/users
X-Admin-Password: admin123
```

#### Update User

```http
PUT /api/admin/users/:id
X-Admin-Password: admin123
Content-Type: application/json

{
  "username": "newname",
  "email": "new@email.com",
  "password": "newpassword"
}
```

#### Delete User

```http
DELETE /api/admin/users/:id
X-Admin-Password: admin123
```

#### Get All Sessions

```http
GET /api/admin/sessions?limit=50
X-Admin-Password: admin123
```

#### Update Session

```http
PUT /api/admin/sessions/:id
X-Admin-Password: admin123
Content-Type: application/json

{
  "score": 2000,
  "coins": 100,
  "time": 150
}
```

#### Delete Session

```http
DELETE /api/admin/sessions/:id
X-Admin-Password: admin123
```

#### Get Admin Stats

```http
GET /api/admin/stats
X-Admin-Password: admin123
```

Response:

```json
{
  "totalUsers": 10,
  "totalGames": 50,
  "avgScore": 1234.5,
  "topPlayer": "player1"
}
```

## 🗄️ Datenbank

SQLite Datenbank: `game.db` (automatisch erstellt)

### Tabellen:

**users**

- id (INTEGER PRIMARY KEY)
- username (TEXT UNIQUE)
- email (TEXT)
- password (TEXT, bcrypt hashed)
- created_at (DATETIME)

**scores**

- id (INTEGER PRIMARY KEY)
- user_id (INTEGER, FOREIGN KEY)
- score (INTEGER)
- coins (INTEGER)
- time (INTEGER)
- created_at (DATETIME)

## 🔒 Sicherheit

- ✅ Passwörter werden mit bcrypt gehasht (10 Runden)
- ✅ JWT Tokens für Authentication
- ✅ Admin-Passwort für Admin-APIs
- ✅ CORS konfiguriert
- ⚠️ Für Production: JWT_SECRET und ADMIN_PASSWORD ändern!

## 🧪 Testing

```bash
# Health Check
curl http://localhost:3001/api/health

# Register
curl -X POST http://localhost:3001/api/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@test.com","password":"test123"}'

# Login
curl -X POST http://localhost:3001/api/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test123"}'
```

## 🌐 Deployment

Siehe separate Deployment-Guides:

- `../BACKEND-DEPLOYMENT.md` - Detaillierte Optionen
- `../QUICK-DEPLOY.md` - Schnellstart für Railway/Render

### Quick Deploy (Railway):

```bash
npm install -g railway
railway login
cd backend
railway up
```

## 📝 Logs

```bash
# Development
node server.js

# Production (mit PM2)
pm2 start server.js --name jumpit-backend
pm2 logs jumpit-backend
```

## 🐛 Troubleshooting

**Problem: Port already in use**

```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Mac/Linux
lsof -i :3001
kill -9 <PID>
```

**Problem: Database locked**

```bash
# Stoppe Server und lösche Database
rm game.db
# Starte Server neu - DB wird automatisch neu erstellt
```

## 📞 Support

- Frontend: `index.html`, `game.js`, `auth-backend.js`
- API Client: `api-client.js`
- Deployment: `../BACKEND-DEPLOYMENT.md`
