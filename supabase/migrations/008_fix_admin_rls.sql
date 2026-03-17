-- Fix infinite recursion in admin profiles policy.
-- Create a SECURITY DEFINER function that bypasses RLS to check admin role.

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Drop the recursive policy
DROP POLICY IF EXISTS "Admin full access profiles" ON profiles;

-- Recreate admin policies on profiles using the function
CREATE POLICY "Admin update any profile"
  ON profiles FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admin delete any profile"
  ON profiles FOR DELETE
  USING (is_admin());

-- Also update other admin policies to use the function (avoids potential issues)
DROP POLICY IF EXISTS "Admin full access companies" ON companies;
CREATE POLICY "Admin full access companies"
  ON companies FOR ALL
  USING (is_admin());

DROP POLICY IF EXISTS "Admin full access worker_profiles" ON worker_profiles;
CREATE POLICY "Admin full access worker_profiles"
  ON worker_profiles FOR ALL
  USING (is_admin());

DROP POLICY IF EXISTS "Admin full access jobs" ON jobs;
CREATE POLICY "Admin full access jobs"
  ON jobs FOR ALL
  USING (is_admin());

DROP POLICY IF EXISTS "Admin full access translation_overrides" ON translation_overrides;
CREATE POLICY "Admin full access translation_overrides"
  ON translation_overrides FOR ALL
  USING (is_admin());

DROP POLICY IF EXISTS "Admins can manage reports" ON message_reports;
CREATE POLICY "Admins can manage reports"
  ON message_reports FOR ALL
  USING (is_admin());
