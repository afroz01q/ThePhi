DO $$
DECLARE
  u1 uuid := '11111111-1111-4111-8111-111111111111'::uuid;
  u2 uuid := '22222222-2222-4222-8222-222222222222'::uuid;
  u3 uuid := '33333333-3333-4333-8333-333333333333'::uuid;
  u4 uuid := '44444444-4444-4444-8444-444444444444'::uuid;

  s_py uuid;
  s_react uuid;
  s_ts uuid;
  s_uiux uuid;
  s_figma uuid;
  s_spanish uuid;
  s_japanese uuid;
  s_seo uuid;
  s_guitar uuid;
  s_piano uuid;
  s_yoga uuid;
BEGIN
  -- Get skill IDs
  SELECT id INTO s_py FROM public.skills WHERE name = 'Python Programming';
  SELECT id INTO s_react FROM public.skills WHERE name = 'React & Frontend';
  SELECT id INTO s_ts FROM public.skills WHERE name = 'TypeScript';
  SELECT id INTO s_uiux FROM public.skills WHERE name = 'UI/UX Design';
  SELECT id INTO s_figma FROM public.skills WHERE name = 'Figma Prototyping';
  SELECT id INTO s_spanish FROM public.skills WHERE name = 'Spanish Conversation';
  SELECT id INTO s_japanese FROM public.skills WHERE name = 'Japanese for Beginners';
  SELECT id INTO s_seo FROM public.skills WHERE name = 'SEO & Content Strategy';
  SELECT id INTO s_guitar FROM public.skills WHERE name = 'Acoustic Guitar';
  SELECT id INTO s_piano FROM public.skills WHERE name = 'Piano Fundamentals';
  SELECT id INTO s_yoga FROM public.skills WHERE name = 'Hatha Yoga & Breathwork';

  -- Insert Member 1: Marcus Vance
  INSERT INTO public.profiles (id, username, email, full_name, avatar_url, bio, location, languages, timezone, reputation_score, status, completed_exchanges, completed_sessions, average_rating, total_reviews)
  VALUES (u1, 'marcus_py', 'marcus@skillxchange.community', 'Marcus Vance', 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_f653f35f-f7f9-4d9e-bf1b-857c7aac8dae.jpg', 'Data scientist and senior Python developer passionate about backend systems, algorithms, and AI tooling.', 'Austin, USA', '{"English"}', 'America/Chicago', 94, 'active', 12, 19, 4.9, 15)
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

  -- Insert Member 2: Sophie Laurent
  INSERT INTO public.profiles (id, username, email, full_name, avatar_url, bio, location, languages, timezone, reputation_score, status, completed_exchanges, completed_sessions, average_rating, total_reviews)
  VALUES (u2, 'sophie_languages', 'sophie@skillxchange.community', 'Sophie Laurent', 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_b471b343-6d29-4e13-a5ae-c49ad257f326.jpg', 'Bilingual language instructor eager to exchange interactive Spanish & French conversation for modern React and guitar basics.', 'Montreal, Canada', '{"English", "Spanish", "French"}', 'America/Toronto', 91, 'active', 8, 14, 4.8, 11)
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

  -- Insert Member 3: David Chen
  INSERT INTO public.profiles (id, username, email, full_name, avatar_url, bio, location, languages, timezone, reputation_score, status, completed_exchanges, completed_sessions, average_rating, total_reviews)
  VALUES (u3, 'david_music', 'david@skillxchange.community', 'David Chen', 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_70b081a2-7544-424c-a20e-eab94c529970.jpg', 'Music teacher with 7+ years of fingerstyle guitar and piano coaching. Looking to learn Python automation and digital marketing.', 'London, UK', '{"English", "Mandarin"}', 'Europe/London', 87, 'active', 9, 16, 4.7, 10)
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

  -- Insert Member 4: Maya Patel
  INSERT INTO public.profiles (id, username, email, full_name, avatar_url, bio, location, languages, timezone, reputation_score, status, completed_exchanges, completed_sessions, average_rating, total_reviews)
  VALUES (u4, 'maya_growth', 'maya@skillxchange.community', 'Maya Patel', 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_6677df8b-999e-4d86-aff0-c0a98169a812.jpg', 'Growth marketer and SEO specialist. Teaching data-driven search marketing, excited to learn UI design & yoga mindfulness.', 'New York, USA', '{"English", "Hindi"}', 'America/New_York', 92, 'active', 11, 18, 4.9, 13)
  ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name;

  -- Insert Teaching Skills for Members
  INSERT INTO public.user_teaching_skills (user_id, skill_id, proficiency_level, experience_years, description, format, endorsements_count)
  VALUES
    (u1, s_py, 'Expert', 6.0, 'Python 3, async workflows, data processing, and FastAPI backends.', 'Online', 18),
    (u1, s_ts, 'Advanced', 3.5, 'TypeScript types, interfaces, and node backends.', 'Online', 8),
    (u2, s_spanish, 'Expert', 7.0, 'Conversational Spanish, pronunciation coaching, and immersion dialogues.', 'Online', 22),
    (u2, s_japanese, 'Intermediate', 2.0, 'Beginner Hiragana/Katakana and travel basics.', 'Online', 5),
    (u3, s_guitar, 'Expert', 8.0, 'Fingerstyle acoustic guitar, open tunings, chord progressions.', 'Both', 19),
    (u3, s_piano, 'Advanced', 5.0, 'Reading sheet music, major/minor scales, and ear training.', 'Online', 12),
    (u4, s_seo, 'Expert', 5.5, 'Technical SEO, content clustering, keyword intent, and Google analytics.', 'Online', 16)
  ON CONFLICT (user_id, skill_id) DO NOTHING;

  -- Insert Learning Skills for Members
  INSERT INTO public.user_learning_skills (user_id, skill_id, current_level, target_level, priority, preferred_format, notes)
  VALUES
    (u1, s_uiux, 'Beginner', 'Advanced', 'High', 'Online', 'Want to design modern clean SaaS dashboards without relying on templates.'),
    (u1, s_spanish, 'Beginner', 'Intermediate', 'Medium', 'Online', 'Planning to travel to South America next year.'),
    (u2, s_react, 'Beginner', 'Advanced', 'High', 'Online', 'Want to build my own language learning portfolio web app.'),
    (u2, s_guitar, 'Beginner', 'Intermediate', 'Medium', 'Online', 'Want to learn chords to sing along during community sessions.'),
    (u3, s_py, 'Beginner', 'Intermediate', 'High', 'Online', 'Want to write Python scripts for MIDI and audio automation.'),
    (u3, s_seo, 'Beginner', 'Advanced', 'Medium', 'Online', 'Want to optimize my studio website to reach more students.'),
    (u4, s_figma, 'Beginner', 'Advanced', 'High', 'Online', 'Want to create high-converting landing page mockups in Figma.'),
    (u4, s_yoga, 'Beginner', 'Intermediate', 'Medium', 'Online', 'Seeking breathwork and morning mobility routines.')
  ON CONFLICT (user_id, skill_id) DO NOTHING;

  -- Insert Member Availability
  INSERT INTO public.user_availability (user_id, day_of_week, start_time, end_time, is_online, is_in_person)
  VALUES
    (u1, 1, '18:00', '21:00', true, false),
    (u1, 3, '18:00', '21:00', true, false),
    (u1, 6, '10:00', '15:00', true, true),
    (u2, 2, '17:00', '20:00', true, false),
    (u2, 4, '17:00', '20:00', true, false),
    (u2, 0, '14:00', '18:00', true, false),
    (u3, 1, '15:00', '19:00', true, true),
    (u3, 5, '15:00', '19:00', true, true),
    (u4, 2, '18:00', '21:00', true, false),
    (u4, 6, '11:00', '16:00', true, false);

  -- Insert initial community posts
  INSERT INTO public.community_posts (author_id, title, content, category, likes_count, comments_count)
  VALUES
    (u1, 'Tips for structuring your first 45-minute Python peer session', 'When teaching Python to a design or marketing peer, start with interactive scripts and live terminal outputs rather than abstract theory. Here is a structure that worked for my 12 exchanges...', 'Learning Tips', 15, 3),
    (u2, 'Why exchange learning works 3x faster than solo apps', 'The accountability of a real human partner creates an emotional connection to the learning schedule. When you know someone is waiting to practice with you, you actually show up prepared!', 'Community Stories', 24, 7),
    (u4, 'How to combine SEO intent with clean UX design', 'Great article on bridging marketing metrics and user experience during peer exchanges. Shared resources and worksheet inside.', 'Resources', 9, 2);

END $$;