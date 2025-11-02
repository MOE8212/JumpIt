-- Fix username column in scores table
-- This script properly updates usernames based on user_id

-- Step 1: Check current state
DO $$
DECLARE
    total_scores INTEGER;
    scores_with_user_id INTEGER;
    scores_without_user_id INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_scores FROM public.scores;
    SELECT COUNT(*) INTO scores_with_user_id FROM public.scores WHERE user_id IS NOT NULL;
    SELECT COUNT(*) INTO scores_without_user_id FROM public.scores WHERE user_id IS NULL;
    
    RAISE NOTICE '=== CURRENT STATE ===';
    RAISE NOTICE 'Total scores: %', total_scores;
    RAISE NOTICE 'Scores with user_id: %', scores_with_user_id;
    RAISE NOTICE 'Scores without user_id: %', scores_without_user_id;
    RAISE NOTICE '';
END $$;

-- Step 2: Update username column for scores that have a valid user_id
-- This will set username from the users table
UPDATE public.scores s
SET username = u.username
FROM public.users u
WHERE s.user_id = u.id
AND s.user_id IS NOT NULL;

-- Step 3: Delete scores that don't have a valid user_id
-- These are orphaned scores that can't be linked to any user
DELETE FROM public.scores
WHERE user_id IS NULL;

-- Step 4: Verify the fix
DO $$
DECLARE
    total_scores INTEGER;
    unique_usernames INTEGER;
    scores_without_username INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_scores FROM public.scores;
    SELECT COUNT(DISTINCT username) INTO unique_usernames FROM public.scores WHERE username IS NOT NULL;
    SELECT COUNT(*) INTO scores_without_username FROM public.scores WHERE username IS NULL;
    
    RAISE NOTICE '=== AFTER FIX ===';
    RAISE NOTICE 'Total scores: %', total_scores;
    RAISE NOTICE 'Unique usernames: %', unique_usernames;
    RAISE NOTICE 'Scores without username: %', scores_without_username;
    RAISE NOTICE '';
    
    IF scores_without_username > 0 THEN
        RAISE WARNING 'There are still % scores without username!', scores_without_username;
    ELSE
        RAISE NOTICE '✅ All scores have valid usernames!';
    END IF;
END $$;

-- Step 5: Show top 10 scores
SELECT 
    s.username,
    s.score,
    s.coins,
    s.time,
    s.created_at,
    u.email
FROM public.scores s
LEFT JOIN public.users u ON s.user_id = u.id
ORDER BY s.score DESC
LIMIT 10;

