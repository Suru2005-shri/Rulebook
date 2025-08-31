-- Remove the old user table that has RLS but no policies
-- We're using the profiles table instead for user data
DROP TABLE IF EXISTS public.user;