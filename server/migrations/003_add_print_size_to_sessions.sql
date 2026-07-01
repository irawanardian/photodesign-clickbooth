ALTER TABLE photobooth_sessions
ADD COLUMN IF NOT EXISTS print_size VARCHAR(10) NOT NULL DEFAULT '4r';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'photobooth_sessions_print_size_chk'
  ) THEN
    ALTER TABLE photobooth_sessions
    ADD CONSTRAINT photobooth_sessions_print_size_chk
    CHECK (print_size IN ('2r', '4r'));
  END IF;
END $$;
