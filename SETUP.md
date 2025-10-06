# JumpIt Game - Setup Guide

Dieses Dokument erklärt, wie du das JumpIt Jump 'n Run Game lokal einrichtest und startest.

## Voraussetzungen

- **Node.js** (Version 14 oder höher)
- **npm** (kommt mit Node.js)
- Ein moderner Webbrowser (Chrome, Firefox, Safari, Edge)

## Installation

### 1. Repository klonen oder herunterladen

```bash
git clone <repository-url>
cd jumpit-game
```

### 2. Frontend-Dependencies installieren

```bash
npm install
```

### 3. Backend-Dependencies installieren

```bash
cd backend
npm install
cd ..
```

## Starten des Spiels

### Option 1: Vollständiges Setup (Frontend + Backend)

1. **Backend starten:**
```bash
cd backend
npm run dev
```
Das Backend läuft auf `http://localhost:3001`

2. **Frontend starten** (in einem neuen Terminal):
```bash
npm start
```
Das Frontend öffnet sich automatisch im Browser unter `http://localhost:3000`

### Option 2: Nur Frontend (ohne Backend-Features)

```bash
npm start
```

**Hinweis:** Ohne Backend funktionieren nur die Spielfunktionen. Registrierung, Login und Rangliste sind nicht verfügbar.

## Erste Schritte

1. **Registrierung:** Erstelle einen neuen Benutzeraccount
2. **Login:** Melde dich mit deinen Daten an
3. **Spielen:** 
   - **Desktop:** Pfeiltasten zum Laufen, Leertaste zum Springen
   - **Mobile:** Verwende die Touch-Buttons am unteren Bildschirmrand
4. **Ziel:** Sammle Münzen, vermeide Gegner und erreiche das grüne Ziel
5. **Rangliste:** Überprüfe deine Platzierung über den 🏆-Button

## Spielmechaniken

### Bewegung
- **Links/Rechts:** Laufen
- **Springen:** Leertaste oder Pfeil nach oben
- **Mobile:** Touch-Buttons für alle Aktionen

### Sammeln & Punkte
- **Münzen:** Sammle goldene Münzen für Punkte (+10 pro Münze)
- **Gegner töten:** Springe auf Gegner für Bonuspunkte (+20)
- **Zeitbonus:** Schnelle Levelabschlüsse geben Zeitbonus

### Leben
- **Start:** 3 Herzen
- **Schaden:** Berührung von Gegnern kostet ein Leben
- **Game Over:** Bei 0 Leben

### Level-Ziel
- **Ziel:** Erreiche das grüne Ziel am Ende des Levels
- **Abgeschlossen:** Alle Münzen sammeln + Ziel erreichen

## Technische Details

### Frontend
- **Framework:** Phaser 3
- **Port:** 3000
- **Features:** Canvas-basiertes Rendering, Touch-Steuerung, Responsive Design

### Backend
- **Framework:** Node.js + Express
- **Port:** 3001
- **Datenbank:** SQLite
- **Authentifizierung:** JWT
- **API:** RESTful

### Dateistruktur
```
jumpit-game/
├── index.html          # Haupt-HTML
├── styles.css          # CSS-Styles
├── game.js             # Spiellogik
├── auth.js             # Authentifizierung
├── package.json        # Frontend-Dependencies
├── test.html           # Test-Seite
├── backend/            # Backend-Code
│   ├── server.js       # Express-Server
│   ├── package.json    # Backend-Dependencies
│   └── README.md       # Backend-Dokumentation
└── README.md           # Projekt-Dokumentation
```

## Troubleshooting

### Häufige Probleme

#### Backend startet nicht
```bash
# Überprüfe, ob Port 3001 frei ist
netstat -an | grep 3001

# Ändere Port in backend/.env
PORT=3002
```

#### Frontend kann Backend nicht erreichen
- Stelle sicher, dass Backend läuft
- Überprüfe CORS-Einstellungen
- Teste Backend direkt: `http://localhost:3001/api/health`

#### Mobile Controls funktionieren nicht
- Verwende Touch-Events, nicht Maus-Events
- Teste auf echtem Mobile-Gerät
- Überprüfe Viewport-Meta-Tag

#### Authentifizierung funktioniert nicht
- Überprüfe JWT_SECRET in backend/.env
- Stelle sicher, dass Datenbank erstellt wurde
- Teste API-Endpunkte direkt

### Debug-Modus

#### Frontend Debug
```bash
# Öffne Browser-Entwicklertools (F12)
# Überprüfe Console für Fehler
```

#### Backend Debug
```bash
cd backend
DEBUG=* npm run dev
```

### Performance-Probleme

#### Spiel läuft langsam
- Reduziere Anzahl der Gegner
- Vereinfache Grafiken
- Überprüfe Browser-Performance

#### Mobile Performance
- Teste auf verschiedenen Geräten
- Reduziere Partikel-Effekte
- Optimiere Touch-Responsivität

## Entwicklung

### Neue Features hinzufügen

1. **Frontend:** Bearbeite `game.js` für Spiellogik
2. **Backend:** Erweitere `backend/server.js` für neue API-Endpunkte
3. **UI:** Modifiziere `styles.css` für Design-Änderungen

### Testing

```bash
# Öffne test.html im Browser
# Führe alle Tests aus
# Überprüfe Funktionalität
```

### Deployment

#### Lokale Produktion
```bash
# Backend
cd backend
NODE_ENV=production npm start

# Frontend
npm run build  # Falls Build-Prozess vorhanden
```

#### Cloud-Deployment
- **Frontend:** Vercel, Netlify, GitHub Pages
- **Backend:** Render, Heroku, Railway
- **Datenbank:** PostgreSQL für Produktion

## Support

Bei Problemen:
1. Überprüfe dieses Setup-Guide
2. Schau in die README-Dateien
3. Teste mit `test.html`
4. Überprüfe Browser-Konsole für Fehler

## Nächste Schritte

Nach erfolgreichem Setup:
1. Spiele das Spiel und teste alle Features
2. Experimentiere mit den Entwicklertools
3. Erweitere das Spiel um neue Levels oder Features
4. Deploye es für andere Spieler

Viel Spaß beim Spielen! 🎮




