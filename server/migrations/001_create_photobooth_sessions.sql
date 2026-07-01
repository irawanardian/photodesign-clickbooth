CREATE TABLE IF NOT EXISTS photobooth_sessions (
  id BIGSERIAL PRIMARY KEY,

  session_name VARCHAR(150) NOT NULL,
  event_title VARCHAR(150) NOT NULL DEFAULT 'PHOTOBOOTH',
  event_subtitle VARCHAR(150) NOT NULL DEFAULT 'Web Photo Session',

  frame_id VARCHAR(50) NOT NULL DEFAULT 'pink-classic',
  layout_id VARCHAR(50) NOT NULL DEFAULT 'vertical-strip',

  total_photos SMALLINT NOT NULL DEFAULT 4,
  countdown_seconds SMALLINT NOT NULL DEFAULT 3,

  is_active BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT photobooth_sessions_total_photos_check
    CHECK (total_photos IN (3, 4)),

  CONSTRAINT photobooth_sessions_countdown_seconds_check
    CHECK (countdown_seconds IN (3, 5, 10)),

  CONSTRAINT photobooth_sessions_frame_id_check
    CHECK (frame_id IN ('pink-classic', 'dark-elegant', 'clean-white')),

  CONSTRAINT photobooth_sessions_layout_id_check
    CHECK (layout_id IN ('vertical-strip', 'grid-2x2'))
);

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_photobooth_sessions_updated_at
ON photobooth_sessions;

CREATE TRIGGER trg_photobooth_sessions_updated_at
BEFORE UPDATE ON photobooth_sessions
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

INSERT INTO photobooth_sessions (
  session_name,
  event_title,
  event_subtitle,
  frame_id,
  layout_id,
  total_photos,
  countdown_seconds
)
SELECT
  'Default Session',
  'PHOTOBOOTH',
  'Web Photo Session',
  'pink-classic',
  'vertical-strip',
  4,
  3
WHERE NOT EXISTS (
  SELECT 1 FROM photobooth_sessions
);
