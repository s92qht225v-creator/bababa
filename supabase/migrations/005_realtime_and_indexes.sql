-- Enable Supabase Realtime on messaging and notification tables
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE applications;

-- Composite index for conversation queries (find messages between two users for a job)
CREATE INDEX IF NOT EXISTS idx_messages_conversation
  ON messages(sender_id, receiver_id, job_id, created_at DESC);

-- Index for unread message queries
CREATE INDEX IF NOT EXISTS idx_messages_unread
  ON messages(receiver_id, is_read);

-- Index for notification queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread
  ON notifications(user_id, is_read, created_at DESC);
