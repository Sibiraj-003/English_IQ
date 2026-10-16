import { Router } from 'express';
import { db, TimetableSlot } from '../db/store.js';
import { requireAdmin, extractUser, AuthenticatedRequest } from '../middleware/authScope.js';

const router = Router();

// GET /api/timetables - Query timetable slots
router.get('/', (req: AuthenticatedRequest, res) => {
  const user = extractUser(req);
  const { section_id, teacher_id, class_id, student_id } = req.query;

  let slots = db.timetables;

  if (section_id) {
    slots = slots.filter((t) => t.section_id === section_id);
  } else if (teacher_id) {
    slots = slots.filter((t) => t.teacher_id === teacher_id);
  } else if (class_id) {
    slots = slots.filter((t) => t.class_id === class_id);
  } else if (student_id) {
    const student = db.profiles.find((p) => p.id === student_id);
    if (student?.section_id) {
      slots = slots.filter((t) => t.section_id === student.section_id);
    }
  } else if (user?.role === 'teacher') {
    slots = slots.filter((t) => t.teacher_id === user.id);
  } else if (user?.role === 'student') {
    if (user.section_id) {
      slots = slots.filter((t) => t.section_id === user.section_id);
    }
  } else if (user?.role === 'parent') {
    const myChildren = db.getParentChildren(user.id);
    const childSections = myChildren.map((c) => c.section_id).filter(Boolean);
    slots = slots.filter((t) => childSections.includes(t.section_id));
  }

  const enriched = slots.map((s) => {
    const cls = db.classes.find((c) => c.id === s.class_id);
    const sec = db.sections.find((sec) => sec.id === s.section_id);
    const sub = db.subjects.find((sub) => sub.id === s.subject_id);
    const teacher = db.profiles.find((p) => p.id === s.teacher_id);

    return {
      ...s,
      class_name: cls?.name,
      section_name: sec?.full_name,
      subject_name: sub?.name,
      teacher_name: teacher?.full_name,
    };
  });

  return res.json(enriched);
});

// POST /api/timetables - Admin creates a timetable period with conflict prevention
router.post('/', requireAdmin, (req: AuthenticatedRequest, res) => {
  const { section_id, subject_id, teacher_id, day_of_week, period_number, start_time, end_time, room } = req.body;

  if (!section_id || !subject_id || !teacher_id || day_of_week === undefined || period_number === undefined || !start_time || !end_time) {
    return res.status(400).json({ error: 'section_id, subject_id, teacher_id, day_of_week (1-6), period_number (1-8), start_time, and end_time are required' });
  }

  const sec = db.sections.find((s) => s.id === section_id);
  if (!sec) return res.status(404).json({ error: 'Section not found' });

  const teacher = db.profiles.find((p) => p.id === teacher_id);
  if (!teacher) return res.status(404).json({ error: 'Teacher not found' });

  const sub = db.subjects.find((s) => s.id === subject_id);
  if (!sub) return res.status(404).json({ error: 'Subject not found' });

  const day = parseInt(day_of_week, 10);
  const period = parseInt(period_number, 10);

  // 1. Conflict Check: Teacher cannot be in two sections at the same day & period
  const teacherConflict = db.timetables.find(
    (t) => t.teacher_id === teacher_id && t.day_of_week === day && t.period_number === period
  );
  if (teacherConflict) {
    const conflictSec = db.sections.find((s) => s.id === teacherConflict.section_id);
    return res.status(409).json({
      error: 'Teacher Schedule Conflict',
      message: `Teacher ${teacher.full_name} is already assigned to Section ${conflictSec?.full_name || teacherConflict.section_id} on Day ${day}, Period ${period}.`,
    });
  }

  // 2. Conflict Check: Section cannot have two subjects at the same day & period
  const sectionConflict = db.timetables.find(
    (t) => t.section_id === section_id && t.day_of_week === day && t.period_number === period
  );
  if (sectionConflict) {
    const conflictSub = db.subjects.find((s) => s.id === sectionConflict.subject_id);
    return res.status(409).json({
      error: 'Section Schedule Conflict',
      message: `Section ${sec.full_name} already has ${conflictSub?.name || 'a subject'} scheduled on Day ${day}, Period ${period}.`,
    });
  }

  const newSlot: TimetableSlot = {
    id: `tt-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`,
    school_id: 'SCH001',
    class_id: sec.class_id,
    section_id,
    subject_id,
    teacher_id,
    day_of_week: day,
    period_number: period,
    start_time,
    end_time,
    room: room || sec.room_number || 'Room 101',
  };

  db.timetables.push(newSlot);
  db.logAudit('CREATE_TIMETABLE_SLOT', 'timetables', newSlot.id, {
    section: sec.full_name,
    teacher: teacher.full_name,
    subject: sub.name,
    day,
    period,
  }, req.user?.id);

  return res.status(201).json(newSlot);
});

// DELETE /api/timetables/:id - Admin removes a timetable slot
router.delete('/:id', requireAdmin, (req: AuthenticatedRequest, res) => {
  const slotId = String(req.params.id);
  const idx = db.timetables.findIndex((t) => t.id === slotId);
  if (idx === -1) {
    return res.status(404).json({ error: 'Timetable slot not found' });
  }

  const removed = db.timetables.splice(idx, 1)[0];
  db.logAudit('DELETE_TIMETABLE_SLOT', 'timetables', slotId, removed, req.user?.id);

  return res.json({ message: 'Timetable slot removed successfully', id: slotId });
});

export default router;
