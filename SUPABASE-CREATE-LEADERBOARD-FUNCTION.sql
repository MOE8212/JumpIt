-- Create PostgreSQL function to get leaderboard efficiently
-- This function groups scores by username and returns the best score for each user

CREATE OR REPLACE FUNCTION get_leaderboard(score_limit INTEGER DEFAULT 10)
RETURNS TABLE (
    username TEXT,
    best_score INTEGER,
    coins INTEGER,
    time_seconds INTEGER,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT ON (s.username)
        s.username,
        s.score as best_score,
        s.coins,
        s."time" as time_seconds,
        s.created_at
    FROM public.scores s
    WHERE s.username IS NOT NULL 
      AND s.username != ''
      AND s.username != 'Unknown'
    ORDER BY s.username, s.score DESC, s.created_at DESC
    LIMIT (
        SELECT COUNT(DISTINCT username) 
        FROM public.scores 
        WHERE username IS NOT NULL 
          AND username != ''
          AND username != 'Unknown'
    );
END;
$$ LANGUAGE plpgsql;

-- Best version: Get one entry per user with their best score
CREATE OR REPLACE FUNCTION get_leaderboard(score_limit INTEGER DEFAULT 10)
RETURNS TABLE (
    username TEXT,
    best_score INTEGER,
    coins INTEGER,
    time_seconds INTEGER,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    WITH ranked_scores AS (
        SELECT 
            s.username,
            s.score,
            s.coins,
            s."time",
            s.created_at,
            ROW_NUMBER() OVER (PARTITION BY s.username ORDER BY s.score DESC, s.created_at ASC) as rn
        FROM public.scores s
        WHERE s.username IS NOT NULL 
          AND s.username != ''
          AND s.username != 'Unknown'
    )
    SELECT 
        username,
        score as best_score,
        coins,
        "time" as time_seconds,
        created_at
    FROM ranked_scores
    WHERE rn = 1
    ORDER BY best_score DESC, created_at ASC
    LIMIT score_limit;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to anon and authenticated roles
GRANT EXECUTE ON FUNCTION get_leaderboard(INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION get_leaderboard(INTEGER) TO authenticated;

-- Test the function
SELECT * FROM get_leaderboard(10);

