-- Supabase Setup for HeySalad Wallet
-- This SQL script creates/updates the profiles table and sets up Row Level Security policies
-- Run this in your Supabase SQL Editor: https://app.supabase.com/project/_/sql

-- =====================================================
-- DIAGNOSTIC: Check current table structure
-- =====================================================
-- Run this first to see your current table structure:
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns
-- WHERE table_schema = 'public' AND table_name = 'profiles'
-- ORDER BY ordinal_position;

-- =====================================================
-- 1. Create or update profiles table
-- =====================================================

-- First, create the table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT username_length CHECK (char_length(username) >= 3 AND char_length(username) <= 30),
  CONSTRAINT username_format CHECK (username ~ '^[a-zA-Z0-9_-]+$')
);

-- Handle existing tables with auth_user_id column instead of id
-- Check if auth_user_id exists and rename it to id
DO $$
BEGIN
  -- If table has auth_user_id but not id, we need to fix the schema
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'auth_user_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'id'
  ) THEN
    -- Rename auth_user_id to id
    ALTER TABLE public.profiles RENAME COLUMN auth_user_id TO id;
    RAISE NOTICE 'Renamed auth_user_id column to id';

    -- Make sure it's the primary key
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_pkey;
    ALTER TABLE public.profiles ADD PRIMARY KEY (id);

    -- Add foreign key constraint if it doesn't exist
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_id_fkey
      FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add phone column if it doesn't exist (for existing tables)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'phone'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN phone TEXT;
    RAISE NOTICE 'Added phone column to profiles table';
  END IF;
END $$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles(username);
CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles(email);

-- Only create phone index if column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'phone'
  ) THEN
    CREATE INDEX IF NOT EXISTS profiles_phone_idx ON public.profiles(phone);
  END IF;
END $$;

-- =====================================================
-- 2. Enable Row Level Security (RLS)
-- =====================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 3. Create RLS Policies
-- =====================================================

-- Policy: Users can read their own profile
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = auth_user_id);

-- Policy: Users can insert their own profile (for onboarding)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = auth_user_id);

-- Policy: Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = auth_user_id)
  WITH CHECK (auth.uid() = auth_user_id);

-- Policy: Public can read usernames (for checking username availability)
DROP POLICY IF EXISTS "Public can read usernames" ON public.profiles;
CREATE POLICY "Public can read usernames"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- =====================================================
-- 4. Create trigger for updated_at
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- 5. Create function to handle new user signup
-- =====================================================
-- This function automatically creates a profile when a new user signs up
-- Note: You may want to customize this or remove it if you handle profile creation in your app

-- CREATE OR REPLACE FUNCTION public.handle_new_user()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   INSERT INTO public.profiles (id, username, email, phone)
--   VALUES (
--     NEW.id,
--     COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substring(NEW.id::text from 1 for 8)),
--     NEW.email,
--     NEW.phone
--   );
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql SECURITY DEFINER;

-- DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW
--   EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- 6. Grant permissions
-- =====================================================
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.profiles TO authenticated;

-- =====================================================
-- NOTES
-- =====================================================
-- 1. This setup supports BOTH email and phone authentication
-- 2. The email and phone columns are optional (nullable) to support either auth method
-- 3. RLS policies ensure users can only read/write their own profiles
-- 4. The "Public can read usernames" policy allows checking username availability
-- 5. Usernames must be 3-30 characters and contain only alphanumeric, underscore, or hyphen
-- 6. The auto-creation trigger is commented out - you can enable it if needed

-- =====================================================
-- TESTING QUERIES (Run after setup)
-- =====================================================
-- Check if table exists and has correct structure:
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'profiles';

-- Check RLS policies:
-- SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- Test inserting a profile (replace UUID with your user ID):
-- INSERT INTO profiles (id, username, email)
-- VALUES ('your-user-id-here', 'testuser', 'test@example.com');
