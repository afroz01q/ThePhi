DO $$
BEGIN
  -- Enable RLS on profiles
  ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

  -- Add public read policy if not existing
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'profiles_read_all') THEN
    CREATE POLICY "profiles_read_all" ON public.profiles FOR SELECT USING (true);
  END IF;

  -- Add self update policy
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'profiles_update_self') THEN
    CREATE POLICY "profiles_update_self" ON public.profiles FOR UPDATE USING (auth.uid() = id OR public.is_admin());
  END IF;

  -- Add insert policy for signup
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'profiles_insert_self') THEN
    CREATE POLICY "profiles_insert_self" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id OR public.is_admin());
  END IF;
END $$;