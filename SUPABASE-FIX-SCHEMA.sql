-- JumpIt Supabase Schema Fix
-- Dieses SQL korrigiert die User-ID von BIGINT zu UUID

-- 1. Alte Tabellen löschen (wenn vorhanden)
DROP TABLE IF EXISTS public.scores CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
DROP VIEW IF EXISTS public.admin_stats CASCADE;

-- 2. Users Tabelle mit UUID erstellen
CREATE TABLE public.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Scores Tabelle mit UUID Foreign Key
CREATE TABLE public.scores (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    username TEXT NOT NULL,
    score INTEGER NOT NULL DEFAULT 0,
    coins INTEGER NOT NULL DEFAULT 0,
    time INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Indexes für Performance
CREATE INDEX idx_scores_user_id ON public.scores(user_id);
CREATE INDEX idx_scores_score ON public.scores(score DESC);
CREATE INDEX idx_users_username ON public.users(username);

-- 5. Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scores ENABLE ROW LEVEL SECURITY;

-- 6. Policies für Users (Jeder kann lesen und schreiben)
DROP POLICY IF EXISTS "Users are viewable by everyone" ON public.users;
CREATE POLICY "Users are viewable by everyone"
    ON public.users FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
CREATE POLICY "Users can insert their own profile"
    ON public.users FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own profile" ON public.users;
CREATE POLICY "Users can update own profile"
    ON public.users FOR UPDATE
    USING (true);

-- 7. Policies für Scores (Jeder kann lesen, nur eingeloggte User können schreiben)
DROP POLICY IF EXISTS "Scores are viewable by everyone" ON public.scores;
CREATE POLICY "Scores are viewable by everyone"
    ON public.scores FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert scores" ON public.scores;
CREATE POLICY "Authenticated users can insert scores"
    ON public.scores FOR INSERT
    WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own scores" ON public.scores;
CREATE POLICY "Users can update own scores"
    ON public.scores FOR UPDATE
    USING (true);

DROP POLICY IF EXISTS "Users can delete own scores" ON public.scores;
CREATE POLICY "Users can delete own scores"
    ON public.scores FOR DELETE
    USING (true);

-- 8. Admin View für Statistiken
CREATE OR REPLACE VIEW public.admin_stats AS
SELECT
    COUNT(DISTINCT user_id) as total_users,
    COUNT(*) as total_games,
    ROUND(AVG(score), 2) as avg_score,
    MAX(score) as max_score,
    (SELECT username FROM public.scores ORDER BY score DESC LIMIT 1) as top_player
FROM public.scores;

-- 9. Grant permissions
GRANT ALL ON public.users TO anon, authenticated;
GRANT ALL ON public.scores TO anon, authenticated;
GRANT SELECT ON public.admin_stats TO anon, authenticated;
GRANT USAGE ON SEQUENCE scores_id_seq TO anon, authenticated;

-- 10. Erfolgsbestätigung
DO $$
BEGIN
    RAISE NOTICE '✅ Schema erfolgreich aktualisiert!';
    RAISE NOTICE '✅ User-IDs sind jetzt UUID statt BIGINT';
    RAISE NOTICE '✅ Alle Policies neu erstellt';
END $$;

