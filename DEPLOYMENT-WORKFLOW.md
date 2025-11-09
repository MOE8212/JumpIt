# 🚀 Multi-Branch Deployment Workflow

## Übersicht

JumpIt verwendet GitHub Actions für automatisches Deployment auf verschiedene Umgebungen:

- **Production**: `main` Branch → https://jump-verse.com/
- **Beta**: `beta` Branch → https://jump-verse.com/beta/

## Workflow

### 1. Neue Features entwickeln

```bash
# Beta Branch auschecken
git checkout beta

# Feature entwickeln
# ... Code ändern ...

# Änderungen committen
git add .
git commit -m "Neues Feature XYZ"

# Zu GitHub pushen
git push origin beta
```

**→ GitHub Actions deployed automatisch zu jump-verse.com/beta/**

### 2. Beta testen

- Öffne https://jump-verse.com/beta/
- Teste alle neuen Features
- Prüfe Funktionalität auf Desktop & Mobile
- Bei Problemen: Weitere Commits im beta Branch

### 3. Zu Production deployen

```bash
# Wenn Beta OK ist, zurück zu main
git checkout main

# Beta in main mergen
git merge beta

# Zu GitHub pushen
git push origin main
```

**→ GitHub Actions deployed automatisch zu jump-verse.com/**

## Technische Details

### GitHub Actions Workflow

Der Workflow (`.github/workflows/deploy.yml`) läuft automatisch bei:
- Push auf `main` Branch
- Push auf `beta` Branch

### Deploy-Logik

1. **main Branch**:
   - Version wird automatisch aktualisiert
   - Files werden ins Root des gh-pages Branch deployed
   - Alte beta/ Dateien bleiben erhalten

2. **beta Branch**:
   - Keine Version-Updates
   - Files werden ins `beta/` Verzeichnis deployed
   - Production (Root) bleibt unverändert

### Verzeichnisstruktur auf gh-pages

```
gh-pages/
├── index.html          (Production - main Branch)
├── game.js
├── auth.js
├── styles.css
└── beta/
    ├── index.html      (Beta - beta Branch)
    ├── game.js
    ├── auth.js
    └── styles.css
```

## Tipps

### Schnelles Testing
```bash
# Zwischen Branches wechseln
git checkout beta    # Für Beta-Entwicklung
git checkout main    # Für Hotfixes

# Aktuellen Branch anzeigen
git branch
```

### Hotfixes direkt auf main
```bash
# Bei kritischen Bugs
git checkout main
# ... Fix implementieren ...
git add .
git commit -m "Hotfix: Kritischer Bug behoben"
git push origin main
```

### Beta zurücksetzen
```bash
# Beta mit main synchronisieren
git checkout beta
git merge main
git push origin beta
```

## Wichtige URLs

- **Production**: https://jump-verse.com/
- **Beta**: https://jump-verse.com/beta/
- **GitHub Repo**: https://github.com/MOE8212/JumpIt
- **GitHub Actions**: https://github.com/MOE8212/JumpIt/actions

## Fehlerbehebung

### Action schlägt fehl?
1. Gehe zu [GitHub Actions](https://github.com/MOE8212/JumpIt/actions)
2. Klicke auf die fehlgeschlagene Action
3. Prüfe die Logs

### Beta zeigt alte Version?
1. Warte 1-2 Minuten (GitHub Pages Cache)
2. Hard Refresh: `Ctrl + Shift + R` (Windows) oder `Cmd + Shift + R` (Mac)
3. Prüfe GitHub Actions Status

### Merge-Konflikte?
```bash
git checkout beta
git merge main      # main in beta mergen
# Konflikte lösen
git add .
git commit -m "Merge-Konflikte behoben"
git push origin beta
```

## Best Practices

✅ **DO**:
- Immer in beta entwickeln und testen
- Erst nach erfolgreichem Test zu main mergen
- Aussagekräftige Commit-Messages

❌ **DON'T**:
- Nie direkt auf main entwickeln (außer Hotfixes)
- Keine ungetesteten Features zu main mergen
- gh-pages Branch nicht manuell bearbeiten (wird automatisch verwaltet)

