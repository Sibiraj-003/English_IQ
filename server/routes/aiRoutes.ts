import { Router } from 'express';
import { aiTeacherService } from '../ai/aiTeacher.js';
import { groqClient } from '../ai/groqClient.js';
import { db } from '../db/store.js';

const router = Router();

// GET /api/ai/status
router.get('/status', async (_req, res) => {
  const isHealthy = await groqClient.isHealthy();
  return res.json({
    status: isHealthy ? 'ONLINE' : 'OFFLINE',
    service: 'NOVA_AI',
    model: 'NOVA-Neural-Edu-v2.5',
  });
});

// POST /api/ai/chat
router.post('/chat', async (req, res) => {
  try {
    const { student_id, class_id, book_id, lesson_id, message, mode } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    const effectiveStudentId = student_id || 'student-leo-id';
    const effectiveClassId = class_id || 'class-1-id';

    const result = await aiTeacherService.processQuery({
      student_id: effectiveStudentId,
      class_id: effectiveClassId,
      book_id,
      lesson_id,
      message,
      mode: mode || 'ask',
    });

    return res.json(result);
  } catch (err: any) {
    console.error('AI Chat Error:', err);
    return res.status(500).json({
      error: 'AI Teacher encountered an error',
      details: err.message,
    });
  }
});

// POST /api/ai/explain
router.post('/explain', async (req, res) => {
  try {
    const { topic, class_id, student_id } = req.body;
    const result = await aiTeacherService.processQuery({
      student_id: student_id || 'student-leo-id',
      class_id: class_id || 'class-1-id',
      message: `Explain ${topic || 'nouns'} clearly with examples`,
      mode: 'explain',
    });
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/practice
router.post('/practice', async (req, res) => {
  try {
    const { topic, class_id, student_id } = req.body;
    const result = await aiTeacherService.processQuery({
      student_id: student_id || 'student-leo-id',
      class_id: class_id || 'class-1-id',
      message: `Give me practice questions for ${topic || 'grammar'}`,
      mode: 'practice',
    });
    return res.json(result);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
});

export default router;
