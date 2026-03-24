-- Allow employers to read worker profiles of workers who applied to their jobs.
-- Without this, the applicants page crashes because the join returns null.
CREATE POLICY "worker_profiles_select_for_employers"
ON public.worker_profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM applications a
    JOIN jobs j ON j.id = a.job_id
    JOIN companies c ON c.id = j.company_id
    WHERE a.worker_id = worker_profiles.id
      AND c.user_id = auth.uid()
  )
);
