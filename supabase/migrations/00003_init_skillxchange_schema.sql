-- Helper function to check if current user is admin without recursion
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND (role = 'admin' OR 'source_code.download' = ANY(permissions))
  );
$$;

-- Extend profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS location text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS languages text[] DEFAULT '{"English"}'::text[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS timezone text DEFAULT 'UTC';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS reputation_score integer DEFAULT 50;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS completed_exchanges integer DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS completed_sessions integer DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS average_rating numeric(3,2) DEFAULT 5.0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_reviews integer DEFAULT 0;

-- 1. Skill Categories
CREATE TABLE IF NOT EXISTS public.skill_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  description text,
  icon text DEFAULT 'BookOpen',
  display_order integer DEFAULT 0,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

-- 2. Skills
CREATE TABLE IF NOT EXISTS public.skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES public.skill_categories(id) ON DELETE CASCADE,
  name text UNIQUE NOT NULL,
  description text,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

-- 3. User Teaching Skills
CREATE TABLE IF NOT EXISTS public.user_teaching_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
  skill_id uuid REFERENCES public.skills(id) ON DELETE CASCADE NOT NULL,
  proficiency_level text NOT NULL DEFAULT 'Intermediate',
  experience_years numeric(3,1) DEFAULT 1.0,
  description text,
  format text DEFAULT 'Online',
  endorsements_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, skill_id)
);

-- 4. User Learning Skills
CREATE TABLE IF NOT EXISTS public.user_learning_skills (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
  skill_id uuid REFERENCES public.skills(id) ON DELETE CASCADE NOT NULL,
  current_level text DEFAULT 'Beginner',
  target_level text DEFAULT 'Advanced',
  priority text DEFAULT 'High',
  notes text,
  preferred_format text DEFAULT 'Online',
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, skill_id)
);

-- 5. User Availability
CREATE TABLE IF NOT EXISTS public.user_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
  day_of_week integer NOT NULL,
  start_time text NOT NULL DEFAULT '09:00',
  end_time text NOT NULL DEFAULT '12:00',
  is_online boolean DEFAULT true,
  is_in_person boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 6. Exchange Requests
CREATE TABLE IF NOT EXISTS public.exchange_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
  receiver_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  teach_skill_id uuid REFERENCES public.skills(id) ON DELETE SET NULL,
  learn_skill_id uuid REFERENCES public.skills(id) ON DELETE SET NULL,
  proposal_message text NOT NULL,
  preferred_format text DEFAULT 'Online',
  status text DEFAULT 'pending',
  response_note text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 7. Sessions
CREATE TABLE IF NOT EXISTS public.sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exchange_id uuid REFERENCES public.exchange_requests(id) ON DELETE CASCADE,
  teacher_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  learner_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  skill_id uuid REFERENCES public.skills(id) ON DELETE SET NULL,
  title text NOT NULL,
  session_date date NOT NULL DEFAULT current_date,
  start_time text NOT NULL DEFAULT '10:00',
  end_time text NOT NULL DEFAULT '11:00',
  meeting_link text,
  location_notes text,
  format text DEFAULT 'Online',
  status text DEFAULT 'scheduled',
  teacher_confirmed boolean DEFAULT false,
  learner_confirmed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 8. Conversations
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exchange_id uuid REFERENCES public.exchange_requests(id) ON DELETE CASCADE,
  participant_one uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  participant_two uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  last_message_text text,
  last_message_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- 9. Messages
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
  message_text text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 10. Learning Progress
CREATE TABLE IF NOT EXISTS public.learning_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exchange_id uuid REFERENCES public.exchange_requests(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
  goal_title text NOT NULL,
  starting_level text DEFAULT 'Beginner',
  current_level text DEFAULT 'Intermediate',
  target_level text DEFAULT 'Advanced',
  progress_percent integer DEFAULT 0,
  milestones jsonb DEFAULT '[]'::jsonb,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 11. Reviews
CREATE TABLE IF NOT EXISTS public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public.sessions(id) ON DELETE CASCADE,
  reviewer_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
  reviewee_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  skill_id uuid REFERENCES public.skills(id) ON DELETE SET NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  knowledge_rating integer DEFAULT 5,
  communication_rating integer DEFAULT 5,
  punctuality_rating integer DEFAULT 5,
  feedback text,
  created_at timestamptz DEFAULT now()
);

-- 12. Skill Endorsements
CREATE TABLE IF NOT EXISTS public.skill_endorsements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  endorser_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
  recipient_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  skill_id uuid REFERENCES public.skills(id) ON DELETE CASCADE NOT NULL,
  comment text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(endorser_id, recipient_id, skill_id)
);

-- 13. Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  type text NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  link text,
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 14. Community Posts
CREATE TABLE IF NOT EXISTS public.community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
  title text NOT NULL,
  content text NOT NULL,
  category text DEFAULT 'General',
  skill_id uuid REFERENCES public.skills(id) ON DELETE SET NULL,
  likes_count integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 15. Community Comments
CREATE TABLE IF NOT EXISTS public.community_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid REFERENCES public.community_posts(id) ON DELETE CASCADE NOT NULL,
  author_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
  content text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 16. Reports
CREATE TABLE IF NOT EXISTS public.reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
  reported_user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  reason text NOT NULL,
  description text NOT NULL,
  status text DEFAULT 'pending',
  admin_notes text,
  resolved_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- 17. User Blocks
CREATE TABLE IF NOT EXISTS public.user_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  blocker_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
  blocked_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(blocker_id, blocked_id)
);

-- 18. Admin Audit Logs
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL DEFAULT auth.uid(),
  action text NOT NULL,
  target_type text NOT NULL,
  target_id text,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- ENABLE RLS ON ALL TABLES
ALTER TABLE public.skill_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_teaching_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_learning_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.skill_endorsements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- POLICIES

-- skill_categories & skills: anyone can read, admin can mutate
CREATE POLICY "skill_categories_read" ON public.skill_categories FOR SELECT USING (true);
CREATE POLICY "skill_categories_admin_all" ON public.skill_categories FOR ALL USING (public.is_admin());

CREATE POLICY "skills_read" ON public.skills FOR SELECT USING (true);
CREATE POLICY "skills_admin_all" ON public.skills FOR ALL USING (public.is_admin());

-- user_teaching_skills
CREATE POLICY "user_teaching_skills_select" ON public.user_teaching_skills FOR SELECT USING (true);
CREATE POLICY "user_teaching_skills_insert" ON public.user_teaching_skills FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_teaching_skills_update" ON public.user_teaching_skills FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "user_teaching_skills_delete" ON public.user_teaching_skills FOR DELETE USING (auth.uid() = user_id OR public.is_admin());

-- user_learning_skills
CREATE POLICY "user_learning_skills_select" ON public.user_learning_skills FOR SELECT USING (true);
CREATE POLICY "user_learning_skills_insert" ON public.user_learning_skills FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_learning_skills_update" ON public.user_learning_skills FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "user_learning_skills_delete" ON public.user_learning_skills FOR DELETE USING (auth.uid() = user_id OR public.is_admin());

-- user_availability
CREATE POLICY "user_availability_select" ON public.user_availability FOR SELECT USING (true);
CREATE POLICY "user_availability_insert" ON public.user_availability FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "user_availability_update" ON public.user_availability FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "user_availability_delete" ON public.user_availability FOR DELETE USING (auth.uid() = user_id OR public.is_admin());

-- exchange_requests
CREATE POLICY "exchange_requests_select" ON public.exchange_requests FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id OR public.is_admin());
CREATE POLICY "exchange_requests_insert" ON public.exchange_requests FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "exchange_requests_update" ON public.exchange_requests FOR UPDATE USING (auth.uid() = sender_id OR auth.uid() = receiver_id OR public.is_admin());
CREATE POLICY "exchange_requests_delete" ON public.exchange_requests FOR DELETE USING (auth.uid() = sender_id OR public.is_admin());

-- sessions
CREATE POLICY "sessions_select" ON public.sessions FOR SELECT USING (auth.uid() = teacher_id OR auth.uid() = learner_id OR public.is_admin());
CREATE POLICY "sessions_insert" ON public.sessions FOR INSERT WITH CHECK (auth.uid() = teacher_id OR auth.uid() = learner_id);
CREATE POLICY "sessions_update" ON public.sessions FOR UPDATE USING (auth.uid() = teacher_id OR auth.uid() = learner_id OR public.is_admin());
CREATE POLICY "sessions_delete" ON public.sessions FOR DELETE USING (auth.uid() = teacher_id OR auth.uid() = learner_id OR public.is_admin());

-- conversations
CREATE POLICY "conversations_select" ON public.conversations FOR SELECT USING (auth.uid() = participant_one OR auth.uid() = participant_two OR public.is_admin());
CREATE POLICY "conversations_insert" ON public.conversations FOR INSERT WITH CHECK (auth.uid() = participant_one OR auth.uid() = participant_two);
CREATE POLICY "conversations_update" ON public.conversations FOR UPDATE USING (auth.uid() = participant_one OR auth.uid() = participant_two OR public.is_admin());

-- messages
CREATE POLICY "messages_select" ON public.messages FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id AND (c.participant_one = auth.uid() OR c.participant_two = auth.uid())
  ) OR public.is_admin()
);
CREATE POLICY "messages_insert" ON public.messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "messages_update" ON public.messages FOR UPDATE USING (auth.uid() = sender_id OR public.is_admin());

-- learning_progress
CREATE POLICY "learning_progress_select" ON public.learning_progress FOR SELECT USING (true);
CREATE POLICY "learning_progress_insert" ON public.learning_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "learning_progress_update" ON public.learning_progress FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "learning_progress_delete" ON public.learning_progress FOR DELETE USING (auth.uid() = user_id OR public.is_admin());

-- reviews
CREATE POLICY "reviews_select" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "reviews_insert" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);
CREATE POLICY "reviews_update" ON public.reviews FOR UPDATE USING (auth.uid() = reviewer_id OR public.is_admin());
CREATE POLICY "reviews_delete" ON public.reviews FOR DELETE USING (public.is_admin());

-- skill_endorsements
CREATE POLICY "skill_endorsements_select" ON public.skill_endorsements FOR SELECT USING (true);
CREATE POLICY "skill_endorsements_insert" ON public.skill_endorsements FOR INSERT WITH CHECK (auth.uid() = endorser_id);
CREATE POLICY "skill_endorsements_delete" ON public.skill_endorsements FOR DELETE USING (auth.uid() = endorser_id OR public.is_admin());

-- notifications
CREATE POLICY "notifications_select" ON public.notifications FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "notifications_insert" ON public.notifications FOR INSERT WITH CHECK (true);
CREATE POLICY "notifications_update" ON public.notifications FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "notifications_delete" ON public.notifications FOR DELETE USING (auth.uid() = user_id OR public.is_admin());

-- community_posts
CREATE POLICY "community_posts_select" ON public.community_posts FOR SELECT USING (true);
CREATE POLICY "community_posts_insert" ON public.community_posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "community_posts_update" ON public.community_posts FOR UPDATE USING (auth.uid() = author_id OR public.is_admin());
CREATE POLICY "community_posts_delete" ON public.community_posts FOR DELETE USING (auth.uid() = author_id OR public.is_admin());

-- community_comments
CREATE POLICY "community_comments_select" ON public.community_comments FOR SELECT USING (true);
CREATE POLICY "community_comments_insert" ON public.community_comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "community_comments_update" ON public.community_comments FOR UPDATE USING (auth.uid() = author_id OR public.is_admin());
CREATE POLICY "community_comments_delete" ON public.community_comments FOR DELETE USING (auth.uid() = author_id OR public.is_admin());

-- reports
CREATE POLICY "reports_select" ON public.reports FOR SELECT USING (auth.uid() = reporter_id OR public.is_admin());
CREATE POLICY "reports_insert" ON public.reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);
CREATE POLICY "reports_update" ON public.reports FOR UPDATE USING (public.is_admin());

-- user_blocks
CREATE POLICY "user_blocks_select" ON public.user_blocks FOR SELECT USING (auth.uid() = blocker_id OR public.is_admin());
CREATE POLICY "user_blocks_insert" ON public.user_blocks FOR INSERT WITH CHECK (auth.uid() = blocker_id);
CREATE POLICY "user_blocks_delete" ON public.user_blocks FOR DELETE USING (auth.uid() = blocker_id OR public.is_admin());

-- admin_audit_logs
CREATE POLICY "admin_audit_logs_all" ON public.admin_audit_logs FOR ALL USING (public.is_admin());