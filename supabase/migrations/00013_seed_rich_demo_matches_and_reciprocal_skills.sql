-- Ensure Marcus Vance teaches Java and wants to learn Cybersecurity (Direct Reciprocal Match with Shaik Afroz)
INSERT INTO user_teaching_skills (user_id, skill_id, proficiency_level, experience_years, description, format)
VALUES 
  ('d3009db4-0555-452e-bdab-2be13d405755', 'cd4b906e-f3db-4f2c-b7a0-33311525ba3e', 'Expert', 6, 'Enterprise Java, Spring Boot, microservices architecture, and clean OOP design patterns.', 'Both')
ON CONFLICT (user_id, skill_id) DO UPDATE SET proficiency_level = 'Expert', experience_years = 6;

INSERT INTO user_learning_skills (user_id, skill_id, current_level, target_level, priority, notes, preferred_format)
VALUES 
  ('d3009db4-0555-452e-bdab-2be13d405755', '8555ac51-256f-484e-9d60-de35405d7773', 'Beginner', 'Advanced', 'High', 'Eager to learn penetration testing, network defense, and zero-trust security for backend systems.', 'Online')
ON CONFLICT (user_id, skill_id) DO UPDATE SET priority = 'High';

-- Ensure Alex Rivera (admin@miaoda.com) also teaches Java and wants to learn Cybersecurity
INSERT INTO user_teaching_skills (user_id, skill_id, proficiency_level, experience_years, description, format)
VALUES 
  ('d1312f0b-5a7a-4ca3-9382-a941a6d7f0c5', 'cd4b906e-f3db-4f2c-b7a0-33311525ba3e', 'Advanced', 4, 'Core Java, algorithmic problem solving, concurrency, and backend API engineering.', 'Online')
ON CONFLICT (user_id, skill_id) DO UPDATE SET proficiency_level = 'Advanced';

INSERT INTO user_learning_skills (user_id, skill_id, current_level, target_level, priority, notes, preferred_format)
VALUES 
  ('d1312f0b-5a7a-4ca3-9382-a941a6d7f0c5', '8555ac51-256f-484e-9d60-de35405d7773', 'Intermediate', 'Expert', 'High', 'Wanting to harden cloud web applications and study application security best practices.', 'Both')
ON CONFLICT (user_id, skill_id) DO UPDATE SET priority = 'High';

-- Ensure David Chen wants to learn Cybersecurity and Elena wants to learn Cybersecurity
INSERT INTO user_learning_skills (user_id, skill_id, current_level, target_level, priority, notes, preferred_format)
VALUES 
  ('a03788e3-52f1-48f7-924c-1ddcf1898000', '8555ac51-256f-484e-9d60-de35405d7773', 'Beginner', 'Intermediate', 'Medium', 'Interested in securing personal home studio audio servers and smart tech.', 'Online'),
  ('9acdd54a-987c-4c39-a1fe-74ddb386465f', '8555ac51-256f-484e-9d60-de35405d7773', 'Beginner', 'Advanced', 'High', 'Passionate about privacy-first UX design and secure authentication flows.', 'Online')
ON CONFLICT (user_id, skill_id) DO UPDATE SET priority = 'High';

-- Ensure Elena Rostova and David Chen teach skills that Shaik Afroz or others want to learn
INSERT INTO user_teaching_skills (user_id, skill_id, proficiency_level, experience_years, description, format)
VALUES 
  ('9acdd54a-987c-4c39-a1fe-74ddb386465f', '5854b3f1-82fd-45a9-8a6e-b363277eeaf6', 'Expert', 5, 'Interactive UI design, design systems, and rapid user testing in Figma.', 'Both'),
  ('a03788e3-52f1-48f7-924c-1ddcf1898000', '552950fb-6dbb-40f8-9d32-96119b942a15', 'Advanced', 7, 'Fingerstyle guitar, chord progressions, and ear training fundamentals.', 'Both'),
  ('49847e9c-2089-49a2-82e9-408370ffffc1', 'd525f716-a24b-4fba-b358-dfb84f5cf48e', 'Expert', 8, 'Conversational fluency, grammar, and immersion practice.', 'Online')
ON CONFLICT (user_id, skill_id) DO NOTHING;

-- Also add a complementary skill to Shaik Afroz (Python Programming & UI/UX Design interest) for rich multi-domain pairing
INSERT INTO user_teaching_skills (user_id, skill_id, proficiency_level, experience_years, description, format)
VALUES 
  ('a2a55808-8320-452e-8632-1d8622641a58', '53b995da-7973-4dbe-86be-3862137938b5', 'Advanced', 4, 'Python scripting, network security automation, and data scraping.', 'Both')
ON CONFLICT (user_id, skill_id) DO NOTHING;

INSERT INTO user_learning_skills (user_id, skill_id, current_level, target_level, priority, notes, preferred_format)
VALUES 
  ('a2a55808-8320-452e-8632-1d8622641a58', '5854b3f1-82fd-45a9-8a6e-b363277eeaf6', 'Beginner', 'Intermediate', 'High', 'Eager to improve dashboard design and wireframing skills.', 'Both')
ON CONFLICT (user_id, skill_id) DO NOTHING;
