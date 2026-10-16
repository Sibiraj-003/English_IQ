import { Router } from 'express';
import { db, AttendanceRecord } from '../db/store.js';
import { requireTeacherScope, requireParentScope, extractUser, AuthenticatedRequest } from '../middleware/authScope.js';

const router = Router();

// GET /api/attendance - Query attendance records with role isolation
router.get('/', (req: AuthenticatedRequest, res) => {
  const user = extractUser(req);
  const { section_id, date, student_id } = req.query;

  let records = db.attendance;

  // 1. Role-based isolation
  if (user?.role === 'parent') {
    const myChildren = db.getParentChildren(user.id).map((c) => c.id);
    records = records.filter((r) => myChildren.includes(r.student_id));
  } else if (user?.role === 'student') {
    records = records.filter((r) => r.student_id === user.id);
  } else if (user?.role === 'teacher') {
    // Teacher must only see assigned sections or mentored sections
    const authorizedSections = new Set(
      db.getTeacherAuthorizedSections(user.id).map((a) => a.section_id)
    );
    records = records.filter((r) => authorizedSections.has(r.section_id));
  }

  // 2. Query filters
  if (section_id) {
    // If teacher provided a section_id, verify access
    if (user?.role === 'teacher') {
      const allowed = db.canTeacherAccess(user.id, section_id as string);
      if (!allowed) {
        return res.status(403).json({ error: '403 Forbidden', message: 'You are not authorized to view attendance for this section.' });
      }
    }
    records = records.filter((r) => r.section_id === section_id);
  }

  if (date) {
    records = records.filter((r) => r.date === date);
  }

  if (student_id) {
    if (user?.role === 'parent' && !db.isChildOfParent(user.id, student_id as string)) {
      return res.status(403).json({ error: '403 Forbidden', message: 'You can only view attendance for your own children.' });
    }
    records = records.filter((r) => r.student_id === student_id);
  }

  const enriched = records.map((r) => {
    const student = db.profiles.find((p) => p.id === r.student_id);
    const sec = db.sections.find((s) => s.id === r.section_id);
    const marker = r.marked_by ? db.profiles.find((p) => p.id === r.marked_by) : undefined;

    return {
      ...r,
      student_name: student?.full_name || 'Enrolled Student',
      student_id_number: student?.id_number || student?.user_id,
      section_name: sec?.full_name || r.section_id,
      marked_by_name: marker?.full_name || 'Class Teacher',
    };
  });

  return res.json(enriched);
});

// GET /api/attendance/summary/:student_id - Attendance statistics
router.get('/summary/:student_id', (req: AuthenticatedRequest, res) => {
  const user = extractUser(req);
  const studentId = String(req.params.student_id);

  if (user?.role === 'parent' && !db.isChildOfParent(user.id, studentId)) {
    return res.status(403).json({ error: '403 Forbidden', message: 'Unauthorized access to student record' });
  }

  const studentRecords = db.attendance.filter((r) => r.student_id === studentId);
  const totalDays = studentRecords.length;
  const presentCount = studentRecords.filter((r) => r.status === 'present').length;
  const absentCount = studentRecords.filter((r) => r.status === 'absent').length;
  const lateCount = studentRecords.filter((r) => r.status === 'late').length;
  const leaveCount = studentRecords.filter((r) => r.status === 'leave').length;

  const percentage = totalDays > 0 ? Math.round(((presentCount + lateCount) / totalDays) * 100) : 100;

  return res.json({
    student_id: studentId,
    total_days: totalDays,
    present_count: presentCount,
    absent_count: absentCount,
    late_count: lateCount,
    leave_count: leaveCount,
    percentage,
  });
});

// POST /api/attendance/mark - Teacher marks attendance for a section on a given date
router.post('/mark', requireTeacherScope, (req: AuthenticatedRequest, res) => {
  const { section_id, date, entries } = req.body;

  if (!section_id || !date || !Array.isArray(entries)) {
    return res.status(400).json({ error: 'section_id, date (YYYY-MM-DD), and entries array are required' });
  }

  const sec = db.sections.find((s) => s.id === section_id);
  if (!sec) {
    return res.status(404).json({ error: 'Section not found' });
  }

  const markedBy = req.user?.id || 'tch-primary-001';
  const savedRecords: AttendanceRecord[] = [];

  entries.forEach((entry: { student_id: string; status: 'present' | 'absent' | 'late' | 'leave'; remarks?: string }) => {
    // Check if record already exists for this student on this date
    const existingIdx = db.attendance.findIndex(
      (a) => a.student_id === entry.student_id && a.date === date
    );

    const record: AttendanceRecord = {
      id: existingIdx >= 0 ? db.attendance[existingIdx].id : `att-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`,
      school_id: 'SCH001',
      class_id: sec.class_id,
      section_id,
      student_id: entry.student_id,
      date,
      status: entry.status,
      remarks: entry.remarks,
      marked_by: markedBy,
      created_at: new Date().toISOString(),
    };

    if (existingIdx >= 0) {
      db.attendance[existingIdx] = record;
    } else {
      db.attendance.push(record);
    }

    savedRecords.push(record);

    // If absent or late, notify the parent automatically!
    if (entry.status === 'absent' || entry.status === 'late') {
      const student = db.profiles.find((p) => p.id === entry.student_id);
      const parentMappings = db.parent_students.filter((ps) => ps.student_id === entry.student_id);

      parentMappings.forEach((pm) => {
        db.notifyUser(
          pm.parent_id,
          `Attendance Alert: ${student?.full_name || 'Child'} is Marked ${entry.status.toUpperCase()}`,
          `Your child was marked ${entry.status} for class on ${date}.${entry.remarks ? ` Note: ${entry.remarks}` : ''}`,
          'attendance',
          '/parent/attendance'
        );
      });
    }
  });

  db.logAudit('MARK_ATTENDANCE', 'attendance', section_id, { date, count: savedRecords.length }, req.user?.id);

  return res.json({
    message: `Attendance marked successfully for ${savedRecords.length} students on ${date}`,
    records: savedRecords,
  });
});

export default router;
