DO $$
DECLARE
  u_admin uuid := 'd1312f0b-5a7a-4ca3-9382-a941a6d7f0c5'::uuid;
  u_regular uuid := '9acdd54a-987c-4c39-a1fe-74ddb386465f'::uuid;
  u_marcus uuid := 'd3009db4-0555-452e-bdab-2be13d405755'::uuid;
  u_sophie uuid := '49847e9c-2089-49a2-82e9-408370ffffc1'::uuid;
  u_david uuid := 'a03788e3-52f1-48f7-924c-1ddcf1898000'::uuid;
  u_maya uuid := '04796fba-f255-4137-9b33-2544f47f148b'::uuid;

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

  exch_id uuid;
  sess_id uuid;
  conv_id uuid;
  post1_id uuid;
BEGIN
  -- Fetch skill IDs
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

  -- 1. Upsert Profiles
  INSERT INTO public.profiles (id, username, email, role, full_name, avatar_url, bio, location, languages, timezone, reputation_score, status, completed_exchanges, completed_sessions, average_rating, total_reviews)
  VALUES
    (u_admin, 'admin_alex', 'admin@miaoda.com', 'admin', 'Alex Rivera', 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_660e9ae4-2f78-4f2b-8de1-1547d1387ee9.jpg', 'SkillXChange platform coordinator and full-stack software engineer. Specializing in TypeScript, scalable systems, and open peer collaboration.', 'San Francisco, USA', '{"English", "Spanish"}', 'America/Los_Angeles', 98, 'active', 15, 24, 4.95, 20),
    (u_regular, 'elena_design', 'regular_user@miaoda.com', 'user', 'Elena Rostova', 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_2e9c2aa7-8bc8-4cbe-aa08-626c5833e161.jpg', 'Product designer creating design systems and accessible web interfaces. Looking to master Python automation and data visualization.', 'Berlin, Germany', '{"English", "German"}', 'Europe/Berlin', 89, 'active', 7, 12, 4.85, 9),
    (u_marcus, 'marcus_py', 'marcus@skillxchange.community', 'user', 'Marcus Vance', 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_f653f35f-f7f9-4d9e-bf1b-857c7aac8dae.jpg', 'Data scientist and senior Python developer passionate about backend systems, algorithms, and AI tooling.', 'Austin, USA', '{"English"}', 'America/Chicago', 94, 'active', 12, 19, 4.90, 15),
    (u_sophie, 'sophie_languages', 'sophie@skillxchange.community', 'user', 'Sophie Laurent', 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_b471b343-6d29-4e13-a5ae-c49ad257f326.jpg', 'Bilingual language instructor eager to exchange interactive Spanish & French conversation for modern React and guitar basics.', 'Montreal, Canada', '{"English", "Spanish", "French"}', 'America/Toronto', 91, 'active', 8, 14, 4.80, 11),
    (u_david, 'david_music', 'david@skillxchange.community', 'user', 'David Chen', 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_70b081a2-7544-424c-a20e-eab94c529970.jpg', 'Music teacher with 7+ years of fingerstyle guitar and piano coaching. Looking to learn Python automation and digital marketing.', 'London, UK', '{"English", "Mandarin"}', 'Europe/London', 87, 'active', 9, 16, 4.70, 10),
    (u_maya, 'maya_growth', 'maya@skillxchange.community', 'user', 'Maya Patel', 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_6677df8b-999e-4d86-aff0-c0a98169a812.jpg', 'Growth marketer and SEO specialist. Teaching data-driven search marketing, excited to learn UI design & yoga mindfulness.', 'New York, USA', '{"English", "Hindi"}', 'America/New_York', 92, 'active', 11, 18, 4.90, 13)
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    avatar_url = EXCLUDED.avatar_url,
    bio = EXCLUDED.bio,
    location = EXCLUDED.location,
    languages = EXCLUDED.languages,
    timezone = EXCLUDED.timezone,
    reputation_score = EXCLUDED.reputation_score,
    completed_exchanges = EXCLUDED.completed_exchanges,
    completed_sessions = EXCLUDED.completed_sessions,
    average_rating = EXCLUDED.average_rating,
    total_reviews = EXCLUDED.total_reviews;

  -- 2. User Teaching Skills
  INSERT INTO public.user_teaching_skills (user_id, skill_id, proficiency_level, experience_years, description, format, endorsements_count)
  VALUES
    (u_admin, s_ts, 'Expert', 5.0, 'Enterprise TypeScript, architecture, and testing.', 'Online', 24),
    (u_admin, s_react, 'Expert', 6.0, 'Modern component systems, state hooks, and performance.', 'Online', 30),
    (u_regular, s_uiux, 'Expert', 4.5, 'Design systems, accessibility WCAG, and user research.', 'Online', 19),
    (u_regular, s_figma, 'Expert', 5.0, 'Figma auto-layout, token management, and prototyping.', 'Online', 25),
    (u_marcus, s_py, 'Expert', 6.0, 'Python 3, async workflows, data processing, and FastAPI backends.', 'Online', 18),
    (u_marcus, s_ts, 'Advanced', 3.5, 'TypeScript types, interfaces, and node backends.', 'Online', 8),
    (u_sophie, s_spanish, 'Expert', 7.0, 'Conversational Spanish, pronunciation coaching, and immersion dialogues.', 'Online', 22),
    (u_sophie, s_japanese, 'Intermediate', 2.0, 'Beginner Hiragana/Katakana and travel basics.', 'Online', 5),
    (u_david, s_guitar, 'Expert', 8.0, 'Fingerstyle acoustic guitar, open tunings, chord progressions.', 'Both', 19),
    (u_david, s_piano, 'Advanced', 5.0, 'Reading sheet music, major/minor scales, and ear training.', 'Online', 12),
    (u_maya, s_seo, 'Expert', 5.5, 'Technical SEO, content clustering, keyword intent, and Google analytics.', 'Online', 16)
  ON CONFLICT (user_id, skill_id) DO NOTHING;

  -- 3. User Learning Skills
  INSERT INTO public.user_learning_skills (user_id, skill_id, current_level, target_level, priority, preferred_format, notes)
  VALUES
    (u_admin, s_guitar, 'Beginner', 'Intermediate', 'Medium', 'Online', 'Want to learn acoustic guitar chords for relaxation.'),
    (u_admin, s_spanish, 'Beginner', 'Advanced', 'High', 'Online', 'Want to achieve professional Spanish fluency.'),
    (u_regular, s_py, 'Beginner', 'Intermediate', 'High', 'Online', 'Want to script data visualization pipelines.'),
    (u_regular, s_react, 'Intermediate', 'Advanced', 'Medium', 'Online', 'Deepen component architecture knowledge.'),
    (u_marcus, s_uiux, 'Beginner', 'Advanced', 'High', 'Online', 'Want to design modern clean SaaS dashboards without relying on templates.'),
    (u_marcus, s_spanish, 'Beginner', 'Intermediate', 'Medium', 'Online', 'Planning to travel to South America next year.'),
    (u_sophie, s_react, 'Beginner', 'Advanced', 'High', 'Online', 'Want to build my own language learning portfolio web app.'),
    (u_sophie, s_guitar, 'Beginner', 'Intermediate', 'Medium', 'Online', 'Want to learn chords to sing along during community sessions.'),
    (u_david, s_py, 'Beginner', 'Intermediate', 'High', 'Online', 'Want to write Python scripts for MIDI and audio automation.'),
    (u_david, s_seo, 'Beginner', 'Advanced', 'Medium', 'Online', 'Want to optimize my studio website to reach more students.'),
    (u_maya, s_figma, 'Beginner', 'Advanced', 'High', 'Online', 'Want to create high-converting landing page mockups in Figma.'),
    (u_maya, s_yoga, 'Beginner', 'Intermediate', 'Medium', 'Online', 'Seeking breathwork and morning mobility routines.')
  ON CONFLICT (user_id, skill_id) DO NOTHING;

  -- 4. User Availability
  INSERT INTO public.user_availability (user_id, day_of_week, start_time, end_time, is_online, is_in_person)
  VALUES
    (u_admin, 1, '17:00', '20:00', true, false),
    (u_admin, 3, '17:00', '20:00', true, false),
    (u_regular, 2, '18:00', '21:00', true, false),
    (u_regular, 4, '18:00', '21:00', true, false),
    (u_marcus, 1, '18:00', '21:00', true, false),
    (u_marcus, 3, '18:00', '21:00', true, false),
    (u_sophie, 2, '17:00', '20:00', true, false),
    (u_sophie, 4, '17:00', '20:00', true, false),
    (u_david, 1, '15:00', '19:00', true, true),
    (u_maya, 2, '18:00', '21:00', true, false);

  -- 5. Active Exchange between Marcus and Elena
  INSERT INTO public.exchange_requests (sender_id, receiver_id, teach_skill_id, learn_skill_id, proposal_message, preferred_format, status)
  VALUES (u_marcus, u_regular, s_py, s_uiux, 'Hi Elena! I would love to trade Python backend and automation coaching in exchange for learning how you build systematic UI design systems and Figma components.', 'Online', 'accepted')
  RETURNING id INTO exch_id;

  -- 6. Scheduled Session for that exchange
  INSERT INTO public.sessions (exchange_id, teacher_id, learner_id, skill_id, title, session_date, start_time, end_time, meeting_link, status, format)
  VALUES (exch_id, u_marcus, u_regular, s_py, 'Python Basics & Virtual Environments for Designers', current_date + interval '2 days', '19:00', '20:00', 'https://meet.jit.si/skillxchange-session-py101', 'scheduled', 'Online')
  RETURNING id INTO sess_id;

  -- 7. Active Conversation & Messages
  INSERT INTO public.conversations (exchange_id, participant_one, participant_two, last_message_text, last_message_at)
  VALUES (exch_id, u_marcus, u_regular, 'Looking forward to our Thursday session! I prepared a starter GitHub notebook for you.', now())
  RETURNING id INTO conv_id;

  INSERT INTO public.messages (conversation_id, sender_id, message_text, is_read)
  VALUES
    (conv_id, u_marcus, 'Hi Elena! Thanks for accepting the exchange request.', true),
    (conv_id, u_regular, 'So glad to connect Marcus! I am excited to get comfortable with Python.', true),
    (conv_id, u_marcus, 'Looking forward to our Thursday session! I prepared a starter GitHub notebook for you.', false);

  -- 8. Learning Progress
  INSERT INTO public.learning_progress (exchange_id, user_id, goal_title, starting_level, current_level, target_level, progress_percent, milestones, notes)
  VALUES (exch_id, u_regular, 'Automate Design Token Export with Python', 'Beginner', 'Beginner', 'Intermediate', 25, '[{"title": "Setup Python 3 & pipenv", "completed": true}, {"title": "Parse JSON color tokens", "completed": false}, {"title": "Generate CSS variables file", "completed": false}]'::jsonb, 'Session 1 scheduled for this week.');

  -- 9. Community Posts
  INSERT INTO public.community_posts (author_id, title, content, category, likes_count, comments_count)
  VALUES
    (u_marcus, 'Tips for structuring your first 45-minute Python peer session', 'When teaching Python to a design or marketing peer, start with interactive scripts and live terminal outputs rather than abstract theory. Here is a structure that worked for my 12 exchanges...', 'Learning Tips', 15, 3),
    (u_sophie, 'Why exchange learning works 3x faster than solo apps', 'The accountability of a real human partner creates an emotional connection to the learning schedule. When you know someone is waiting to practice with you, you actually show up prepared!', 'Community Stories', 24, 7),
    (u_maya, 'How to combine SEO intent with clean UX design', 'Great article on bridging marketing metrics and user experience during peer exchanges. Shared resources and worksheet inside.', 'Resources', 9, 2);

END $$;