-- Create kwai_tokens table
CREATE TABLE IF NOT EXISTS kwai_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_kwai_tokens_user_id ON kwai_tokens(user_id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_kwai_tokens_updated_at
  BEFORE UPDATE ON kwai_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security
ALTER TABLE kwai_tokens ENABLE ROW LEVEL SECURITY;

-- Create policy: Users can only see their own tokens
CREATE POLICY "Users can view own tokens"
  ON kwai_tokens FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy: Users can insert their own tokens
CREATE POLICY "Users can insert own tokens"
  ON kwai_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy: Users can update their own tokens
CREATE POLICY "Users can update own tokens"
  ON kwai_tokens FOR UPDATE
  USING (auth.uid() = user_id);

