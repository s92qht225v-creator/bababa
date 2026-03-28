-- Allow admins to read all messages for moderation
CREATE POLICY "messages_admin_select" ON messages
  FOR SELECT USING (is_admin());
