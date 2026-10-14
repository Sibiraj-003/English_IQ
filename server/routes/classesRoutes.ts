import { Router } from 'express';
import { db, SchoolClass } from '../db/store.js';

const router = Router();

// GET /api/classes
router.get('/', (_req, res) => {
  const classesWithMeta = db.classes.map((cls) => {
    const books = db.books.filter((b) => b.class_id === cls.id);
    const students = db.profiles.filter((p) => p.role === 'student' && p.class_id === cls.id);
    const tests = db.tests.filter((t) => t.class_id === cls.id);
    const lessons = db.lessons.filter((l) => books.some((b) => b.id === l.book_id));

    const classAttempts = db.student_attempts.filter(
      (a) =>
        students.some((s) => s.id === a.student_id || s.user_id === a.student_id) ||
        tests.some((t) => t.id === a.test_id)
    );
    const avgScore = classAttempts.length > 0
      ? Math.round(classAttempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / classAttempts.length)
      : 0;

    return {
      ...cls,
      books_count: books.length,
      lessons_count: lessons.length,
      students_count: students.length,
      tests_count: tests.length,
      avg_score: avgScore,
    };
  });

  return res.json(classesWithMeta);
});

// GET /api/classes/:id
router.get('/:id', (req, res) => {
  const cls = db.classes.find((c) => c.id === req.params.id);
  if (!cls) {
    return res.status(404).json({ error: 'Class not found' });
  }

  const books = db.books.filter((b) => b.class_id === cls.id);
  const lessons = db.lessons.filter((l) => {
    return books.some((b) => b.id === l.book_id);
  });
  const tests = db.tests.filter((t) => t.class_id === cls.id);
  const students = db.profiles.filter((p) => p.role === 'student' && p.class_id === cls.id);

  return res.json({
    ...cls,
    books,
    lessons,
    tests,
    students,
  });
});

// POST /api/classes
router.post('/', (req, res) => {
  const { name, grade, description } = req.body;

  if (!name || grade === undefined) {
    return res.status(400).json({ error: 'Name and grade are required' });
  }

  const newClass: SchoolClass = {
    id: `class-${Date.now()}`,
    name,
    grade: parseInt(grade, 10),
    description: description || `${name} English Curriculum`,
    student_count: 0,
    avg_score: 0,
    created_at: new Date().toISOString(),
  };

  db.classes.push(newClass);
  return res.status(201).json(newClass);
});

// PUT /api/classes/:id
router.put('/:id', (req, res) => {
  const idx = db.classes.findIndex((c) => c.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Class not found' });
  }

  db.classes[idx] = {
    ...db.classes[idx],
    ...req.body,
  };

  return res.json(db.classes[idx]);
});

// DELETE /api/classes/:id
router.delete('/:id', (req, res) => {
  const idx = db.classes.findIndex((c) => c.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Class not found' });
  }

  db.classes.splice(idx, 1);
  return res.json({ message: 'Class deleted successfully', id: req.params.id });
});

export default router;
