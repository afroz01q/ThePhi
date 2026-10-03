-- 1. Enhance profiles table with onboarding status and location fields
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS onboarding_status text NOT NULL DEFAULT 'not_started',
ADD COLUMN IF NOT EXISTS onboarding_step integer NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS country text,
ADD COLUMN IF NOT EXISTS preferred_format text DEFAULT 'Online',
ADD COLUMN IF NOT EXISTS experience_level text DEFAULT 'Intermediate';

-- Mark existing seeded active members as completed so existing tests/features work
UPDATE profiles 
SET onboarding_status = 'completed', onboarding_step = 5 
WHERE username IN ('admin', 'regular_user', 'marcus_py', 'sophie_languages', 'david_music', 'maya_growth');

-- 2. Enhance skills table with subcategory, icon, and updated_at
ALTER TABLE skills 
ADD COLUMN IF NOT EXISTS subcategory text,
ADD COLUMN IF NOT EXISTS icon text,
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 3. Create Courses table
CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  primary_skill_id uuid REFERENCES skills(id) ON DELETE SET NULL,
  category text NOT NULL DEFAULT 'General',
  level text NOT NULL DEFAULT 'Beginner',
  language text NOT NULL DEFAULT 'English',
  duration text DEFAULT '4 Weeks',
  instructor text DEFAULT 'Community Faculty',
  status text NOT NULL DEFAULT 'active',
  image_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on courses
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Courses RLS policies
DROP POLICY IF EXISTS "Public read access for active courses" ON courses;
CREATE POLICY "Public read access for active courses" 
ON courses FOR SELECT 
USING (status = 'active' OR auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin full control on courses" ON courses;
CREATE POLICY "Admin full control on courses" 
ON courses FOR ALL 
TO authenticated 
USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
)
WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
);

-- 4. Enhance user_learning_skills with course_id
ALTER TABLE user_learning_skills 
ADD COLUMN IF NOT EXISTS course_id uuid REFERENCES courses(id) ON DELETE SET NULL;

-- 5. Seed Skills and Categories if missing
DO $$
DECLARE
  tech_cat_id uuid;
  design_cat_id uuid;
  biz_cat_id uuid;
  lang_cat_id uuid;
  music_cat_id uuid;
  fit_cat_id uuid;
BEGIN
  -- Get or create categories
  SELECT id INTO tech_cat_id FROM skill_categories WHERE name = 'Software & Tech' LIMIT 1;
  IF tech_cat_id IS NULL THEN
    INSERT INTO skill_categories (name, description, icon) VALUES ('Software & Tech', 'Coding, cloud, AI, and systems engineering', 'Code') RETURNING id INTO tech_cat_id;
  END IF;

  SELECT id INTO design_cat_id FROM skill_categories WHERE name = 'Design & Creative' LIMIT 1;
  IF design_cat_id IS NULL THEN
    INSERT INTO skill_categories (name, description, icon) VALUES ('Design & Creative', 'Product design, UI/UX, graphic design, and media', 'Palette') RETURNING id INTO design_cat_id;
  END IF;

  SELECT id INTO biz_cat_id FROM skill_categories WHERE name = 'Business & Marketing' LIMIT 1;
  IF biz_cat_id IS NULL THEN
    INSERT INTO skill_categories (name, description, icon) VALUES ('Business & Marketing', 'Growth marketing, sales, SEO, and operations', 'TrendingUp') RETURNING id INTO biz_cat_id;
  END IF;

  SELECT id INTO lang_cat_id FROM skill_categories WHERE name = 'Languages & Speech' LIMIT 1;
  IF lang_cat_id IS NULL THEN
    INSERT INTO skill_categories (name, description, icon) VALUES ('Languages & Speech', 'Conversational languages, public speaking, and linguistics', 'Globe') RETURNING id INTO lang_cat_id;
  END IF;

  SELECT id INTO music_cat_id FROM skill_categories WHERE name = 'Music & Audio' LIMIT 1;
  IF music_cat_id IS NULL THEN
    INSERT INTO skill_categories (name, description, icon) VALUES ('Music & Audio', 'Instruments, composition, and sound engineering', 'Music') RETURNING id INTO music_cat_id;
  END IF;

  SELECT id INTO fit_cat_id FROM skill_categories WHERE name = 'Health & Fitness' LIMIT 1;
  IF fit_cat_id IS NULL THEN
    INSERT INTO skill_categories (name, description, icon) VALUES ('Health & Fitness', 'Strength training, yoga, nutrition, and wellness', 'Activity') RETURNING id INTO fit_cat_id;
  END IF;

  -- Insert core canonical skills if they don't already exist
  IF NOT EXISTS (SELECT 1 FROM skills WHERE name = 'Java') THEN
    INSERT INTO skills (name, category_id, subcategory, description, status)
    VALUES ('Java', tech_cat_id, 'Backend Development', 'Object-oriented programming, Spring Boot, and enterprise backend systems', 'active');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM skills WHERE name = 'JavaScript') THEN
    INSERT INTO skills (name, category_id, subcategory, description, status)
    VALUES ('JavaScript', tech_cat_id, 'Web Development', 'Modern ES6+, asynchronous JavaScript, DOM manipulation, and fullstack JS', 'active');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM skills WHERE name = 'Web Development') THEN
    INSERT INTO skills (name, category_id, subcategory, description, status)
    VALUES ('Web Development', tech_cat_id, 'Frontend & Fullstack', 'HTML5, CSS3, modern responsive layouts, web performance, and browser APIs', 'active');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM skills WHERE name = 'Mobile Development') THEN
    INSERT INTO skills (name, category_id, subcategory, description, status)
    VALUES ('Mobile Development', tech_cat_id, 'App Engineering', 'React Native, Flutter, iOS Swift, and Android application architecture', 'active');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM skills WHERE name = 'AI & Machine Learning') THEN
    INSERT INTO skills (name, category_id, subcategory, description, status)
    VALUES ('AI & Machine Learning', tech_cat_id, 'Data Science', 'Machine learning algorithms, PyTorch, LLMs, prompt engineering, and model deployment', 'active');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM skills WHERE name = 'Cybersecurity') THEN
    INSERT INTO skills (name, category_id, subcategory, description, status)
    VALUES ('Cybersecurity', tech_cat_id, 'InfoSec', 'Network security, penetration testing, threat modeling, and defensive security', 'active');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM skills WHERE name = 'Graphic Design') THEN
    INSERT INTO skills (name, category_id, subcategory, description, status)
    VALUES ('Graphic Design', design_cat_id, 'Visual Communication', 'Typography, color theory, layout composition, and brand identity design', 'active');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM skills WHERE name = 'Photoshop') THEN
    INSERT INTO skills (name, category_id, subcategory, description, status)
    VALUES ('Photoshop', design_cat_id, 'Digital Imaging', 'Photo manipulation, retouching, compositing, and raster graphic creation', 'active');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM skills WHERE name = 'Video Editing') THEN
    INSERT INTO skills (name, category_id, subcategory, description, status)
    VALUES ('Video Editing', design_cat_id, 'Motion & Video', 'Premiere Pro, DaVinci Resolve, pacing, color grading, and video storytelling', 'active');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM skills WHERE name = 'Photography') THEN
    INSERT INTO skills (name, category_id, subcategory, description, status)
    VALUES ('Photography', design_cat_id, 'Visual Media', 'Camera mechanics, lighting, composition, portraiture, and post-processing', 'active');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM skills WHERE name = 'Digital Marketing') THEN
    INSERT INTO skills (name, category_id, subcategory, description, status)
    VALUES ('Digital Marketing', biz_cat_id, 'Growth & Advertising', 'Growth funnels, paid media, organic content strategy, and campaign analytics', 'active');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM skills WHERE name = 'Sales & Negotiation') THEN
    INSERT INTO skills (name, category_id, subcategory, description, status)
    VALUES ('Sales & Negotiation', biz_cat_id, 'Business Development', 'B2B sales pipelines, objection handling, closing techniques, and client relations', 'active');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM skills WHERE name = 'Excel & Data Analysis') THEN
    INSERT INTO skills (name, category_id, subcategory, description, status)
    VALUES ('Excel & Data Analysis', biz_cat_id, 'Analytics', 'VLOOKUP/XLOOKUP, pivot tables, financial modeling, and data visualization', 'active');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM skills WHERE name = 'Communication & Public Speaking') THEN
    INSERT INTO skills (name, category_id, subcategory, description, status)
    VALUES ('Communication & Public Speaking', lang_cat_id, 'Soft Skills', 'Presentation design, vocal delivery, stage presence, and executive communication', 'active');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM skills WHERE name = 'Music Production') THEN
    INSERT INTO skills (name, category_id, subcategory, description, status)
    VALUES ('Music Production', music_cat_id, 'Audio Engineering', 'Ableton Live, Logic Pro, mixing, audio mastering, and synth design', 'active');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM skills WHERE name = 'Culinary Arts & Cooking') THEN
    INSERT INTO skills (name, category_id, subcategory, description, status)
    VALUES ('Culinary Arts & Cooking', fit_cat_id, 'Lifestyle & Culinary', 'Knife skills, flavor profiling, sauce creation, and culinary fundamentals', 'active');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM skills WHERE name = 'Fitness & Strength') THEN
    INSERT INTO skills (name, category_id, subcategory, description, status)
    VALUES ('Fitness & Strength', fit_cat_id, 'Health & Conditioning', 'Progressive overload, barbell biomechanics, nutrition, and workout planning', 'active');
  END IF;
END $$;

-- 6. Seed Course Catalog
DO $$
DECLARE
  py_id uuid;
  java_id uuid;
  ui_id uuid;
  web_id uuid;
  cyber_id uuid;
  figma_id uuid;
  seo_id uuid;
  spanish_id uuid;
  guitar_id uuid;
  photo_id uuid;
BEGIN
  SELECT id INTO py_id FROM skills WHERE name LIKE '%Python%' LIMIT 1;
  SELECT id INTO java_id FROM skills WHERE name LIKE '%Java' LIMIT 1;
  SELECT id INTO ui_id FROM skills WHERE name LIKE '%UI/UX%' LIMIT 1;
  SELECT id INTO web_id FROM skills WHERE name LIKE '%Web Development%' LIMIT 1;
  SELECT id INTO cyber_id FROM skills WHERE name LIKE '%Cybersecurity%' LIMIT 1;
  SELECT id INTO figma_id FROM skills WHERE name LIKE '%Figma%' LIMIT 1;
  SELECT id INTO seo_id FROM skills WHERE name LIKE '%SEO%' OR name LIKE '%Digital Marketing%' LIMIT 1;
  SELECT id INTO spanish_id FROM skills WHERE name LIKE '%Spanish%' LIMIT 1;
  SELECT id INTO guitar_id FROM skills WHERE name LIKE '%Guitar%' LIMIT 1;
  SELECT id INTO photo_id FROM skills WHERE name LIKE '%Photo%' LIMIT 1;

  IF NOT EXISTS (SELECT 1 FROM courses WHERE title = 'Python Fundamentals & Scripting') THEN
    INSERT INTO courses (title, description, primary_skill_id, category, level, duration, instructor, image_url)
    VALUES (
      'Python Fundamentals & Scripting',
      'Master core Python syntax, data structures, file I/O, and build practical automation scripts from scratch.',
      py_id,
      'Software & Tech',
      'Beginner',
      '4 Weeks (8 Sessions)',
      'Marcus Vance',
      'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_327732a3-2f22-4a0b-8d54-15065c711a37.jpg'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM courses WHERE title = 'Advanced Java & Distributed Architecture') THEN
    INSERT INTO courses (title, description, primary_skill_id, category, level, duration, instructor, image_url)
    VALUES (
      'Advanced Java & Distributed Architecture',
      'Deep dive into multithreading, concurrency, memory optimization, JVM internals, and microservices.',
      java_id,
      'Software & Tech',
      'Advanced',
      '6 Weeks (12 Sessions)',
      'Community Senior Engineer',
      'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_6e86663c-3ae8-41f2-bf1c-5bb5a3637172.jpg'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM courses WHERE title = 'UI/UX Design Systems & Product Strategy') THEN
    INSERT INTO courses (title, description, primary_skill_id, category, level, duration, instructor, image_url)
    VALUES (
      'UI/UX Design Systems & Product Strategy',
      'Learn user research, wireframing, high-fidelity Figma components, tokens, accessibility, and client handoff.',
      ui_id,
      'Design & Creative',
      'Intermediate',
      '5 Weeks (10 Sessions)',
      'Sophie Chen',
      'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_981a3297-c257-4f6c-8472-a0e2389d023c.jpg'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM courses WHERE title = 'Fullstack Web Development with Modern JavaScript') THEN
    INSERT INTO courses (title, description, primary_skill_id, category, level, duration, instructor, image_url)
    VALUES (
      'Fullstack Web Development with Modern JavaScript',
      'Build end-to-end web apps with React, Node.js, RESTful APIs, and database migrations.',
      web_id,
      'Software & Tech',
      'Beginner to Intermediate',
      '6 Weeks (12 Sessions)',
      'David Miller',
      'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_6e86663c-3ae8-41f2-bf1c-5bb5a3637172.jpg'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM courses WHERE title = 'Introduction to Cybersecurity & Defensive Security') THEN
    INSERT INTO courses (title, description, primary_skill_id, category, level, duration, instructor, image_url)
    VALUES (
      'Introduction to Cybersecurity & Defensive Security',
      'Explore threat landscapes, secure authentication, network sniffing defenses, and vulnerability assessment.',
      cyber_id,
      'Software & Tech',
      'Beginner',
      '4 Weeks (8 Sessions)',
      'Maya Lin',
      'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_327732a3-2f22-4a0b-8d54-15065c711a37.jpg'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM courses WHERE title = 'Conversational Spanish for Practical Fluency') THEN
    INSERT INTO courses (title, description, primary_skill_id, category, level, duration, instructor, image_url)
    VALUES (
      'Conversational Spanish for Practical Fluency',
      'Gain speaking confidence through live roleplay, everyday idioms, pronunciation drills, and dialogue practice.',
      spanish_id,
      'Languages & Speech',
      'Beginner',
      '4 Weeks (8 Sessions)',
      'Elena Morales',
      'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_981a3297-c257-4f6c-8472-a0e2389d023c.jpg'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM courses WHERE title = 'Acoustic Guitar Mastery: Chords to Fingerstyle') THEN
    INSERT INTO courses (title, description, primary_skill_id, category, level, duration, instructor, image_url)
    VALUES (
      'Acoustic Guitar Mastery: Chords to Fingerstyle',
      'Progress from basic chord transitions to Travis picking, rhythm grooves, and solo song interpretation.',
      guitar_id,
      'Music & Audio',
      'Beginner to Intermediate',
      '5 Weeks (10 Sessions)',
      'David Miller',
      'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_6e86663c-3ae8-41f2-bf1c-5bb5a3637172.jpg'
    );
  END IF;
END $$;

-- 7. Database Triggers & Invariant Enforcement Functions

-- Function to check minimum skills when attempting to mark onboarding completed
CREATE OR REPLACE FUNCTION check_onboarding_completion_invariants()
RETURNS TRIGGER AS $$
DECLARE
  v_teaching_count integer;
  v_learning_count integer;
BEGIN
  IF NEW.onboarding_status = 'completed' THEN
    SELECT count(*) INTO v_teaching_count FROM user_teaching_skills WHERE user_id = NEW.id;
    SELECT count(*) INTO v_learning_count FROM user_learning_skills WHERE user_id = NEW.id;

    IF v_teaching_count < 1 THEN
      RAISE EXCEPTION 'Please select at least one skill you can teach.';
    END IF;

    IF v_learning_count < 1 THEN
      RAISE EXCEPTION 'Please select at least one course or skill you want to learn.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_check_onboarding_invariants ON profiles;
CREATE TRIGGER trigger_check_onboarding_invariants
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION check_onboarding_completion_invariants();

-- Function to prevent deletion of last teaching skill for completed profiles
CREATE OR REPLACE FUNCTION prevent_last_teaching_skill_deletion()
RETURNS TRIGGER AS $$
DECLARE
  v_status text;
  v_count integer;
BEGIN
  SELECT onboarding_status INTO v_status FROM profiles WHERE id = OLD.user_id;
  
  -- If user has completed onboarding, enforce invariant
  IF v_status = 'completed' THEN
    SELECT count(*) INTO v_count FROM user_teaching_skills WHERE user_id = OLD.user_id;
    IF v_count <= 1 THEN
      RAISE EXCEPTION 'You must keep at least one teaching skill and one learning interest.';
    END IF;
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_prevent_last_teaching_skill ON user_teaching_skills;
CREATE TRIGGER trigger_prevent_last_teaching_skill
BEFORE DELETE ON user_teaching_skills
FOR EACH ROW
EXECUTE FUNCTION prevent_last_teaching_skill_deletion();

-- Function to prevent deletion of last learning interest for completed profiles
CREATE OR REPLACE FUNCTION prevent_last_learning_skill_deletion()
RETURNS TRIGGER AS $$
DECLARE
  v_status text;
  v_count integer;
BEGIN
  SELECT onboarding_status INTO v_status FROM profiles WHERE id = OLD.user_id;
  
  -- If user has completed onboarding, enforce invariant
  IF v_status = 'completed' THEN
    SELECT count(*) INTO v_count FROM user_learning_skills WHERE user_id = OLD.user_id;
    IF v_count <= 1 THEN
      RAISE EXCEPTION 'You must keep at least one teaching skill and one learning interest.';
    END IF;
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_prevent_last_learning_skill ON user_learning_skills;
CREATE TRIGGER trigger_prevent_last_learning_skill
BEFORE DELETE ON user_learning_skills
FOR EACH ROW
EXECUTE FUNCTION prevent_last_learning_skill_deletion();

-- 8. Complete Onboarding RPC function (ensures atomic check and update)
CREATE OR REPLACE FUNCTION complete_user_onboarding(
  p_user_id uuid,
  p_full_name text DEFAULT NULL,
  p_bio text DEFAULT NULL,
  p_city text DEFAULT NULL,
  p_country text DEFAULT NULL,
  p_languages text[] DEFAULT NULL,
  p_experience text DEFAULT NULL,
  p_format text DEFAULT NULL,
  p_avatar_url text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  v_teaching_count integer;
  v_learning_count integer;
  v_loc text;
BEGIN
  -- Security check: caller can only finalize their own account unless admin
  IF auth.uid() IS NULL OR (auth.uid() != p_user_id AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')) THEN
    RAISE EXCEPTION 'Unauthorized: You can only complete your own onboarding.';
  END IF;

  -- 1. Enforce Teaching Skills Requirement
  SELECT count(*) INTO v_teaching_count FROM user_teaching_skills WHERE user_id = p_user_id;
  IF v_teaching_count < 1 THEN
    RAISE EXCEPTION 'Please select at least one skill you can teach.';
  END IF;

  -- 2. Enforce Learning Interests / Courses Requirement
  SELECT count(*) INTO v_learning_count FROM user_learning_skills WHERE user_id = p_user_id;
  IF v_learning_count < 1 THEN
    RAISE EXCEPTION 'Please select at least one course or skill you want to learn.';
  END IF;

  -- Combine location if provided
  IF p_city IS NOT NULL AND p_country IS NOT NULL THEN
    v_loc := p_city || ', ' || p_country;
  ELSIF p_city IS NOT NULL THEN
    v_loc := p_city;
  ELSIF p_country IS NOT NULL THEN
    v_loc := p_country;
  ELSE
    v_loc := NULL;
  END IF;

  -- 3. Atomically update profile to completed
  UPDATE profiles
  SET 
    onboarding_status = 'completed',
    onboarding_step = 5,
    full_name = COALESCE(p_full_name, full_name),
    bio = COALESCE(p_bio, bio),
    city = COALESCE(p_city, city),
    country = COALESCE(p_country, country),
    location = COALESCE(v_loc, location),
    languages = COALESCE(p_languages, languages),
    experience_level = COALESCE(p_experience, experience_level),
    preferred_format = COALESCE(p_format, preferred_format),
    avatar_url = COALESCE(p_avatar_url, avatar_url),
    updated_at = now()
  WHERE id = p_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Onboarding completed successfully',
    'teaching_skills_count', v_teaching_count,
    'learning_interests_count', v_learning_count
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
