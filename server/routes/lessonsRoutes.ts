import { Router } from 'express';
import { db, Lesson } from '../db/store.js';

const router = Router();

// GET /api/lessons
router.get('/', (req, res) => {
  const { class_id, book_id } = req.query;

  let results = db.lessons;

  if (book_id) {
    results = results.filter((l) => l.book_id === book_id);
  } else if (class_id) {
    const classBooks = db.books.filter((b) => b.class_id === class_id).map((b) => b.id);
    results = results.filter((l) => l.book_id && classBooks.includes(l.book_id));
  }

  return res.json(results);
});

// GET /api/lessons/:id
router.get('/:id', (req, res) => {
  const lesson = db.lessons.find((l) => l.id === req.params.id);
  if (!lesson) {
    return res.status(404).json({ error: 'Lesson not found' });
  }

  const chapter = db.chapters.find((ch) => ch.id === lesson.chapter_id);
  const book = db.books.find((b) => b.id === lesson.book_id || (chapter && b.id === chapter.book_id));
  const questions = db.questions.filter((q) => q.lesson_id === lesson.id && q.status === 'published');

  return res.json({
    ...lesson,
    chapter_title: chapter?.title || 'Lesson',
    book_title: book?.title || 'Textbook',
    source_page: (lesson as any).source_page || 1,
    questions,
  });
});

// POST /api/lessons (Teacher creates lesson)
router.post('/', (req, res) => {
  const { chapter_id, book_id, title, content, summary, grammar_topics, vocabulary, difficulty } = req.body;

  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required' });
  }

  const newLesson: Lesson = {
    id: `lesson-${Date.now()}`,
    chapter_id: chapter_id || db.chapters[0]?.id || 'ch-1',
    book_id: book_id || db.books[0]?.id || 'book-1',
    title,
    content,
    summary: summary || '',
    grammar_topics: grammar_topics || [],
    vocabulary: vocabulary || [],
    difficulty: difficulty || 'Easy',
    created_at: new Date().toISOString(),
  };

  db.lessons.push(newLesson);
  return res.status(201).json(newLesson);
});

// PUT /api/lessons/:id (Teacher updates lesson)
router.put('/:id', (req, res) => {
  const index = db.lessons.findIndex((l) => l.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Lesson not found' });
  }

  const updated = {
    ...db.lessons[index],
    ...req.body,
    updated_at: new Date().toISOString(),
  };

  db.lessons[index] = updated;
  return res.json(updated);
});

export default router;
