-- Add discovery and location matching preference columns to profiles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS discovery_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS location_matching_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS state_region TEXT;

-- Table for saving match bookmarks
CREATE TABLE IF NOT EXISTS user_saved_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  matched_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, matched_user_id)
);

-- Table for dismissed matches
CREATE TABLE IF NOT EXISTS user_dismissed_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  matched_user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, matched_user_id)
);

-- Enable RLS
ALTER TABLE user_saved_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_dismissed_matches ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can manage own saved matches" ON user_saved_matches;
CREATE POLICY "Users can manage own saved matches"
ON user_saved_matches FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own dismissed matches" ON user_dismissed_matches;
CREATE POLICY "Users can manage own dismissed matches"
ON user_dismissed_matches FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
