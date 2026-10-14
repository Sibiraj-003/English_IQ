import { Router } from 'express';
import { db, Question } from '../db/store.js';
import { questionGeneratorService } from '../ai/questionGenerator.js';
import { config } from '../config/index.js';
import { createClient } from '@supabase/supabase-js';

const router = Router();

// POST /api/questions (Create custom question manually)
router.post('/', async (req, res) => {
  try {
    const {
      class_id,
      book_id,
      lesson_id,
      topic,
      question_text,
      question_type = 'MCQ',
      options = [],
      correct_answer,
      explanation,
      difficulty = 'Easy',
      status = 'approved',
    } = req.body;

    if (!question_text || !question_text.trim()) {
      return res.status(400).json({ error: 'Question text is required.' });
    }

    if (!correct_answer || !String(correct_answer).trim()) {
      return res.status(400).json({ error: 'Correct answer is required.' });
    }

    const newQuestion: Question = {
      id: `custom-q-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      class_id: class_id || db.classes[0]?.id || 'CLS001',
      book_id: book_id || undefined,
      lesson_id: lesson_id || undefined,
      topic: topic?.trim() || 'General English',
      question_text: question_text.trim(),
      question_type: question_type || 'MCQ',
      options: Array.isArray(options) ? options.map((o: any) => String(o).trim()).filter(Boolean) : [],
      correct_answer: String(correct_answer).trim(),
      explanation: (explanation || '').trim(),
      difficulty: difficulty || 'Easy',
      status: status || 'approved',
      source_page: 1,
      created_at: new Date().toISOString(),
    };

    db.questions.unshift(newQuestion);
    db.logActivity('QUESTION_APPROVE', `Teacher added custom question: "${newQuestion.question_text.slice(0, 35)}..."`);

    // Sync with Supabase if available
    const supabaseKeyToUse = config.supabaseServiceRoleKey || config.supabaseAnonKey;
    if (config.supabaseUrl && supabaseKeyToUse) {
      try {
        const supabase = createClient(config.supabaseUrl, supabaseKeyToUse);
        await supabase.from('questions').insert({
          id: newQuestion.id,
          class_id: newQuestion.class_id,
          book_id: newQuestion.book_id,
          lesson_id: newQuestion.lesson_id,
          topic: newQuestion.topic,
          question_text: newQuestion.question_text,
          question_type: newQuestion.question_type,
          options: newQuestion.options,
          correct_answer: newQuestion.correct_answer,
          explanation: newQuestion.explanation,
          difficulty: newQuestion.difficulty,
          status: newQuestion.status,
        });
      } catch (sbErr: any) {
        console.warn('Supabase custom question sync notice:', sbErr.message);
      }
    }

    return res.status(201).json({
      message: 'Custom question created successfully',
      question: newQuestion,
    });
  } catch (err: any) {
    console.error('Error creating custom question:', err);
    return res.status(500).json({ error: 'Failed to create question', details: err.message });
  }
});

// POST /api/questions/generate
router.post('/generate', async (req, res) => {
  try {
    const { class_id, book_id, lesson_id, topic, count, difficulty, question_type } = req.body;

    if (!class_id) {
      return res.status(400).json({ error: 'Class ID is required' });
    }

    const targetBookId = book_id || db.books.find((b) => b.class_id === class_id)?.id || db.books[0]?.id;

    const questions = await questionGeneratorService.generateQuestions({
      class_id,
      book_id: targetBookId,
      lesson_id,
      topic,
      count: parseInt(count || '3', 10),
      difficulty,
      question_type,
    });

    return res.status(201).json({
      message: `Generated ${questions.length} questions. Status: DRAFT (Teacher Review Required).`,
      questions,
    });
  } catch (err: any) {
    console.error('Question generation error:', err);
    return res.status(500).json({ error: 'Failed to generate questions', details: err.message });
  }
});

// GET /api/questions
router.get('/', (req, res) => {
  const { class_id, book_id, lesson_id, topic, difficulty, status } = req.query;

  let results = db.questions;

  if (class_id) {
    results = results.filter((q) => q.class_id === class_id);
  }
  if (book_id) {
    results = results.filter((q) => q.book_id === book_id);
  }
  if (lesson_id) {
    results = results.filter((q) => q.lesson_id === lesson_id);
  }
  if (topic) {
    results = results.filter((q) => q.topic.toLowerCase().includes(String(topic).toLowerCase()));
  }
  if (difficulty) {
    results = results.filter((q) => q.difficulty === difficulty);
  }
  if (status) {
    results = results.filter((q) => q.status === status);
  }

  return res.json(results);
});

// PATCH /api/questions/:id (Teacher edits or approves/publishes/rejects)
router.patch('/:id', (req, res) => {
  const index = db.questions.findIndex((q) => q.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Question not found' });
  }

  const existing = db.questions[index];
  const updated: Question = {
    ...existing,
    ...req.body,
  };

  db.questions[index] = updated;
  return res.json(updated);
});

// DELETE /api/questions/:id
router.delete('/:id', (req, res) => {
  const index = db.questions.findIndex((q) => q.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Question not found' });
  }

  db.questions.splice(index, 1);
  return res.json({ message: 'Question removed successfully', id: req.params.id });
});

export default router;
