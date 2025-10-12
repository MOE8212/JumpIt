# GitHub Actions Workflows

## 🚀 Automatisches Deployment

Der `deploy.yml` Workflow deployed JumpIt automatisch zu GitHub Pages.

### Trigger-Optionen:

#### 1️⃣ Automatisch bei jedem Push

```bash
git add .
git commit -m "Deine Änderungen"
git push origin main
```

→ Deployment startet automatisch!

#### 2️⃣ Manuell über GitHub UI

1. Gehe zu: https://github.com/MOE8212/JumpIt/actions
2. Klicke auf **"Deploy to GitHub Pages"** (linke Sidebar)
3. Klicke auf **"Run workflow"** (rechts oben)
4. Wähle Branch: **main**
5. Klicke **"Run workflow"**

### Was der Workflow macht:

✅ **Version aktualisieren**

- Holt den aktuellen Commit-Hash
- Aktualisiert `index.html` automatisch
- Committed die Änderung zurück (mit `[skip ci]`)

✅ **Deployment**

- Verifiziert alle Dateien
- Uploaded zu GitHub Pages
- Deployed die neue Version

### Deployment-Status prüfen:

- **Badge**: Füge in README.md ein:

  ```markdown
  ![Deploy Status](https://github.com/MOE8212/JumpIt/actions/workflows/deploy.yml/badge.svg)
  ```

- **Actions Tab**: https://github.com/MOE8212/JumpIt/actions

### Troubleshooting:

**Problem:** Deployment schlägt fehl

- Prüfe GitHub Pages Einstellungen: Settings → Pages
- Source sollte sein: "GitHub Actions"

**Problem:** Keine Berechtigung für Pages

- Gehe zu: Settings → Actions → General
- Unter "Workflow permissions": Wähle "Read and write permissions"
- Aktiviere "Allow GitHub Actions to create and approve pull requests"

### Lokale Version-Updates:

Das `update-version.js` Script funktioniert auch lokal:

```bash
npm run update-version
```

Oder mit dem Git pre-commit Hook (automatisch bei jedem Commit).
