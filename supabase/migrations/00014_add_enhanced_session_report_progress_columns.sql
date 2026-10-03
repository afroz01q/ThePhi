-- Add session format & location details
ALTER TABLE public.sessions
ADD COLUMN IF NOT EXISTS location_name TEXT,
ADD COLUMN IF NOT EXISTS location_address TEXT,
ADD COLUMN IF NOT EXISTS virtual_platform TEXT DEFAULT 'Jitsi Meet',
ADD COLUMN IF NOT EXISTS safety_notes TEXT,
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 60;

-- Add target_type and target_id to reports for reporting inappropriate messages, posts, or comments
ALTER TABLE public.reports
ADD COLUMN IF NOT EXISTS target_type TEXT DEFAULT 'user',
ADD COLUMN IF NOT EXISTS target_id TEXT,
ADD COLUMN IF NOT EXISTS content_snippet TEXT;

-- Add hours_logged to learning_progress
ALTER TABLE public.learning_progress
ADD COLUMN IF NOT EXISTS hours_logged NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS session_logs JSONB DEFAULT '[]'::jsonb;
