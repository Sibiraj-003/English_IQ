import { Router } from 'express';
import { db, TeacherAssignment } from '../db/store.js';
import { requireAdmin, AuthenticatedRequest } from '../middleware/authScope.js';

const router = Router();

// GET /api/teacher-assignments - List teacher assignments with optional filters
router.get('/', (req, res) => {
  const { teacher_id, section_id, class_id, subject_id } = req.query;

  let assignments = db.teacher_assignments;

  if (teacher_id) assignments = assignments.filter((a) => a.teacher_id === teacher_id);
  if (section_id) assignments = assignments.filter((a) => a.section_id === section_id);
  if (class_id) assignments = assignments.filter((a) => a.class_id === class_id);
  if (subject_id) assignments = assignments.filter((a) => a.subject_id === subject_id);

  const enriched = assignments.map((a) => {
    const teacher = db.profiles.find((p) => p.id === a.teacher_id);
    const cls = db.classes.find((c) => c.id === a.class_id);
    const sec = db.sections.find((s) => s.id === a.section_id);
    const sub = db.subjects.find((s) => s.id === a.subject_id);

    return {
      ...a,
      teacher_name: teacher?.full_name || 'Unknown Teacher',
      teacher_email: teacher?.email,
      class_name: cls?.name,
      section_name: sec?.full_name,
      subject_name: sub?.name,
    };
  });

  return res.json(enriched);
});

// POST /api/teacher-assignments - Admin assigns a teacher to Section + Subject
router.post('/', requireAdmin, (req: AuthenticatedRequest, res) => {
  const { teacher_id, section_id, subject_id } = req.body;

  if (!teacher_id || !section_id || !subject_id) {
    return res.status(400).json({ error: 'teacher_id, section_id, and subject_id are required' });
  }

  const teacher = db.profiles.find((p) => p.id === teacher_id && p.role === 'teacher');
  if (!teacher) return res.status(404).json({ error: 'Teacher not found' });

  const section = db.sections.find((s) => s.id === section_id);
  if (!section) return res.status(404).json({ error: 'Section not found' });

  const subject = db.subjects.find((s) => s.id === subject_id);
  if (!subject) return res.status(404).json({ error: 'Subject not found' });

  // Check if this exact assignment already exists
  const existingIdx = db.teacher_assignments.findIndex(
    (ta) => ta.teacher_id === teacher_id && ta.section_id === section_id && ta.subject_id === subject_id
  );

  if (existingIdx >= 0) {
    db.teacher_assignments[existingIdx].is_active = true;
    return res.json(db.teacher_assignments[existingIdx]);
  }

  const newAssignment: TeacherAssignment = {
    id: `ta-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`,
    school_id: 'SCH001',
    teacher_id,
    class_id: section.class_id,
    section_id,
    subject_id,
    is_active: true,
    created_at: new Date().toISOString(),
  };

  db.teacher_assignments.push(newAssignment);
  db.logAudit('ASSIGN_TEACHER', 'teacher_assignments', newAssignment.id, {
    teacher: teacher.full_name,
    section: section.full_name,
    subject: subject.name,
  }, req.user?.id);

  db.notifyUser(teacher.id, 'New Academic Assignment', `You have been assigned to teach ${subject.name} for Section ${section.full_name}.`, 'announcement');

  return res.status(201).json(newAssignment);
});

// DELETE /api/teacher-assignments/:id - Admin removes assignment
router.delete('/:id', requireAdmin, (req: AuthenticatedRequest, res) => {
  const assignmentId = String(req.params.id);
  const idx = db.teacher_assignments.findIndex((a) => a.id === assignmentId);
  if (idx === -1) {
    return res.status(404).json({ error: 'Assignment not found' });
  }

  const removed = db.teacher_assignments.splice(idx, 1)[0];
  db.logAudit('REMOVE_TEACHER_ASSIGNMENT', 'teacher_assignments', assignmentId, removed, req.user?.id);

  return res.json({ message: 'Teacher assignment removed successfully', id: assignmentId });
});

export default router;
