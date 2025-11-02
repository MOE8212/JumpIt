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

-- Alternative: More performant version using GROUP BY
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
    WITH best_scores AS (
        SELECT 
            s.username,
            MAX(s.score) as max_score
        FROM public.scores s
        WHERE s.username IS NOT NULL 
          AND s.username != ''
          AND s.username != 'Unknown'
        GROUP BY s.username
    )
    SELECT 
        s.username,
        s.score as best_score,
        s.coins,
        s."time" as time_seconds,
        s.created_at
    FROM public.scores s
    INNER JOIN best_scores bs ON s.username = bs.username AND s.score = bs.max_score
    WHERE s.username IS NOT NULL 
      AND s.username != ''
      AND s.username != 'Unknown'
    ORDER BY s.score DESC, s.created_at ASC
    LIMIT score_limit;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to anon and authenticated roles
GRANT EXECUTE ON FUNCTION get_leaderboard(INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION get_leaderboard(INTEGER) TO authenticated;

-- Test the function
SELECT * FROM get_leaderboard(10);

