# 🐺 JumpIt - Werewolf Jump 'n Run Game

Ein Jump 'n Run Spiel mit Phaser.js, entwickelt von MOE8212.

## 🎮 Live Demo

**Production**: [jump-verse.com](https://jump-verse.com)

## 🛠️ Tech Stack

- **Frontend**: Phaser.js 3.70.0, Vanilla JavaScript
- **Backend**: Node.js + Express + SQLite (optional)
- **Deployment**: GitHub Pages
- **Database**: Supabase (Cloud)

## 🚀 Features

- 🏃 Jump 'n Run Gameplay mit Phaser.js
- 🛒 Shop-System für Skins
- 🏆 Leaderboard & User Authentication (Supabase)
- 📊 Admin Panel für Statistiken
- 📱 Mobile Controls & Touch-Support
- 🖥️ Fullscreen-Modus (iOS-kompatibel)
- 💾 Offline-Modus mit localStorage

## 📁 Projekt-Struktur

```
JumpIt/
├── index.html              # Haupt-HTML (DEPLOYED)
├── game.js                 # Phaser Game Logic
├── auth-supabase.js        # Supabase Authentication
├── api-client-supabase.js  # Supabase API Client
├── styles.css              # All Styles
├── backend/                # Node.js Backend (Optional/Legacy)
│   ├── server.js          # Express Server
│   └── game.db            # SQLite Database
└── .github/
    └── workflows/
        └── deploy.yml     # GitHub Actions Deployment
```

## 🔧 Lokale Entwicklung

### 1. Repository klonen
```bash
git clone https://github.com/MOE8212/JumpIt.git
cd JumpIt
```

### 2. Live Server starten
```bash
# Python Server (einfachste Methode)
python -m http.server 8000

# Oder Node.js Server
npx http-server -p 8000
```

### 3. Im Browser öffnen
```
http://localhost:8000
```

## 🚢 Deployment

### GitHub Pages (Aktuell)
Das Spiel wird automatisch deployed bei jedem Push auf `main`:

```bash
git add .
git commit -m "Deine Änderung"
git push origin main
```

➡️ Automatisches Deployment via GitHub Actions zu [jump-verse.com](https://jump-verse.com)

### Deployment-Workflow
- **Branch**: `main` (Production only)
- **Platform**: GitHub Pages
- **Domain**: jump-verse.com
- **Build Info**: Wird automatisch in index.html als Kommentar eingefügt

## 📝 Code-Standards

- Deutsche Kommentare und UI-Texte
- Emojis in UI für bessere UX
- Mobile-First Approach
- localStorage für Offline-Features

## 🎯 Features in Entwicklung

- [ ] Weitere Levels
- [ ] Mehr Skins
- [ ] Achievements System
- [ ] Multiplayer Mode (geplant)

## 📄 Lizenz

Dieses Projekt ist privat und nicht für kommerzielle Nutzung bestimmt.

## 👤 Autor

**MOE8212**
- GitHub: [@MOE8212](https://github.com/MOE8212)
- Website: [jump-verse.com](https://jump-verse.com)

## 🙏 Credits

- Game Engine: [Phaser.js](https://phaser.io/)
- Backend: [Supabase](https://supabase.com/)
- Hosting: [GitHub Pages](https://pages.github.com/)
