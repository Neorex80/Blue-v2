/*
  # Add description field to personas table

  1. Changes
    - Add description field to personas table
    - Make it required with a default value
*/

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'personas' AND column_name = 'description'
  ) THEN
    ALTER TABLE personas ADD COLUMN description text NOT NULL DEFAULT '';
  END IF;
END $$;