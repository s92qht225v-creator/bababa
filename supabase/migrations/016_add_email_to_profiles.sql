-- Add email column to profiles table
ALTER TABLE profiles ADD COLUMN email text;

-- Backfill email from auth.users
UPDATE profiles
SET email = au.email
FROM auth.users au
WHERE profiles.id = au.id;

-- Update trigger to sync email on new user creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, role, language_preference, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.raw_user_meta_data->>'phone',
    COALESCE(NEW.raw_user_meta_data->>'role', 'worker'),
    COALESCE(NEW.raw_user_meta_data->>'language_preference', 'uz'),
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
