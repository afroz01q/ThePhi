CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_role TEXT := 'user';
  v_username TEXT;
  v_perms TEXT[] := '{}';
BEGIN
  v_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    split_part(NEW.email, '@', 1)
  );
  
  IF NEW.email = 'admin@miaoda.com' OR v_username = 'admin' OR NEW.email LIKE 'admin%' THEN
    v_role := 'admin';
    v_perms := ARRAY['source_code.download', 'admin.all'];
  END IF;

  INSERT INTO public.profiles (id, username, email, role, permissions, created_at, updated_at)
  VALUES (NEW.id, v_username, NEW.email, v_role, v_perms, NOW(), NOW())
  ON CONFLICT (id) DO UPDATE
  SET username = EXCLUDED.username,
      email = EXCLUDED.email,
      role = CASE WHEN EXCLUDED.email = 'admin@miaoda.com' OR EXCLUDED.username = 'admin' OR EXCLUDED.email LIKE 'admin%' THEN 'admin' ELSE public.profiles.role END,
      permissions = CASE WHEN EXCLUDED.email = 'admin@miaoda.com' OR EXCLUDED.username = 'admin' OR EXCLUDED.email LIKE 'admin%' THEN ARRAY['source_code.download', 'admin.all'] ELSE public.profiles.permissions END;
      
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
