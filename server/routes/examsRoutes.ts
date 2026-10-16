import { Router } from 'express';
import { db, Exam, ExamSubject, MarkEntry } from '../db/store.js';
import { requireAdmin, requireTeacherScope, extractUser, AuthenticatedRequest } from '../middleware/authScope.js';

const router = Router();

// GET /api/exams - List all exams
router.get('/', (req, res) => {
  const { class_id } = req.query;
  let list = db.exams;
  if (class_id) {
    list = list.filter((e) => e.class_id === class_id);
  }

  const enriched = list.map((e) => {
    const cls = db.classes.find((c) => c.id === e.class_id);
    const subjects = db.exam_subjects.filter((es) => es.exam_id === e.id).map((es) => {
      const sub = db.subjects.find((s) => s.id === es.subject_id);
      return {
        ...es,
        subject_name: sub?.name,
      };
    });

    return {
      ...e,
      class_name: cls?.name,
      subjects,
    };
  });

  return res.json(enriched);
});

// GET /api/exams/:id - Detailed exam schedule
router.get('/:id', (req, res) => {
  const exam = db.exams.find((e) => e.id === req.params.id);
  if (!exam) return res.status(404).json({ error: 'Exam not found' });

  const cls = db.classes.find((c) => c.id === exam.class_id);
  const subjects = db.exam_subjects.filter((es) => es.exam_id === exam.id).map((es) => {
    const sub = db.subjects.find((s) => s.id === es.subject_id);
    return {
      ...es,
      subject_name: sub?.name,
    };
  });

  return res.json({
    ...exam,
    class_name: cls?.name,
    subjects,
  });
});

// POST /api/exams - Admin creates exam
router.post('/', requireAdmin, (req: AuthenticatedRequest, res) => {
  const { class_id, title, exam_type, start_date, end_date, subjects } = req.body;

  if (!class_id || !title || !exam_type || !start_date || !end_date) {
    return res.status(400).json({ error: 'class_id, title, exam_type, start_date, and end_date are required' });
  }

  const cls = db.classes.find((c) => c.id === class_id);
  if (!cls) return res.status(404).json({ error: 'Class not found' });

  const newExam: Exam = {
    id: `exam-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`,
    school_id: 'SCH001',
    class_id,
    title: title.trim(),
    exam_type,
    start_date,
    end_date,
    academic_year: '2025-2026',
    is_published: true,
    created_at: new Date().toISOString(),
  };

  db.exams.push(newExam);

  // If subjects schedule provided, add to exam_subjects
  if (Array.isArray(subjects)) {
    subjects.forEach((s: any) => {
      db.exam_subjects.push({
        id: `es-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`,
        exam_id: newExam.id,
        subject_id: s.subject_id,
        exam_date: s.exam_date || start_date,
        start_time: s.start_time || '09:30',
        duration_minutes: s.duration_minutes ? parseInt(s.duration_minutes, 10) : 60,
        max_marks: s.max_marks ? parseInt(s.max_marks, 10) : 100,
        passing_marks: s.passing_marks ? parseInt(s.passing_marks, 10) : 35,
      });
    });
  }

  db.logAudit('CREATE_EXAM', 'exams', newExam.id, { title, class: cls.name }, req.user?.id);

  return res.status(201).json(newExam);
});

// GET /api/exams/:id/marks - View marks with role isolation
router.get('/:id/marks', (req: AuthenticatedRequest, res) => {
  const user = extractUser(req);
  const examId = req.params.id;
  const { section_id, subject_id, student_id } = req.query;

  let markRecords = db.marks.filter((m) => m.exam_id === examId);

  // 1. Role-based isolation
  if (user?.role === 'parent') {
    const myChildren = db.getParentChildren(user.id).map((c) => c.id);
    markRecords = markRecords.filter((m) => myChildren.includes(m.student_id));
  } else if (user?.role === 'student') {
    markRecords = markRecords.filter((m) => m.student_id === user.id);
  } else if (user?.role === 'teacher') {
    const authorized = db.getTeacherAuthorizedSections(user.id);
    const authMap = new Map(authorized.map((a) => [a.section_id, a]));

    markRecords = markRecords.filter((m) => {
      const student = db.profiles.find((p) => p.id === m.student_id);
      if (!student?.section_id) return false;
      const auth = authMap.get(student.section_id);
      if (!auth) return false;
      if (auth.is_mentor) return true;
      return auth.subjects.includes(m.subject_id);
    });
  }

  // 2. Query filters
  if (section_id) {
    markRecords = markRecords.filter((m) => {
      const student = db.profiles.find((p) => p.id === m.student_id);
      return student?.section_id === section_id;
    });
  }

  if (subject_id) {
    markRecords = markRecords.filter((m) => m.subject_id === subject_id);
  }

  if (student_id) {
    markRecords = markRecords.filter((m) => m.student_id === student_id);
  }

  const enriched = markRecords.map((m) => {
    const student = db.profiles.find((p) => p.id === m.student_id);
    const sub = db.subjects.find((s) => s.id === m.subject_id);
    const sec = student?.section_id ? db.sections.find((s) => s.id === student.section_id) : undefined;

    return {
      ...m,
      student_name: student?.full_name,
      student_id_number: student?.id_number || student?.user_id,
      class_id: student?.class_id,
      section_id: student?.section_id,
      section_name: sec?.full_name,
      subject_name: sub?.name,
    };
  });

  return res.json(enriched);
});

// POST /api/exams/:id/marks - Teacher enters marks (enforces requireTeacherScope)
router.post('/:id/marks', requireTeacherScope, (req: AuthenticatedRequest, res) => {
  const examId = String(req.params.id);
  const { subject_id, section_id, entries, publish_notifications } = req.body;

  if (!subject_id || !section_id || !Array.isArray(entries)) {
    return res.status(400).json({ error: 'subject_id, section_id, and entries array are required' });
  }

  const exam = db.exams.find((e) => e.id === examId);
  if (!exam) return res.status(404).json({ error: 'Exam not found' });

  const sub = db.subjects.find((s) => s.id === subject_id);
  const sec = db.sections.find((s) => s.id === section_id);
  const enteredBy = req.user?.id || 'tch-primary-001';

  const savedMarks: MarkEntry[] = [];

  entries.forEach((entry: { student_id: string; marks_obtained: number; max_marks?: number; remarks?: string }) => {
    const maxMarks = entry.max_marks || 50;
    const marksObtained = parseFloat(entry.marks_obtained as any);
    const percentage = Math.round((marksObtained / maxMarks) * 100);

    let grade = 'D';
    if (percentage >= 90) grade = 'A+';
    else if (percentage >= 80) grade = 'A';
    else if (percentage >= 70) grade = 'B';
    else if (percentage >= 60) grade = 'C';

    const existingIdx = db.marks.findIndex(
      (m) => m.exam_id === examId && m.subject_id === subject_id && m.student_id === entry.student_id
    );

    const markRecord: MarkEntry = {
      id: existingIdx >= 0 ? db.marks[existingIdx].id : `mrk-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`,
      school_id: 'SCH001',
      exam_id: examId,
      subject_id,
      student_id: entry.student_id,
      marks_obtained: marksObtained,
      max_marks: maxMarks,
      percentage,
      grade,
      remarks: entry.remarks,
      entered_by: enteredBy,
      entered_at: new Date().toISOString(),
    };

    if (existingIdx >= 0) {
      db.marks[existingIdx] = markRecord;
    } else {
      db.marks.push(markRecord);
    }

    savedMarks.push(markRecord);

    // If publishing, send notifications to student & parent
    if (publish_notifications) {
      const student = db.profiles.find((p) => p.id === entry.student_id);
      db.notifyUser(
        entry.student_id,
        `Exam Marks Published: ${exam.title}`,
        `You scored ${marksObtained}/${maxMarks} (${percentage}% - Grade ${grade}) in ${sub?.name || 'Subject'}.`,
        'marks',
        '/student/progress'
      );

      const parentMappings = db.parent_students.filter((ps) => ps.student_id === entry.student_id);
      parentMappings.forEach((pm) => {
        db.notifyUser(
          pm.parent_id,
          `Exam Results: ${student?.full_name}`,
          `Your child scored ${marksObtained}/${maxMarks} (${percentage}% - Grade ${grade}) in ${sub?.name} for ${exam.title}.`,
          'marks',
          '/parent/marks'
        );
      });
    }
  });

  db.logAudit('ENTER_MARKS', 'marks', examId, {
    exam: exam.title,
    subject: sub?.name,
    section: sec?.full_name,
    count: savedMarks.length,
  }, req.user?.id);

  return res.json({
    message: `Marks recorded successfully for ${savedMarks.length} students in ${sub?.name}.`,
    marks: savedMarks,
  });
});

export default router;
