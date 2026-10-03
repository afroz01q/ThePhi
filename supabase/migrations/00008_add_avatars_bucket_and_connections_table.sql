-- 1. Storage bucket for profile pictures (avatars)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 1048576, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'])
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 1048576;

-- Storage policies for avatars
DROP POLICY IF EXISTS "Public avatars read" ON storage.objects;
CREATE POLICY "Public avatars read" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Authenticated users upload avatars" ON storage.objects;
CREATE POLICY "Authenticated users upload avatars" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users update own avatars" ON storage.objects;
CREATE POLICY "Users update own avatars" ON storage.objects
FOR UPDATE TO authenticated USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users delete own avatars" ON storage.objects;
CREATE POLICY "Users delete own avatars" ON storage.objects
FOR DELETE TO authenticated USING (bucket_id = 'avatars');

-- 2. Peer Connections table
CREATE TABLE IF NOT EXISTS public.connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'connected', 'declined')),
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_connection_pair UNIQUE(requester_id, recipient_id),
  CONSTRAINT no_self_connect CHECK (requester_id <> recipient_id)
);

ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "connections_select_all" ON public.connections;
CREATE POLICY "connections_select_all" ON public.connections
FOR SELECT TO public
USING (true);

DROP POLICY IF EXISTS "connections_insert" ON public.connections;
CREATE POLICY "connections_insert" ON public.connections
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = requester_id);

DROP POLICY IF EXISTS "connections_update" ON public.connections;
CREATE POLICY "connections_update" ON public.connections
FOR UPDATE TO authenticated
USING (auth.uid() = requester_id OR auth.uid() = recipient_id OR is_admin());

DROP POLICY IF EXISTS "connections_delete" ON public.connections;
CREATE POLICY "connections_delete" ON public.connections
FOR DELETE TO authenticated
USING (auth.uid() = requester_id OR auth.uid() = recipient_id OR is_admin());
