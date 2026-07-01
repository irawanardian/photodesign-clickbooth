ALTER TABLE photobooth_templates
ADD COLUMN IF NOT EXISTS overlay_image_url TEXT NULL,
ADD COLUMN IF NOT EXISTS overlay_file_name TEXT NULL,
ADD COLUMN IF NOT EXISTS overlay_file_path TEXT NULL;
