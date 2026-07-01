ALTER TABLE photobooth_templates
  ADD COLUMN IF NOT EXISTS image_layers JSONB NOT NULL DEFAULT '[]'::jsonb;

UPDATE photobooth_templates
SET image_layers = '[]'::jsonb
WHERE image_layers IS NULL;
