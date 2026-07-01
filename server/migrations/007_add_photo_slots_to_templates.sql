ALTER TABLE photobooth_templates
ADD COLUMN IF NOT EXISTS photo_slots JSONB NOT NULL DEFAULT '[]'::jsonb;
