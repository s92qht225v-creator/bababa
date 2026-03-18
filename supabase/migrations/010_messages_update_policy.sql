-- Add UPDATE policy for messages so receivers can mark messages as read
CREATE POLICY "messages_update_receiver" ON messages
  FOR UPDATE USING (auth.uid() = receiver_id)
  WITH CHECK (auth.uid() = receiver_id);
