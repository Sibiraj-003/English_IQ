import { Router } from 'express';
import { db, Subject } from '../db/store.js';
import { requireAdmin, AuthenticatedRequest } from '../middleware/authScope.js';

const router = Router();

// GET /api/subjects - List all subjects
router.get('/', (_req, res) => {
  return res.json(db.subjects);
});

// GET /api/subjects/:id - Get single subject
router.get('/:id', (req, res) => {
  const sub = db.subjects.find((s) => s.id === req.params.id);
  if (!sub) return res.status(404).json({ error: 'Subject not found' });
  return res.json(sub);
});

// POST /api/subjects - Admin creates dynamic subject
router.post('/', requireAdmin, (req: AuthenticatedRequest, res) => {
  const { name, code, department } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Subject name is required' });
  }

  const cleanName = name.trim();
  const exists = db.subjects.some((s) => s.name.toLowerCase() === cleanName.toLowerCase());
  if (exists) {
    return res.status(400).json({ error: `Subject "${cleanName}" already exists` });
  }

  const generatedId = `sub-${cleanName.toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 6)}-${Date.now().toString(36).substring(2, 5)}`;
  const newSubject: Subject = {
    id: generatedId,
    school_id: 'SCH001',
    code: code ? code.trim().toUpperCase() : `${cleanName.substring(0, 3).toUpperCase()}101`,
    name: cleanName,
    department: department ? department.trim() : 'General',
    is_active: true,
    created_at: new Date().toISOString(),
  };

  db.subjects.push(newSubject);
  db.logAudit('CREATE', 'subject', newSubject.id, newSubject, req.user?.id);

  return res.status(201).json(newSubject);
});

// PUT /api/subjects/:id - Admin updates subject
router.put('/:id', requireAdmin, (req: AuthenticatedRequest, res) => {
  const idx = db.subjects.findIndex((s) => s.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Subject not found' });
  }

  const { name, code, department, is_active } = req.body;
  const existing = db.subjects[idx];

  const updated: Subject = {
    ...existing,
    name: name ? name.trim() : existing.name,
    code: code ? code.trim().toUpperCase() : existing.code,
    department: department !== undefined ? department.trim() : existing.department,
    is_active: is_active !== undefined ? Boolean(is_active) : existing.is_active,
  };

  db.subjects[idx] = updated;
  db.logAudit('UPDATE', 'subject', updated.id, updated, req.user?.id);

  return res.json(updated);
});

// DELETE /api/subjects/:id - Admin deactivates or removes subject
router.delete('/:id', requireAdmin, (req: AuthenticatedRequest, res) => {
  const subjectId = String(req.params.id);
  const idx = db.subjects.findIndex((s) => s.id === subjectId);
  if (idx === -1) {
    return res.status(404).json({ error: 'Subject not found' });
  }

  const sub = db.subjects[idx];
  // Check if assigned in teacher_assignments
  const isAssigned = db.teacher_assignments.some((ta) => ta.subject_id === sub.id && ta.is_active);
  if (isAssigned) {
    return res.status(400).json({ error: 'Cannot delete subject with active teacher assignments. Remove assignments first.' });
  }

  db.subjects.splice(idx, 1);
  db.logAudit('DELETE', 'subject', subjectId, sub, req.user?.id);

  return res.json({ message: 'Subject removed successfully', id: subjectId });
});

export default router;
