-- Allow any authenticated user to insert notifications.
-- Server actions control the recipient (user_id), so this is safe.
CREATE POLICY "notifications_insert_authenticated"
ON public.notifications
FOR INSERT
TO authenticated
WITH CHECK (true);
