-- =====================================================
-- JumpIt - Traffic Tracking Tables für Supabase
-- =====================================================
-- Erstelle diese Tabellen in deinem Supabase SQL-Editor
-- https://supabase.com/dashboard/project/YOUR_PROJECT/editor
-- =====================================================

-- 1. TRAFFIC TABELLE (Haupt-Tracking)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.traffic (
    id BIGSERIAL PRIMARY KEY,
    session_id TEXT NOT NULL,
    page_url TEXT NOT NULL,
    page_title TEXT,
    referrer TEXT,
    device_type TEXT,  -- Mobile, Tablet, Desktop
    device_screen TEXT,
    browser TEXT,
    language TEXT,
    session_duration INTEGER DEFAULT 0,
    session_ended_at TIMESTAMP WITH TIME ZONE,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indizes für bessere Performance
CREATE INDEX IF NOT EXISTS idx_traffic_session_id ON public.traffic(session_id);
CREATE INDEX IF NOT EXISTS idx_traffic_timestamp ON public.traffic(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_traffic_page_url ON public.traffic(page_url);
CREATE INDEX IF NOT EXISTS idx_traffic_device_type ON public.traffic(device_type);
CREATE INDEX IF NOT EXISTS idx_traffic_referrer ON public.traffic(referrer);

-- Row Level Security (RLS) - Jeder kann lesen und schreiben
ALTER TABLE public.traffic ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert traffic data"
    ON public.traffic
    FOR INSERT
    TO public
    WITH CHECK (true);

CREATE POLICY "Anyone can read traffic data"
    ON public.traffic
    FOR SELECT
    TO public
    USING (true);

CREATE POLICY "Anyone can update their session"
    ON public.traffic
    FOR UPDATE
    TO public
    USING (true);

-- =====================================================
-- 2. EVENTS TABELLE (Benutzerdefinierte Events)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.events (
    id BIGSERIAL PRIMARY KEY,
    session_id TEXT NOT NULL,
    event_name TEXT NOT NULL,
    event_data JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indizes
CREATE INDEX IF NOT EXISTS idx_events_session_id ON public.events(session_id);
CREATE INDEX IF NOT EXISTS idx_events_event_name ON public.events(event_name);
CREATE INDEX IF NOT EXISTS idx_events_timestamp ON public.events(timestamp DESC);

-- Row Level Security
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert events"
    ON public.events
    FOR INSERT
    TO public
    WITH CHECK (true);

CREATE POLICY "Anyone can read events"
    ON public.events
    FOR SELECT
    TO public
    USING (true);

-- =====================================================
-- 3. HILFREICHE VIEWS FÜR ANALYTICS
-- =====================================================

-- Daily Traffic View
CREATE OR REPLACE VIEW public.daily_traffic AS
SELECT 
    DATE(timestamp) as date,
    COUNT(*) as total_views,
    COUNT(DISTINCT session_id) as unique_visitors,
    COUNT(DISTINCT CASE WHEN device_type = 'Mobile' THEN session_id END) as mobile_visitors,
    COUNT(DISTINCT CASE WHEN device_type = 'Desktop' THEN session_id END) as desktop_visitors,
    COUNT(DISTINCT CASE WHEN device_type = 'Tablet' THEN session_id END) as tablet_visitors
FROM public.traffic
GROUP BY DATE(timestamp)
ORDER BY DATE(timestamp) DESC;

-- Popular Pages View
CREATE OR REPLACE VIEW public.popular_pages AS
SELECT 
    page_url,
    COUNT(*) as view_count,
    COUNT(DISTINCT session_id) as unique_visitors,
    AVG(session_duration) as avg_duration_seconds
FROM public.traffic
WHERE timestamp >= NOW() - INTERVAL '30 days'
GROUP BY page_url
ORDER BY view_count DESC;

-- Traffic Sources View
CREATE OR REPLACE VIEW public.traffic_sources AS
SELECT 
    CASE 
        WHEN referrer = 'direct' THEN 'Direkt'
        WHEN referrer LIKE '%google%' THEN 'Google'
        WHEN referrer LIKE '%facebook%' THEN 'Facebook'
        WHEN referrer LIKE '%twitter%' THEN 'Twitter'
        WHEN referrer LIKE '%reddit%' THEN 'Reddit'
        ELSE referrer
    END as source,
    COUNT(*) as visits,
    COUNT(DISTINCT session_id) as unique_visitors
FROM public.traffic
WHERE timestamp >= NOW() - INTERVAL '30 days'
GROUP BY source
ORDER BY visits DESC;

-- =====================================================
-- 4. DATENBANK-FUNKTIONEN FÜR STATS
-- =====================================================

-- Funktion: Hole Traffic Stats der letzten N Tage
CREATE OR REPLACE FUNCTION get_traffic_stats(days INTEGER DEFAULT 30)
RETURNS TABLE (
    total_pageviews BIGINT,
    unique_sessions BIGINT,
    avg_session_duration NUMERIC,
    mobile_percentage NUMERIC,
    desktop_percentage NUMERIC,
    top_page TEXT,
    top_referrer TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH stats AS (
        SELECT 
            COUNT(*) as total_views,
            COUNT(DISTINCT session_id) as unique_sess,
            AVG(session_duration) as avg_duration,
            COUNT(CASE WHEN device_type = 'Mobile' THEN 1 END) * 100.0 / COUNT(*) as mobile_pct,
            COUNT(CASE WHEN device_type = 'Desktop' THEN 1 END) * 100.0 / COUNT(*) as desktop_pct
        FROM public.traffic
        WHERE timestamp >= NOW() - (days || ' days')::INTERVAL
    ),
    top_pg AS (
        SELECT page_url
        FROM public.traffic
        WHERE timestamp >= NOW() - (days || ' days')::INTERVAL
        GROUP BY page_url
        ORDER BY COUNT(*) DESC
        LIMIT 1
    ),
    top_ref AS (
        SELECT referrer
        FROM public.traffic
        WHERE timestamp >= NOW() - (days || ' days')::INTERVAL
        GROUP BY referrer
        ORDER BY COUNT(*) DESC
        LIMIT 1
    )
    SELECT 
        s.total_views::BIGINT,
        s.unique_sess::BIGINT,
        ROUND(s.avg_duration::NUMERIC, 2),
        ROUND(s.mobile_pct::NUMERIC, 2),
        ROUND(s.desktop_pct::NUMERIC, 2),
        p.page_url,
        r.referrer
    FROM stats s, top_pg p, top_ref r;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. AUTOMATISCHE DATENBEREINIGUNG (Optional)
-- =====================================================
-- Lösche Traffic-Daten älter als 1 Jahr (optional)
-- Auskommentieren wenn gewünscht:

/*
CREATE OR REPLACE FUNCTION cleanup_old_traffic()
RETURNS void AS $$
BEGIN
    DELETE FROM public.traffic
    WHERE timestamp < NOW() - INTERVAL '1 year';
    
    DELETE FROM public.events
    WHERE timestamp < NOW() - INTERVAL '1 year';
END;
$$ LANGUAGE plpgsql;

-- Erstelle einen Cron Job (Supabase Edge Function oder pg_cron)
-- Zum manuellen Ausführen: SELECT cleanup_old_traffic();
*/

-- =====================================================
-- FERTIG! 🎉
-- =====================================================
-- Jetzt kannst du Traffic tracken!
-- 
-- Test ob es funktioniert:
-- SELECT * FROM public.traffic ORDER BY timestamp DESC LIMIT 10;
-- 
-- Statistiken abrufen:
-- SELECT * FROM get_traffic_stats(30);
-- =====================================================


