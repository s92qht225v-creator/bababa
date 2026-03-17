-- Work experience history
ALTER TABLE worker_profiles ADD COLUMN experience_history jsonb DEFAULT '[]';

-- Translation status on worker bio
ALTER TABLE worker_profiles ADD COLUMN bio_translation_status text DEFAULT 'complete'
  CHECK (bio_translation_status IN ('complete', 'failed', 'pending'));
