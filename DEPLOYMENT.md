# 🚀 Deployment Workflow - JumpIt

## Production Deployment

**URL**: https://jump-verse.com/

### Automatisches Deployment

Bei jedem Push auf `main` Branch:
1. GitHub Actions läuft automatisch
2. Version wird aktualisiert (Build-Info)
3. Files werden zu GitHub Pages deployed
4. Live in ~1-2 Minuten

### Workflow

```bash
# Entwicklung auf main Branch
git checkout main

# Änderungen machen
# ... Code bearbeiten ...

# Committen
git add .
git commit -m "Feature: Beschreibung"

# Pushen → Automatisches Deployment!
git push origin main
```

**Nach 1-2 Minuten**: https://jump-verse.com/ zeigt die neue Version

---

## Wichtige Hinweise

### ✅ **DO:**
- Auf main Branch entwickeln
- Aussagekräftige Commit-Messages
- Vor dem Push testen (lokal)
- Nach dem Deployment testen (jump-verse.com)

### ❌ **DON'T:**
- Nicht direkt auf gh-pages Branch pushen
- Keine ungetesteten Änderungen pushen
- Nicht force-pushen ohne Grund

---

## Deployment prüfen

### GitHub Actions Status:
👉 https://github.com/MOE8212/JumpIt/actions

**Grünes Häkchen** ✅ = Deployment erfolgreich  
**Rotes X** ❌ = Deployment fehlgeschlagen (Logs prüfen)

### Live-Site:
👉 https://jump-verse.com/

**Hard Refresh**: `Ctrl + Shift + R` (Windows) oder `Cmd + Shift + R` (Mac)

---

## Bei Problemen

### Deployment schlägt fehl?
1. Gehe zu GitHub Actions (Link oben)
2. Klicke auf fehlgeschlagene Action
3. Prüfe Logs im "deploy" Job
4. Fix pushen → Action läuft erneut

### Änderungen nicht sichtbar?
1. Warte 2-3 Minuten
2. Hard Refresh im Browser
3. Prüfe GitHub Actions Status
4. Cache leeren: `Ctrl + F5`

### Alte Version noch live?
- GitHub Pages Cache: Bis zu 10 Minuten
- Browser Cache: Hard Refresh
- CDN Cache: Automatisch nach ~5 Minuten

---

## Technische Details

### GitHub Actions Workflow
**Datei**: `.github/workflows/deploy.yml`

**Jobs:**
1. **update-version**: Build-Info in index.html aktualisieren
2. **deploy**: Files zu GitHub Pages deployen

**Deployment-Pfad:**
```
main Branch
  ↓ (push)
GitHub Actions
  ↓ (build + deploy)
gh-pages Branch
  ↓ (served by)
https://jump-verse.com/
```

### Domain-Konfiguration
- **Domain**: jump-verse.com
- **DNS**: Zeigt auf GitHub Pages
- **CNAME**: In Repository root
- **HTTPS**: Automatisch von GitHub

---

## Quick Reference

```bash
# Status prüfen
git status

# Änderungen committen
git add .
git commit -m "Beschreibung"

# Pushen + Deployen
git push origin main

# Logs ansehen (nach Push)
# → https://github.com/MOE8212/JumpIt/actions
```

**Deployment-Zeit**: ~1-2 Minuten  
**Cache-Refresh**: ~5-10 Minuten  
**Hard-Refresh**: Sofort (empfohlen beim Testen)

