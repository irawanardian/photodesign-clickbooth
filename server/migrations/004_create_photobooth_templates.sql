CREATE TABLE IF NOT EXISTS photobooth_templates (
  id VARCHAR(80) PRIMARY KEY,
  template_name VARCHAR(150) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  title VARCHAR(150) NOT NULL DEFAULT 'PHOTOBOOTH',
  subtitle VARCHAR(150) NOT NULL DEFAULT 'Web Photo Session',
  background_color VARCHAR(20) NOT NULL DEFAULT '#ffffff',
  accent_color VARCHAR(20) NOT NULL DEFAULT '#ec4899',
  text_color VARCHAR(20) NOT NULL DEFAULT '#111827',
  muted_text_color VARCHAR(20) NOT NULL DEFAULT '#64748b',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_photobooth_templates_updated_at ON photobooth_templates;

CREATE TRIGGER trg_photobooth_templates_updated_at
BEFORE UPDATE ON photobooth_templates
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

INSERT INTO photobooth_templates (
  id,
  template_name,
  description,
  title,
  subtitle,
  background_color,
  accent_color,
  text_color,
  muted_text_color
)
VALUES
  (
    'pink-classic',
    'Pink Classic',
    'Template pink cerah untuk event fun.',
    'PHOTOBOOTH',
    'Web Photo Session',
    '#fff7fb',
    '#ec4899',
    '#111827',
    '#64748b'
  ),
  (
    'dark-elegant',
    'Dark Elegant',
    'Template gelap untuk acara formal.',
    'PHOTOBOOTH',
    'Premium Session',
    '#0f172a',
    '#f59e0b',
    '#ffffff',
    '#cbd5e1'
  ),
  (
    'clean-white',
    'Clean White',
    'Template putih minimalis dan bersih.',
    'PHOTOBOOTH',
    'Special Moment',
    '#ffffff',
    '#111827',
    '#111827',
    '#6b7280'
  )
ON CONFLICT (id) DO NOTHING;

DO $$
DECLARE
  constraint_record RECORD;
BEGIN
  FOR constraint_record IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'photobooth_sessions'::regclass
      AND contype = 'c'
      AND pg_get_constraintdef(oid) ILIKE '%frame_id%'
  LOOP
    EXECUTE format(
      'ALTER TABLE photobooth_sessions DROP CONSTRAINT IF EXISTS %I',
      constraint_record.conname
    );
  END LOOP;
END $$;
