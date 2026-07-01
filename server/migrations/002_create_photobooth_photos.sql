CREATE TABLE IF NOT EXISTS photobooth_photos (
  id BIGSERIAL PRIMARY KEY,
  session_id BIGINT NOT NULL REFERENCES photobooth_sessions(id),
  file_name VARCHAR(255) NOT NULL,
  file_path TEXT NOT NULL,
  image_url TEXT NOT NULL,
  frame_id VARCHAR(50) NOT NULL,
  layout_id VARCHAR(50) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_photobooth_photos_session_id
ON photobooth_photos(session_id);

CREATE INDEX IF NOT EXISTS idx_photobooth_photos_created_at
ON photobooth_photos(created_at);
