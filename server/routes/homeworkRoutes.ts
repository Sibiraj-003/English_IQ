import { Router } from 'express';
import { db, Homework, HomeworkSubmission } from '../db/store.js';
import { requireTeacherScope, extractUser, AuthenticatedRequest } from '../middleware/authScope.js';

const router = Router();

// GET /api/homework - Query homework with role isolation
router.get('/', (req: AuthenticatedRequest, res) => {
  const user = extractUser(req);
  const { section_id, subject_id, student_id } = req.query;

  let items = db.homework;

  // 1. Role-based isolation
  if (user?.role === 'parent') {
    const childrenSections = db.getParentChildren(user.id).map((c) => c.section_id).filter(Boolean);
    items = items.filter((h) => childrenSections.includes(h.section_id));
  } else if (user?.role === 'student') {
    if (user.section_id) {
      items = items.filter((h) => h.section_id === user.section_id);
    }
  } else if (user?.role === 'teacher') {
    const authorized = db.getTeacherAuthorizedSections(user.id);
    const authMap = new Map(authorized.map((a) => [a.section_id, a]));
    items = items.filter((h) => {
      const auth = authMap.get(h.section_id);
      if (!auth) return false;
      if (auth.is_mentor) return true;
      return auth.subjects.includes(h.subject_id);
    });
  }

  // 2. Query filters
  if (section_id) {
    items = items.filter((h) => h.section_id === section_id);
  }
  if (subject_id) {
    items = items.filter((h) => h.subject_id === subject_id);
  }

  const enriched = items.map((hw) => {
    const cls = db.classes.find((c) => c.id === hw.class_id);
    const sec = db.sections.find((s) => s.id === hw.section_id);
    const sub = db.subjects.find((s) => s.id === hw.subject_id);
    const teacher = db.profiles.find((p) => p.id === hw.teacher_id);
    const submissions = db.homework_submissions.filter((s) => s.homework_id === hw.id);
    const totalStudents = db.profiles.filter((p) => p.role === 'student' && p.section_id === hw.section_id).length;

    // Attach student's submission if student_id requested
    const targetStudentId = (student_id as string) || (user?.role === 'student' ? user.id : undefined);
    const mySub = targetStudentId ? submissions.find((s) => s.student_id === targetStudentId) : undefined;

    return {
      ...hw,
      class_name: cls?.name,
      section_name: sec?.full_name,
      subject_name: sub?.name,
      teacher_name: teacher?.full_name,
      submissions_count: submissions.length,
      total_students: totalStudents || 1,
      my_submission: mySub,
    };
  });

  return res.json(enriched);
});

// GET /api/homework/:id - Single homework item with submissions
router.get('/:id', (req: AuthenticatedRequest, res) => {
  const user = extractUser(req);
  const hw = db.homework.find((h) => h.id === req.params.id);
  if (!hw) return res.status(404).json({ error: 'Homework not found' });

  const cls = db.classes.find((c) => c.id === hw.class_id);
  const sec = db.sections.find((s) => s.id === hw.section_id);
  const sub = db.subjects.find((s) => s.id === hw.subject_id);
  const teacher = db.profiles.find((p) => p.id === hw.teacher_id);
  const submissions = db.homework_submissions.filter((s) => s.homework_id === hw.id).map((s) => {
    const st = db.profiles.find((p) => p.id === s.student_id);
    return {
      ...s,
      student_name: st?.full_name,
      student_id_number: st?.id_number || st?.user_id,
    };
  });

  return res.json({
    ...hw,
    class_name: cls?.name,
    section_name: sec?.full_name,
    subject_name: sub?.name,
    teacher_name: teacher?.full_name,
    submissions,
  });
});

// POST /api/homework - Teacher creates homework (enforces requireTeacherScope)
router.post('/', requireTeacherScope, (req: AuthenticatedRequest, res) => {
  const { section_id, subject_id, title, description, due_date, max_marks, attachments } = req.body;

  if (!section_id || !subject_id || !title || !description || !due_date) {
    return res.status(400).json({ error: 'section_id, subject_id, title, description, and due_date are required' });
  }

  const sec = db.sections.find((s) => s.id === section_id);
  if (!sec) return res.status(404).json({ error: 'Section not found' });

  const sub = db.subjects.find((s) => s.id === subject_id);
  if (!sub) return res.status(404).json({ error: 'Subject not found' });

  const teacherId = req.user?.id || 'tch-primary-001';

  const newHomework: Homework = {
    id: `hw-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`,
    school_id: 'SCH001',
    class_id: sec.class_id,
    section_id,
    subject_id,
    teacher_id: teacherId,
    title: title.trim(),
    description: description.trim(),
    due_date,
    max_marks: max_marks ? parseInt(max_marks, 10) : 10,
    attachments: attachments || [],
    created_at: new Date().toISOString(),
  };

  db.homework.push(newHomework);

  // Automatically notify all students and parents in this section!
  db.notifySection(
    section_id,
    `New Homework: ${sub.name}`,
    `Teacher posted: "${title}". Due on ${new Date(due_date).toLocaleDateString()}.`,
    'homework',
    '/student/homework'
  );

  db.logAudit('CREATE_HOMEWORK', 'homework', newHomework.id, { title, section: sec.full_name, subject: sub.name }, req.user?.id);

  return res.status(201).json(newHomework);
});

// POST /api/homework/:id/submit - Student submits homework
router.post('/:id/submit', (req: AuthenticatedRequest, res) => {
  const user = extractUser(req);
  const hw = db.homework.find((h) => h.id === req.params.id);
  if (!hw) return res.status(404).json({ error: 'Homework not found' });

  const studentId = user?.id || req.body.student_id;
  if (!studentId) return res.status(400).json({ error: 'student_id required' });

  const { content, attachments } = req.body;

  const existingIdx = db.homework_submissions.findIndex(
    (s) => s.homework_id === hw.id && s.student_id === studentId
  );

  const submission: HomeworkSubmission = {
    id: existingIdx >= 0 ? db.homework_submissions[existingIdx].id : `hws-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`,
    homework_id: hw.id,
    student_id: studentId,
    content: content || '',
    attachments: attachments || [],
    submitted_at: new Date().toISOString(),
    status: 'submitted',
  };

  if (existingIdx >= 0) {
    db.homework_submissions[existingIdx] = submission;
  } else {
    db.homework_submissions.push(submission);
  }

  // Notify the assigning teacher
  const student = db.profiles.find((p) => p.id === studentId);
  db.notifyUser(
    hw.teacher_id,
    'Homework Submission Received',
    `${student?.full_name || 'A student'} submitted homework for "${hw.title}".`,
    'homework',
    `/teacher/homework/${hw.id}`
  );

  return res.json({ message: 'Homework submitted successfully', submission });
});

// POST /api/homework/submissions/:id/evaluate - Teacher grades submission
router.post('/submissions/:id/evaluate', (req: AuthenticatedRequest, res) => {
  const subIdx = db.homework_submissions.findIndex((s) => s.id === req.params.id);
  if (subIdx === -1) {
    return res.status(404).json({ error: 'Submission not found' });
  }

  const { marks_obtained, feedback } = req.body;
  if (marks_obtained === undefined) {
    return res.status(400).json({ error: 'marks_obtained is required' });
  }

  const submission = db.homework_submissions[subIdx];
  const hw = db.homework.find((h) => h.id === submission.homework_id);

  submission.marks_obtained = parseFloat(marks_obtained);
  submission.feedback = feedback || 'Evaluated';
  submission.status = 'evaluated';
  submission.evaluated_by = req.user?.id || 'tch-primary-001';
  submission.evaluated_at = new Date().toISOString();

  // Notify the student and parent of the evaluated grade
  const student = db.profiles.find((p) => p.id === submission.student_id);
  const parentMappings = db.parent_students.filter((ps) => ps.student_id === submission.student_id);

  db.notifyUser(
    submission.student_id,
    'Homework Evaluated',
    `Your homework for "${hw?.title || 'Assignment'}" has been evaluated: ${submission.marks_obtained}/${hw?.max_marks || 10} marks. Feedback: "${submission.feedback}".`,
    'marks',
    '/student/homework'
  );

  parentMappings.forEach((pm) => {
    db.notifyUser(
      pm.parent_id,
      `Homework Result: ${student?.full_name}`,
      `Your child scored ${submission.marks_obtained}/${hw?.max_marks || 10} on "${hw?.title}". Feedback: "${submission.feedback}".`,
      'marks',
      '/parent/homework'
    );
  });

  return res.json({ message: 'Submission evaluated successfully', submission });
});

export default router;
