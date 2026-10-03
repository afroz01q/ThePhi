DO $$
DECLARE
  cat_tech uuid;
  cat_design uuid;
  cat_lang uuid;
  cat_biz uuid;
  cat_music uuid;
  cat_fitness uuid;
  cat_academic uuid;

  skill_py uuid;
  skill_react uuid;
  skill_ts uuid;
  skill_uiux uuid;
  skill_figma uuid;
  skill_spanish uuid;
  skill_japanese uuid;
  skill_seo uuid;
  skill_guitar uuid;
  skill_piano uuid;
  skill_yoga uuid;
BEGIN
  -- Insert categories
  INSERT INTO public.skill_categories (name, description, icon, display_order)
  VALUES
    ('Software & Tech', 'Web, mobile, cloud computing, and software development', 'Code', 1)
  ON CONFLICT (name) DO UPDATE SET icon = EXCLUDED.icon
  RETURNING id INTO cat_tech;

  INSERT INTO public.skill_categories (name, description, icon, display_order)
  VALUES
    ('Design & Creative', 'UI/UX, visual art, branding, and multimedia editing', 'Palette', 2)
  ON CONFLICT (name) DO UPDATE SET icon = EXCLUDED.icon
  RETURNING id INTO cat_design;

  INSERT INTO public.skill_categories (name, description, icon, display_order)
  VALUES
    ('Languages & Speech', 'Conversational foreign languages, grammar, and public speaking', 'Languages', 3)
  ON CONFLICT (name) DO UPDATE SET icon = EXCLUDED.icon
  RETURNING id INTO cat_lang;

  INSERT INTO public.skill_categories (name, description, icon, display_order)
  VALUES
    ('Business & Marketing', 'Digital marketing, SEO, startups, and personal finance', 'Briefcase', 4)
  ON CONFLICT (name) DO UPDATE SET icon = EXCLUDED.icon
  RETURNING id INTO cat_biz;

  INSERT INTO public.skill_categories (name, description, icon, display_order)
  VALUES
    ('Music & Audio', 'Musical instruments, vocal coaching, and audio production', 'Music', 5)
  ON CONFLICT (name) DO UPDATE SET icon = EXCLUDED.icon
  RETURNING id INTO cat_music;

  INSERT INTO public.skill_categories (name, description, icon, display_order)
  VALUES
    ('Health & Fitness', 'Yoga, workout plans, nutrition, and mental wellness', 'Activity', 6)
  ON CONFLICT (name) DO UPDATE SET icon = EXCLUDED.icon
  RETURNING id INTO cat_fitness;

  -- Insert skills
  INSERT INTO public.skills (category_id, name, description)
  VALUES
    (cat_tech, 'Python Programming', 'Backend scripting, automation, data science, and web frameworks')
  ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description
  RETURNING id INTO skill_py;

  INSERT INTO public.skills (category_id, name, description)
  VALUES
    (cat_tech, 'React & Frontend', 'Modern web interfaces with React, state management, and Tailwind CSS')
  ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description
  RETURNING id INTO skill_react;

  INSERT INTO public.skills (category_id, name, description)
  VALUES
    (cat_tech, 'TypeScript', 'Type-safe JavaScript for scalable web development')
  ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description
  RETURNING id INTO skill_ts;

  INSERT INTO public.skills (category_id, name, description)
  VALUES
    (cat_design, 'UI/UX Design', 'User research, wireframing, interaction design, and usability testing')
  ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description
  RETURNING id INTO skill_uiux;

  INSERT INTO public.skills (category_id, name, description)
  VALUES
    (cat_design, 'Figma Prototyping', 'Mastering Figma components, auto-layout, and interactive prototypes')
  ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description
  RETURNING id INTO skill_figma;

  INSERT INTO public.skills (category_id, name, description)
  VALUES
    (cat_lang, 'Spanish Conversation', 'Practical conversational Spanish for travel, work, and cultural fluency')
  ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description
  RETURNING id INTO skill_spanish;

  INSERT INTO public.skills (category_id, name, description)
  VALUES
    (cat_lang, 'Japanese for Beginners', 'Hiragana, Katakana, basic grammar, and travel vocabulary')
  ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description
  RETURNING id INTO skill_japanese;

  INSERT INTO public.skills (category_id, name, description)
  VALUES
    (cat_biz, 'SEO & Content Strategy', 'Organic search optimization, keyword research, and audience growth')
  ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description
  RETURNING id INTO skill_seo;

  INSERT INTO public.skills (category_id, name, description)
  VALUES
    (cat_music, 'Acoustic Guitar', 'Chords, strumming patterns, fingerpicking, and popular songs')
  ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description
  RETURNING id INTO skill_guitar;

  INSERT INTO public.skills (category_id, name, description)
  VALUES
    (cat_music, 'Piano Fundamentals', 'Sheet music reading, scales, chord progressions, and classical/pop pieces')
  ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description
  RETURNING id INTO skill_piano;

  INSERT INTO public.skills (category_id, name, description)
  VALUES
    (cat_fitness, 'Hatha Yoga & Breathwork', 'Mindful movement, core stability, stress reduction, and breathing techniques')
  ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description
  RETURNING id INTO skill_yoga;

  -- Update admin user profile details if exists
  UPDATE public.profiles
  SET
    full_name = 'Alex Rivera (Admin)',
    avatar_url = 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_660e9ae4-2f78-4f2b-8de1-1547d1387ee9.jpg',
    bio = 'SkillXChange platform administrator and full-stack software mentor.',
    location = 'San Francisco, USA',
    languages = '{"English", "Spanish"}'::text[],
    reputation_score = 98,
    status = 'active'
  WHERE email = 'admin@miaoda.com';

  -- Update regular user profile details if exists
  UPDATE public.profiles
  SET
    full_name = 'Elena Rostova',
    avatar_url = 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_2e9c2aa7-8bc8-4cbe-aa08-626c5833e161.jpg',
    bio = 'Product designer enthusiastic about exchanging design systems knowledge for Python & data visualization skills.',
    location = 'Berlin, Germany',
    languages = '{"English", "German"}'::text[],
    reputation_score = 88,
    status = 'active'
  WHERE email = 'regular_user@miaoda.com';

END $$;