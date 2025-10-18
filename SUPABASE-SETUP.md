# 🚀 JumpIt - Supabase Setup Guide

## Schritt 1: Account erstellen

1. Gehe zu: **https://supabase.com**
2. Klicke auf **"Start your project"**
3. Signup mit GitHub (empfohlen) oder Email

## Schritt 2: Neues Projekt erstellen

1. Klicke auf **"New Project"**
2. Einstellungen:

   - **Name:** `jumpit-game`
   - **Database Password:** Wähle ein sicheres Passwort (speichere es!)
   - **Region:** Frankfurt (eu-central-1)
   - **Pricing Plan:** Free

3. Klicke auf **"Create new project"**
4. ⏳ Warte ~2 Minuten bis Projekt erstellt ist

## Schritt 3: Datenbank-Tabellen erstellen

1. In der Sidebar: Klicke auf **"SQL Editor"**
2. Klicke auf **"New query"**
3. Kopiere folgenden SQL-Code:

```sql
-- Users Tabelle
CREATE TABLE public.users (
    id BIGSERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Scores Tabelle
CREATE TABLE public.scores (
    id BIGSERIAL PRIMARY KEY,
    user_id BIGINT REFERENCES public.users(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    score INTEGER NOT NULL DEFAULT 0,
    coins INTEGER NOT NULL DEFAULT 0,
    time INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes für Performance
CREATE INDEX idx_scores_user_id ON public.scores(user_id);
CREATE INDEX idx_scores_score ON public.scores(score DESC);
CREATE INDEX idx_users_username ON public.users(username);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;

-- Policies für Users (Jeder kann lesen, nur eigene Daten ändern)
CREATE POLICY "Users are viewable by everyone"
    ON public.users FOR SELECT
    USING (true);

CREATE POLICY "Users can insert their own profile"
    ON public.users FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can update own profile"
    ON public.users FOR UPDATE
    USING (auth.uid()::text = id::text);

-- Policies für Scores (Jeder kann lesen, nur eingeloggte User können schreiben)
CREATE POLICY "Scores are viewable by everyone"
    ON public.scores FOR SELECT
    USING (true);

CREATE POLICY "Authenticated users can insert scores"
    ON public.scores FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can update own scores"
    ON public.scores FOR UPDATE
    USING (username = current_setting('request.jwt.claims', true)::json->>'username');

-- Admin View für Statistiken
CREATE OR REPLACE VIEW public.admin_stats AS
SELECT
    COUNT(DISTINCT user_id) as total_users,
    COUNT(*) as total_games,
    ROUND(AVG(score), 2) as avg_score,
    MAX(score) as max_score,
    (SELECT username FROM public.scores ORDER BY score DESC LIMIT 1) as top_player
FROM public.scores;

-- Grant permissions
GRANT ALL ON public.users TO anon, authenticated;
GRANT ALL ON public.scores TO anon, authenticated;
GRANT SELECT ON public.admin_stats TO anon, authenticated;
GRANT USAGE ON SEQUENCE users_id_seq TO anon, authenticated;
GRANT USAGE ON SEQUENCE scores_id_seq TO anon, authenticated;
```

4. Klicke auf **"Run"** (oder F5)
5. Du solltest sehen: ✅ **Success. No rows returned**

## Schritt 4: API Keys kopieren

1. In der Sidebar: Klicke auf **"Settings"** (Zahnrad-Icon)
2. Klicke auf **"API"**
3. Kopiere folgende Werte:

### ⚠️ WICHTIG - Speichere diese Werte:

```
Project URL: https://xxxxxxxxxxxxx.supabase.co
anon/public key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc...
```

Die `anon` key ist **öffentlich** und kann im Frontend verwendet werden!

## Schritt 5: API Keys im Frontend eintragen

Öffne im Code-Editor die Datei: `supabase-config.js` (wird gleich erstellt)

Trage deine Werte ein:

```javascript
const SUPABASE_URL = "https://DEIN-PROJECT-ID.supabase.co";
const SUPABASE_ANON_KEY = "DEIN-ANON-KEY";
```

## ✅ Setup abgeschlossen!

Wenn du diese Schritte erledigt hast, sage mir Bescheid!

Dann mache ich weiter mit der Code-Integration.

---

## 🔍 Optional: Datenbank testen

Im SQL Editor kannst du testen:

```sql
-- Test: User erstellen
INSERT INTO users (username, email)
VALUES ('testuser', 'test@example.com');

-- Test: User anzeigen
SELECT * FROM users;

-- Test: Score hinzufügen
INSERT INTO scores (user_id, username, score, coins, time)
VALUES (1, 'testuser', 1000, 50, 120);

-- Test: Leaderboard
SELECT username, score, coins, time, created_at
FROM scores
ORDER BY score DESC
LIMIT 10;
```

---

## 🆘 Probleme?

**"SQL Error"**: Prüfe ob du den kompletten SQL-Code kopiert hast

**"Permission denied"**: Normal! Row Level Security ist aktiviert

**"Connection error"**: Warte noch einen Moment, Projekt wird noch erstellt

---

## 📞 Nächster Schritt

Wenn Setup fertig → Sage mir deine **Project URL** und ich passe den Code an!

(Die anon key NICHT hier posten - die kommt direkt in den Code)
