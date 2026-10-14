-- SEED SCRIPT FOR ENGLISHIQ (CLASS 1 DEMO CURRICULUM)

-- 1. Classes
INSERT INTO classes (id, name, grade, description) VALUES
('c1111111-1111-1111-1111-111111111111', 'Class 1', 1, 'Primary Grade 1 - Early English Foundations, Phonics & Basic Grammar'),
('c2222222-2222-2222-2222-222222222222', 'Class 2', 2, 'Primary Grade 2 - Sentence Construction, Vocabulary & Story Comprehension'),
('c3333333-3333-3333-3333-333333333333', 'Class 3', 3, 'Primary Grade 3 - Parts of Speech, Punctuation & Reading Passages')
ON CONFLICT (id) DO NOTHING;

-- 2. Subjects
INSERT INTO subjects (id, name) VALUES
('s1111111-1111-1111-1111-111111111111', 'English')
ON CONFLICT (id) DO NOTHING;

-- 3. Demo Profiles
INSERT INTO profiles (id, full_name, email, role, class_id) VALUES
('p1111111-1111-1111-1111-111111111111', 'Sarah Jenkins (Teacher)', 'teacher@example.com', 'teacher', 'c1111111-1111-1111-1111-111111111111'),
('p2222222-2222-2222-2222-222222222222', 'Leo Martinez (Student)', 'student@example.com', 'student', 'c1111111-1111-1111-1111-111111111111')
ON CONFLICT (id) DO NOTHING;

-- 4. Demo Book
INSERT INTO books (id, class_id, subject_id, title, description, file_name, page_count, processing_status, uploaded_by) VALUES
('b1111111-1111-1111-1111-111111111111', 'c1111111-1111-1111-1111-111111111111', 's1111111-1111-1111-1111-111111111111', 'Class 1 English WonderBook', 'Official Standard English Reader & Grammar Primer for Class 1', 'class_1_english_reader.pdf', 32, 'processed', 'p1111111-1111-1111-1111-111111111111')
ON CONFLICT (id) DO NOTHING;

-- 5. Chapters
INSERT INTO chapters (id, book_id, title, chapter_number, summary) VALUES
('ch111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'Unit 1: My World', 1, 'Introduction to family members, feelings, and the home environment.'),
('ch222222-2222-2222-2222-222222222222', 'b1111111-1111-1111-1111-111111111111', 'Unit 2: Animals and Nature', 2, 'Exploring familiar domestic and wild animals, nature words, and action verbs.')
ON CONFLICT (id) DO NOTHING;

-- 6. Lessons
INSERT INTO lessons (id, chapter_id, title, content, summary, grammar_topics, vocabulary, difficulty) VALUES
('l1111111-1111-1111-1111-111111111111', 'ch111111-1111-1111-1111-111111111111', 'Lesson 1: My Family', 'Hello! My name is Leo. I live in a lovely house with my family. This is my father. He is kind. This is my mother. She reads bedtime stories. This is my sister Tina. We have a playful puppy named Bruno. Bruno is a brown dog.', 'Leo introduces his mother, father, sister Tina, and puppy Bruno.', '["Nouns", "Pronouns", "Naming Words"]'::jsonb, '["mother", "father", "sister", "family", "puppy", "house"]'::jsonb, 'Easy'),
('l2222222-2222-2222-2222-222222222222', 'ch111111-1111-1111-1111-111111111111', 'Lesson 2: At School', 'Every morning, the school bell rings. Ding-dong! We pack our bags with books and pencils. Our teacher smiles and greets us. We sit on chairs and write at our wooden desks. We love to draw pictures and sing nursery rhymes together.', 'A sunny day in the school classroom with friends, books, and teacher.', '["Nouns", "Singular and Plural"]'::jsonb, '["teacher", "school", "pencil", "book", "desk", "chair"]'::jsonb, 'Easy'),
('l3333333-3333-3333-3333-333333333333', 'ch222222-2222-2222-2222-222222222222', 'Lesson 3: Animal Friends', 'Look at the green garden! A little bird sings on the branch. A fuzzy cat sleeps on the mat. The duck swims in the pond: Quack, quack! The horse runs fast across the green meadow. Animals are our good friends.', 'Discovering sounds, actions, and habitats of birds, cats, ducks, and horses.', '["Verbs", "Action Words", "Animal Sounds"]'::jsonb, '["bird", "sing", "duck", "swim", "horse", "run", "quack"]'::jsonb, 'Easy'),
('l4444444-4444-4444-4444-444444444444', 'ch222222-2222-2222-2222-222222222222', 'Lesson 4: Bright Colours', 'The sky is blue. The bright sun is yellow. Grass is fresh and green. Apples in the basket are red. Flowers in the park are pink and purple. What colour do you like best?', 'Identifying everyday primary and secondary colours in natural surroundings.', '["Adjectives", "Describing Words"]'::jsonb, '["blue", "yellow", "green", "red", "pink", "colour"]'::jsonb, 'Easy'),
('l5555555-5555-5555-5555-555555555555', 'ch111111-1111-1111-1111-111111111111', 'Lesson 5: My Friends', 'Tina and Sam are my best friends. We share our crayons and toys. At playtime, we skip rope and play tag. When someone feels sad, we give a warm hug. Good friends always help each other.', 'Sharing, caring, and playing with classmates.', '["Pronouns", "Action Verbs"]'::jsonb, '["friend", "share", "crayons", "play", "help", "hug"]'::jsonb, 'Easy')
ON CONFLICT (id) DO NOTHING;
