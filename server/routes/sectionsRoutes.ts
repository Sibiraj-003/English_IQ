import { Router } from 'express';
import { db, Section } from '../db/store.js';
import { requireAdmin, requireTeacherScope, AuthenticatedRequest } from '../middleware/authScope.js';

const router = Router();

// GET /api/sections - List sections with optional class_id or teacher_id filters
router.get('/', (req: AuthenticatedRequest, res) => {
  const { class_id, teacher_id } = req.query;

  let sections = db.sections;

  if (class_id) {
    sections = sections.filter((s) => s.class_id === class_id);
  }

  // If filtered for a specific teacher, return only assigned sections or where they are mentor
  if (teacher_id) {
    const authorized = db.getTeacherAuthorizedSections(teacher_id as string);
    const authSet = new Set(authorized.map((a) => a.section_id));
    sections = sections.filter((s) => authSet.has(s.id));
  }

  const enriched = sections.map((sec) => {
    const cls = db.classes.find((c) => c.id === sec.class_id);
    const mentor = sec.mentor_id ? db.profiles.find((p) => p.id === sec.mentor_id) : undefined;
    const students = db.profiles.filter((p) => p.role === 'student' && p.section_id === sec.id);

    return {
      ...sec,
      class_name: cls?.name || 'Unknown Class',
      mentor_name: mentor?.full_name,
      mentor_email: mentor?.email,
      students_count: students.length,
    };
  });

  return res.json(enriched);
});

// GET /api/sections/:id - Detailed section information
router.get('/:id', (req, res) => {
  const sec = db.sections.find((s) => s.id === req.params.id);
  if (!sec) {
    return res.status(404).json({ error: 'Section not found' });
  }

  const cls = db.classes.find((c) => c.id === sec.class_id);
  const mentor = sec.mentor_id ? db.profiles.find((p) => p.id === sec.mentor_id) : undefined;
  const students = db.profiles.filter((p) => p.role === 'student' && p.section_id === sec.id);
  const assignments = db.teacher_assignments.filter((ta) => ta.section_id === sec.id && ta.is_active);

  const teacherList = assignments.map((ta) => {
    const teacher = db.profiles.find((p) => p.id === ta.teacher_id);
    const subject = db.subjects.find((s) => s.id === ta.subject_id);
    return {
      assignment_id: ta.id,
      teacher_id: ta.teacher_id,
      teacher_name: teacher?.full_name,
      teacher_email: teacher?.email,
      subject_id: ta.subject_id,
      subject_name: subject?.name,
    };
  });

  return res.json({
    ...sec,
    class_name: cls?.name,
    grade: cls?.grade,
    mentor_name: mentor?.full_name,
    mentor_email: mentor?.email,
    students,
    teachers: teacherList,
  });
});

// POST /api/sections - Admin creates a new dynamic section
router.post('/', requireAdmin, (req: AuthenticatedRequest, res) => {
  const { class_id, name, room_number, capacity } = req.body;

  if (!class_id || !name) {
    return res.status(400).json({ error: 'class_id and section name (e.g. A, B, C) are required' });
  }

  const cls = db.classes.find((c) => c.id === class_id);
  if (!cls) {
    return res.status(404).json({ error: 'Class not found' });
  }

  const cleanName = name.trim().toUpperCase();
  const exists = db.sections.some((s) => s.class_id === class_id && s.name === cleanName);
  if (exists) {
    return res.status(400).json({ error: `Section ${cleanName} already exists in ${cls.name}` });
  }

  const newSection: Section = {
    id: `SEC-${cls.grade}${cleanName}-${Date.now().toString(36).substring(2, 5)}`,
    school_id: 'SCH001',
    class_id,
    name: cleanName,
    full_name: `${cls.grade}-${cleanName}`,
    room_number: room_number || `Room ${cls.grade}0${cleanName.charCodeAt(0) - 64}`,
    capacity: capacity ? parseInt(capacity, 10) : 35,
    is_active: true,
    created_at: new Date().toISOString(),
  };

  db.sections.push(newSection);
  db.logAudit('CREATE', 'section', newSection.id, newSection, req.user?.id);

  return res.status(201).json(newSection);
});

// PUT /api/sections/:id - Admin updates section
router.put('/:id', requireAdmin, (req: AuthenticatedRequest, res) => {
  const idx = db.sections.findIndex((s) => s.id === req.params.id);
  if (idx === -1) {
    return res.status(404).json({ error: 'Section not found' });
  }

  const { name, room_number, capacity, is_active } = req.body;
  const existing = db.sections[idx];

  const updated: Section = {
    ...existing,
    name: name ? name.trim().toUpperCase() : existing.name,
    room_number: room_number !== undefined ? room_number : existing.room_number,
    capacity: capacity !== undefined ? parseInt(capacity, 10) : existing.capacity,
    is_active: is_active !== undefined ? Boolean(is_active) : existing.is_active,
  };

  db.sections[idx] = updated;
  db.logAudit('UPDATE', 'section', updated.id, updated, req.user?.id);

  return res.json(updated);
});

// POST /api/sections/:id/mentor - Admin assigns Section Mentor / Class Teacher
router.post('/:id/mentor', requireAdmin, (req: AuthenticatedRequest, res) => {
  const sec = db.sections.find((s) => s.id === req.params.id);
  if (!sec) {
    return res.status(404).json({ error: 'Section not found' });
  }

  const { teacher_id } = req.body;
  if (!teacher_id) {
    return res.status(400).json({ error: 'teacher_id is required' });
  }

  const teacher = db.profiles.find((p) => p.id === teacher_id && p.role === 'teacher');
  if (!teacher) {
    return res.status(404).json({ error: 'Teacher profile not found' });
  }

  sec.mentor_id = teacher.id;
  sec.mentor_name = teacher.full_name;

  // Update or insert in section_mentors
  const mentorIdx = db.section_mentors.findIndex((sm) => sm.section_id === sec.id);
  if (mentorIdx >= 0) {
    db.section_mentors[mentorIdx].teacher_id = teacher.id;
  } else {
    db.section_mentors.push({
      id: `men-${Date.now()}`,
      school_id: 'SCH001',
      section_id: sec.id,
      teacher_id: teacher.id,
      academic_year: '2025-2026',
      assigned_at: new Date().toISOString(),
    });
  }

  db.logAudit('ASSIGN_MENTOR', 'section', sec.id, { mentor_id: teacher.id, teacher_name: teacher.full_name }, req.user?.id);
  db.notifyUser(teacher.id, 'Assigned as Section Mentor', `You have been appointed as the Section Mentor for ${sec.full_name}.`, 'announcement');

  return res.json({ message: 'Mentor assigned successfully', section: sec });
});

// POST /api/sections/:id/transfer-student - Admin transfers student between sections
router.post('/:id/transfer-student', requireAdmin, (req: AuthenticatedRequest, res) => {
  const targetSection = db.sections.find((s) => s.id === req.params.id);
  if (!targetSection) {
    return res.status(404).json({ error: 'Target section not found' });
  }

  const { student_id } = req.body;
  const student = db.profiles.find((p) => p.id === student_id && p.role === 'student');
  if (!student) {
    return res.status(404).json({ error: 'Student not found' });
  }

  const oldSectionId = student.section_id;
  student.class_id = targetSection.class_id;
  student.class_name = db.classes.find((c) => c.id === targetSection.class_id)?.name;
  student.section_id = targetSection.id;
  student.section_name = targetSection.full_name;

  db.logAudit('TRANSFER_STUDENT', 'student', student.id, { from_section: oldSectionId, to_section: targetSection.id }, req.user?.id);
  db.notifyUser(student.id, 'Section Transfer Notice', `You have been transferred to Section ${targetSection.full_name}.`, 'general');

  return res.json({ message: 'Student transferred successfully', student });
});

// DELETE /api/sections/:id - Admin deletes section
router.delete('/:id', requireAdmin, (req: AuthenticatedRequest, res) => {
  const sectionId = String(req.params.id);
  const idx = db.sections.findIndex((s) => s.id === sectionId);
  if (idx === -1) {
    return res.status(404).json({ error: 'Section not found' });
  }

  const sec = db.sections[idx];
  // Check if students are enrolled
  const hasStudents = db.profiles.some((p) => p.section_id === sec.id);
  if (hasStudents) {
    return res.status(400).json({ error: 'Cannot delete section with actively enrolled students. Reassign students first.' });
  }

  db.sections.splice(idx, 1);
  db.logAudit('DELETE', 'section', sectionId, sec, req.user?.id);

  return res.json({ message: 'Section deleted successfully', id: sectionId });
});

export default router;
