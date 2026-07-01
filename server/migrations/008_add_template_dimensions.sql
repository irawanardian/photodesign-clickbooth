ALTER TABLE photobooth_templates
  ADD COLUMN IF NOT EXISTS dimension_unit VARCHAR(20) NOT NULL DEFAULT 'pixels',
  ADD COLUMN IF NOT EXISTS paper_size VARCHAR(30) NOT NULL DEFAULT '4x6',
  ADD COLUMN IF NOT EXISTS resolution_dpi INTEGER NOT NULL DEFAULT 300,
  ADD COLUMN IF NOT EXISTS orientation VARCHAR(20) NOT NULL DEFAULT 'vertical',
  ADD COLUMN IF NOT EXISTS canvas_width INTEGER NOT NULL DEFAULT 1200,
  ADD COLUMN IF NOT EXISTS canvas_height INTEGER NOT NULL DEFAULT 1800;

UPDATE photobooth_templates
SET
  dimension_unit = COALESCE(NULLIF(dimension_unit, ''), 'pixels'),
  paper_size = COALESCE(NULLIF(paper_size, ''), '4x6'),
  resolution_dpi = COALESCE(resolution_dpi, 300),
  orientation = COALESCE(NULLIF(orientation, ''), 'vertical'),
  canvas_width = COALESCE(canvas_width, 1200),
  canvas_height = COALESCE(canvas_height, 1800);
