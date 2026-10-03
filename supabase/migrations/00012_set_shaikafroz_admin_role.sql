-- Update shaikafroz5502@gmail.com to admin role immediately
UPDATE public.profiles
SET role = 'admin',
    permissions = ARRAY['source_code.download', 'admin.all'],
    updated_at = NOW()
WHERE email = 'shaikafroz5502@gmail.com';

-- Update handle_new_user trigger function to ensure shaikafroz5502@gmail.com always gets admin
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
  
  IF NEW.email IN ('admin@miaoda.com', 'shaikafroz5502@gmail.com') 
     OR v_username = 'admin' 
     OR NEW.email LIKE 'admin%' THEN
    v_role := 'admin';
    v_perms := ARRAY['source_code.download', 'admin.all'];
  END IF;

  INSERT INTO public.profiles (id, username, email, role, permissions, created_at, updated_at)
  VALUES (NEW.id, v_username, NEW.email, v_role, v_perms, NOW(), NOW())
  ON CONFLICT (id) DO UPDATE
  SET username = EXCLUDED.username,
      email = EXCLUDED.email,
      role = CASE 
        WHEN EXCLUDED.email IN ('admin@miaoda.com', 'shaikafroz5502@gmail.com') 
             OR EXCLUDED.username = 'admin' 
             OR EXCLUDED.email LIKE 'admin%' THEN 'admin' 
        ELSE public.profiles.role 
      END,
      permissions = CASE 
        WHEN EXCLUDED.email IN ('admin@miaoda.com', 'shaikafroz5502@gmail.com') 
             OR EXCLUDED.username = 'admin' 
             OR EXCLUDED.email LIKE 'admin%' THEN ARRAY['source_code.download', 'admin.all'] 
        ELSE public.profiles.permissions 
      END;
      
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;