-- Add telegram_id to profiles for Telegram OAuth login
ALTER TABLE profiles ADD COLUMN telegram_id text UNIQUE;
CREATE INDEX idx_profiles_telegram_id ON profiles(telegram_id);
