-- ========================================
-- HeySalad Wallet Database Reset Script
-- ========================================
-- Run this in Supabase Dashboard > SQL Editor
-- WARNING: This will DELETE ALL DATA in these tables

-- 1. Drop all existing tables (if they exist)
-- ========================================
DROP TABLE IF EXISTS transactions CASCADE;
DROP TABLE IF EXISTS wallets CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- 2. Create Profiles Table
-- ========================================
CREATE TABLE profiles (
  -- Primary key references Supabase auth.users
  auth_user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Required fields
  username TEXT UNIQUE NOT NULL
    CHECK (length(username) >= 3 AND length(username) <= 30)
    CHECK (username ~ '^[a-zA-Z0-9_]+$'),
  name TEXT NOT NULL
    CHECK (length(name) >= 1 AND length(name) <= 100),

  -- Contact information (from auth)
  email TEXT,
  phone TEXT,

  -- Optional profile fields
  avatar_url TEXT,
  bio TEXT CHECK (length(bio) <= 500),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create Wallets Table (supports both TRON and Circle passkey wallets)
-- ========================================
CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES profiles(auth_user_id) ON DELETE CASCADE,

  -- Wallet details
  wallet_address TEXT UNIQUE NOT NULL,
  wallet_type TEXT NOT NULL CHECK (wallet_type IN ('tron_local', 'circle_passkey', 'ethereum', 'polygon', 'solana', 'bitcoin')),
  name TEXT,
  is_primary BOOLEAN NOT NULL DEFAULT false,

  -- TRON Local wallet (private key stored in device secure storage)
  encrypted_private_key TEXT,
  encryption_method TEXT,

  -- Circle Passkey wallet (credential stored for re-initialization)
  passkey_credential TEXT, -- JSON string of P256Credential (public metadata only)
  circle_wallet_id TEXT,   -- Circle smart account address

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  UNIQUE(profile_id, wallet_address),

  -- Ensure only one primary wallet per profile
  UNIQUE(profile_id, is_primary) WHERE is_primary = true
);

-- 4. Create Transactions Table (Optional - for transaction history)
-- ========================================
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,

  -- Transaction details
  tx_hash TEXT UNIQUE NOT NULL,
  from_address TEXT NOT NULL,
  to_address TEXT NOT NULL,
  amount DECIMAL(36, 18) NOT NULL,
  token_symbol TEXT NOT NULL,
  token_address TEXT,

  -- Transaction metadata
  status TEXT NOT NULL CHECK (status IN ('pending', 'confirmed', 'failed')),
  block_number BIGINT,
  gas_used DECIMAL(36, 18),
  gas_price DECIMAL(36, 18),

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  confirmed_at TIMESTAMPTZ
);

-- 5. Create Indexes for Performance
-- ========================================

-- Profiles indexes
CREATE INDEX idx_profiles_username ON profiles(username);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_created_at ON profiles(created_at DESC);

-- Wallets indexes
CREATE INDEX idx_wallets_profile_id ON wallets(profile_id);
CREATE INDEX idx_wallets_wallet_address ON wallets(wallet_address);
CREATE INDEX idx_wallets_is_primary ON wallets(profile_id, is_primary) WHERE is_primary = true;

-- Transactions indexes
CREATE INDEX idx_transactions_wallet_id ON transactions(wallet_id);
CREATE INDEX idx_transactions_tx_hash ON transactions(tx_hash);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_created_at ON transactions(created_at DESC);

-- 6. Create Trigger for Auto-updating updated_at
-- ========================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to profiles table
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to wallets table
CREATE TRIGGER update_wallets_updated_at
  BEFORE UPDATE ON wallets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Apply trigger to transactions table
CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 7. Enable Row Level Security (RLS)
-- ========================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS Policies
-- ========================================

-- Profiles: Users can only read/update their own profile
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = auth_user_id);

-- Wallets: Users can only access their own wallets
CREATE POLICY "Users can view own wallets"
  ON wallets FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "Users can insert own wallets"
  ON wallets FOR INSERT
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can update own wallets"
  ON wallets FOR UPDATE
  USING (profile_id = auth.uid());

CREATE POLICY "Users can delete own wallets"
  ON wallets FOR DELETE
  USING (profile_id = auth.uid());

-- Transactions: Users can view transactions for their wallets
CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (
    wallet_id IN (
      SELECT id FROM wallets WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert transactions for own wallets"
  ON transactions FOR INSERT
  WITH CHECK (
    wallet_id IN (
      SELECT id FROM wallets WHERE profile_id = auth.uid()
    )
  );

-- 9. Grant Permissions
-- ========================================

-- Grant access to authenticated users
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON wallets TO authenticated;
GRANT ALL ON transactions TO authenticated;

-- Grant usage on sequences (if any auto-increment columns exist)
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ========================================
-- Database Reset Complete!
-- ========================================
--
-- Tables created:
-- ✓ profiles (core user data)
-- ✓ wallets (multi-wallet support)
-- ✓ transactions (transaction history)
--
-- Features enabled:
-- ✓ Automatic updated_at timestamps
-- ✓ Row Level Security (RLS)
-- ✓ Performance indexes
-- ✓ Data validation constraints
-- ✓ Foreign key relationships
--
-- Next steps:
-- 1. Reload your app to test authentication
-- 2. Create a new profile through onboarding
-- 3. Verify data appears in Supabase Table Editor
-- ========================================
