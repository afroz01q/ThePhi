-- Allow authenticated community members to register custom skills
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'skills' AND policyname = 'skills_authenticated_insert'
  ) THEN
    CREATE POLICY skills_authenticated_insert ON skills
      FOR INSERT
      TO authenticated
      WITH CHECK (true);
  END IF;
END $$;