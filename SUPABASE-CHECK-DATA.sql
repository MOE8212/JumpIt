-- Check current state of scores and users data
-- Run this to see what data we have

-- 1. How many scores exist?
SELECT 
    COUNT(*) as total_scores,
    COUNT(DISTINCT user_id) as unique_user_ids,
    COUNT(CASE WHEN user_id IS NULL THEN 1 END) as scores_without_user_id,
    COUNT(CASE WHEN username IS NULL THEN 1 END) as scores_without_username
FROM public.scores;

-- 2. Top 20 scores with user info
SELECT 
    s.id,
    s.user_id,
    s.username,
    s.score,
    s.coins,
    s.time,
    s.created_at,
    u.username as user_table_username,
    u.email as user_email
FROM public.scores s
LEFT JOIN public.users u ON s.user_id = u.id
ORDER BY s.score DESC
LIMIT 20;

-- 3. How many users exist?
SELECT 
    COUNT(*) as total_users,
    array_agg(username ORDER BY username) as all_usernames
FROM public.users;

-- 4. Scores grouped by username
SELECT 
    username,
    COUNT(*) as score_count,
    MAX(score) as best_score,
    MIN(created_at) as first_score_date,
    MAX(created_at) as last_score_date
FROM public.scores
GROUP BY username
ORDER BY best_score DESC;

-- 5. Find scores where username doesn't match user_id
SELECT 
    s.id,
    s.user_id,
    s.username as score_username,
    u.username as user_username,
    s.score,
    CASE 
        WHEN s.username != u.username THEN 'MISMATCH'
        WHEN s.user_id IS NULL THEN 'NO USER_ID'
        WHEN u.id IS NULL THEN 'USER NOT FOUND'
        ELSE 'OK'
    END as status
FROM public.scores s
LEFT JOIN public.users u ON s.user_id = u.id
WHERE s.username != u.username OR s.user_id IS NULL OR u.id IS NULL
ORDER BY s.created_at DESC
LIMIT 20;

