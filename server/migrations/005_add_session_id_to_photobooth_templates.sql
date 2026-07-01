ALTER TABLE photobooth_templates
ADD COLUMN IF NOT EXISTS session_id INTEGER NULL REFERENCES photobooth_sessions(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_photobooth_templates_session_id
ON photobooth_templates(session_id);

CREATE INDEX IF NOT EXISTS idx_photobooth_templates_active_session
ON photobooth_templates(is_active, session_id);
