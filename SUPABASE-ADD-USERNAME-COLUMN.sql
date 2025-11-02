-- Fix: Add missing username column to scores table
-- Run this in Supabase SQL Editor

-- 1. Add username column to scores table
ALTER TABLE public.scores 
ADD COLUMN IF NOT EXISTS username TEXT;

-- 2. Populate username from users table for existing scores
UPDATE public.scores 
SET username = users.username
FROM public.users
WHERE scores.user_id = users.id 
AND scores.username IS NULL;

-- 3. Make username NOT NULL (after populating)
-- ALTER TABLE public.scores 
-- ALTER COLUMN username SET NOT NULL;

-- 4. Create index for performance
CREATE INDEX IF NOT EXISTS idx_scores_username ON public.scores(username);

-- Verification query
SELECT 
    COUNT(*) as total_scores,
    COUNT(username) as scores_with_username,
    COUNT(*) - COUNT(username) as scores_without_username
FROM public.scores;

-- Show sample data
SELECT id, user_id, username, score, coins, time, created_at
FROM public.scores
ORDER BY created_at DESC
LIMIT 10;

