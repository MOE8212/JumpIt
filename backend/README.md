# JumpIt Backend

Backend API für das JumpIt Jump 'n Run Game.

## Features

- **Benutzerregistrierung & Login**: Sichere Authentifizierung mit JWT
- **Score-System**: Speichern und Abrufen von Highscores
- **Rangliste**: Top 10 Spieler anzeigen
- **REST API**: Einfache API-Endpunkte für Frontend-Integration

## Installation

1. Abhängigkeiten installieren:
```bash
cd backend
npm install
```

2. Umgebungsvariablen einrichten:
```bash
cp env.example .env
# Bearbeite .env mit deinen Werten
```

3. Server starten:
```bash
# Entwicklung
npm run dev

# Produktion
npm start
```

Der Server läuft standardmäßig auf `http://localhost:3001`.

## API-Endpunkte

### Authentifizierung

#### POST `/api/register`
Registriert einen neuen Benutzer.

**Request:**
```json
{
  "username": "spieler123",
  "email": "spieler@example.com",
  "password": "sicheresPasswort"
}
```

**Response:**
```json
{
  "message": "User created successfully",
  "token": "jwt-token",
  "user": {
    "id": 1,
    "username": "spieler123",
    "email": "spieler@example.com"
  }
}
```

#### POST `/api/login`
Meldet einen Benutzer an.

**Request:**
```json
{
  "username": "spieler123",
  "password": "sicheresPasswort"
}
```

**Response:**
```json
{
  "message": "Login successful",
  "token": "jwt-token",
  "user": {
    "id": 1,
    "username": "spieler123",
    "email": "spieler@example.com"
  }
}
```

### Scores

#### POST `/api/scores`
Speichert einen neuen Score (benötigt Authentifizierung).

**Request:**
```json
{
  "score": 1250,
  "coins": 8,
  "time": 95
}
```

**Response:**
```json
{
  "message": "Score saved successfully",
  "scoreId": 123
}
```

#### GET `/api/leaderboard`
Ruft die Rangliste ab.

**Query Parameter:**
- `limit` (optional): Anzahl der Einträge (Standard: 10)

**Response:**
```json
{
  "leaderboard": [
    {
      "username": "spieler123",
      "score": 1250,
      "coins": 8,
      "time": 95,
      "created_at": "2024-01-15T10:30:00.000Z"
    }
  ]
}
```

#### GET `/api/user/best-score`
Ruft den besten Score des angemeldeten Benutzers ab (benötigt Authentifizierung).

**Response:**
```json
{
  "bestScore": {
    "score": 1250,
    "coins": 8,
    "time": 95,
    "created_at": "2024-01-15T10:30:00.000Z"
  }
}
```

### Utility

#### GET `/api/health`
Health Check Endpoint.

**Response:**
```json
{
  "status": "OK",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Datenbank

Das Backend verwendet SQLite mit folgenden Tabellen:

### `users`
- `id` (INTEGER PRIMARY KEY)
- `username` (TEXT UNIQUE)
- `email` (TEXT)
- `password` (TEXT - gehasht)
- `created_at` (DATETIME)

### `scores`
- `id` (INTEGER PRIMARY KEY)
- `user_id` (INTEGER - Foreign Key)
- `score` (INTEGER)
- `coins` (INTEGER)
- `time` (INTEGER)
- `created_at` (DATETIME)

## Sicherheit

- Passwörter werden mit bcrypt gehasht
- JWT-Token für Authentifizierung
- CORS-Unterstützung für Frontend-Integration
- Input-Validierung

## Entwicklung

### Umgebungsvariablen

Erstelle eine `.env` Datei basierend auf `env.example`:

```env
PORT=3001
JWT_SECRET=dein-super-geheimer-schlüssel
DB_PATH=./game.db
CORS_ORIGIN=http://localhost:3000
```

### Scripts

- `npm start`: Startet den Server
- `npm run dev`: Startet den Server mit nodemon (Auto-Reload)
- `npm test`: Führt Tests aus (noch nicht implementiert)

## Deployment

### Lokale Entwicklung

1. Backend starten:
```bash
cd backend
npm run dev
```

2. Frontend starten:
```bash
npm start
```

### Produktion

Für Produktions-Deployment:

1. Setze `JWT_SECRET` auf einen sicheren Wert
2. Konfiguriere CORS für deine Domain
3. Verwende einen Produktions-Datenbankserver (PostgreSQL, MySQL)
4. Setze `NODE_ENV=production`

## Troubleshooting

### Häufige Probleme

1. **Port bereits belegt**: Ändere den PORT in der `.env` Datei
2. **CORS-Fehler**: Überprüfe die CORS-Konfiguration
3. **Datenbankfehler**: Stelle sicher, dass SQLite installiert ist

### Logs

Das Backend loggt wichtige Ereignisse in die Konsole. Für Produktions-Deployment solltest du ein Logging-System wie Winston verwenden.




