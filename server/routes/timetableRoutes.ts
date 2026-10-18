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
  const { section_id, class_id, subject_id, teacher_id, day_of_week, period_number, start_time, end_time, room, room_number } = req.body;

  let targetSectionId = section_id;
  if (!targetSectionId && class_id) {
    const defaultSec = db.sections.find((s) => s.class_id === class_id);
    if (defaultSec) targetSectionId = defaultSec.id;
  }

  if (!targetSectionId || !subject_id || !teacher_id) {
    return res.status(400).json({ error: 'Section, Subject, and Teacher are required to schedule a class period.' });
  }

  const sec = db.sections.find((s) => s.id === targetSectionId);
  if (!sec) return res.status(404).json({ error: 'Section not found' });

  const teacher = db.profiles.find((p) => p.id === teacher_id);
  if (!teacher) return res.status(404).json({ error: 'Teacher not found' });

  const sub = db.subjects.find((s) => s.id === subject_id);
  if (!sub) return res.status(404).json({ error: 'Subject not found' });

  const dayMap: Record<string, number> = {
    monday: 1, mon: 1, '1': 1,
    tuesday: 2, tue: 2, '2': 2,
    wednesday: 3, wed: 3, '3': 3,
    thursday: 4, thu: 4, '4': 4,
    friday: 5, fri: 5, '5': 5,
    saturday: 6, sat: 6, '6': 6,
  };

  const day = typeof day_of_week === 'string'
    ? (dayMap[day_of_week.toLowerCase()] || parseInt(day_of_week, 10) || 1)
    : (Number(day_of_week) || 1);

  let period = parseInt(period_number, 10);
  if (isNaN(period) || period < 1) {
    if (start_time?.startsWith('08')) period = 1;
    else if (start_time?.startsWith('09')) period = 2;
    else if (start_time?.startsWith('10')) period = 3;
    else if (start_time?.startsWith('11')) period = 4;
    else if (start_time?.startsWith('13')) period = 5;
    else if (start_time?.startsWith('14')) period = 6;
    else period = 1;
  }

  const defaultTimes: Record<number, { start: string; end: string }> = {
    1: { start: '08:30', end: '09:30' },
    2: { start: '09:30', end: '10:30' },
    3: { start: '10:45', end: '11:45' },
    4: { start: '11:45', end: '12:45' },
    5: { start: '13:30', end: '14:30' },
    6: { start: '14:30', end: '15:30' },
  };

  const finalStartTime = start_time || defaultTimes[period]?.start || '08:30';
  const finalEndTime = end_time || defaultTimes[period]?.end || '09:30';

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
    (t) => t.section_id === targetSectionId && t.day_of_week === day && t.period_number === period
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
    section_id: targetSectionId,
    subject_id,
    teacher_id,
    day_of_week: day,
    period_number: period,
    start_time: finalStartTime,
    end_time: finalEndTime,
    room: room || room_number || sec.room_number || 'Room 101',
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
