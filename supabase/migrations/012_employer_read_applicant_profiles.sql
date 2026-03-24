-- Allow employers to read worker profiles of workers who applied to their jobs.
-- Uses SECURITY DEFINER function to avoid infinite recursion in RLS evaluation.

CREATE OR REPLACE FUNCTION is_employer_of_applicant(wp_id uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM applications a
    JOIN jobs j ON j.id = a.job_id
    JOIN companies c ON c.id = j.company_id
    WHERE a.worker_id = wp_id
      AND c.user_id = auth.uid()
  );
$$;

CREATE POLICY "worker_profiles_select_for_employers"
ON public.worker_profiles
FOR SELECT
USING (is_employer_of_applicant(id));
