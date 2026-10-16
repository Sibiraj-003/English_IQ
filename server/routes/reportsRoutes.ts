import { Router } from 'express';
import { db } from '../db/store.js';
import { extractUser, AuthenticatedRequest } from '../middleware/authScope.js';

const router = Router();

// GET /api/reports/student/:student_id - Comprehensive Student Report Card
router.get('/student/:student_id', (req: AuthenticatedRequest, res) => {
  const user = extractUser(req);
  const studentId = String(req.params.student_id);

  // Authorization check for parent or student
  if (user?.role === 'parent' && !db.isChildOfParent(user.id, studentId)) {
    return res.status(403).json({ error: '403 Forbidden', message: 'You can only view reports for your own children.' });
  }
  if (user?.role === 'student' && user.id !== studentId) {
    return res.status(403).json({ error: '403 Forbidden', message: 'You can only view your own report card.' });
  }

  const student = db.profiles.find((p) => p.id === studentId && p.role === 'student');
  if (!student) return res.status(404).json({ error: 'Student not found' });

  const cls = db.classes.find((c) => c.id === student.class_id);
  const sec = student.section_id ? db.sections.find((s) => s.id === student.section_id) : undefined;
  const mentor = sec?.mentor_id ? db.profiles.find((p) => p.id === sec.mentor_id) : undefined;

  // 1. Attendance Summary
  const attRecords = db.attendance.filter((a) => a.student_id === student.id);
  const totalDays = attRecords.length;
  const presentCount = attRecords.filter((a) => a.status === 'present').length;
  const lateCount = attRecords.filter((a) => a.status === 'late').length;
  const absentCount = attRecords.filter((a) => a.status === 'absent').length;
  const attendancePct = totalDays > 0 ? Math.round(((presentCount + lateCount) / totalDays) * 100) : 100;

  // 2. Marks and Subject Performance
  const studentMarks = db.marks.filter((m) => m.student_id === student.id);
  const subjectScores = studentMarks.map((m) => {
    const sub = db.subjects.find((s) => s.id === m.subject_id);
    const exam = db.exams.find((e) => e.id === m.exam_id);
    return {
      exam_title: exam?.title || 'Assessment',
      subject_name: sub?.name || 'Subject',
      marks_obtained: m.marks_obtained,
      max_marks: m.max_marks,
      percentage: m.percentage,
      grade: m.grade,
      remarks: m.remarks,
    };
  });

  const totalScored = studentMarks.reduce((sum, m) => sum + m.marks_obtained, 0);
  const totalPossible = studentMarks.reduce((sum, m) => sum + m.max_marks, 0);
  const overallPercentage = totalPossible > 0 ? Math.round((totalScored / totalPossible) * 100) : 0;

  let overallGrade = 'D';
  if (overallPercentage >= 90) overallGrade = 'A+';
  else if (overallPercentage >= 80) overallGrade = 'A';
  else if (overallPercentage >= 70) overallGrade = 'B';
  else if (overallPercentage >= 60) overallGrade = 'C';

  // Section rank calculation
  const sectionStudents = db.profiles.filter((p) => p.role === 'student' && p.section_id === student.section_id);
  const rankedSection = sectionStudents
    .map((st) => {
      const sMarks = db.marks.filter((m) => m.student_id === st.id);
      const sc = sMarks.reduce((acc, curr) => acc + curr.marks_obtained, 0);
      const mx = sMarks.reduce((acc, curr) => acc + curr.max_marks, 0);
      return {
        student_id: st.id,
        pct: mx > 0 ? Math.round((sc / mx) * 100) : 0,
      };
    })
    .sort((a, b) => b.pct - a.pct);

  const studentRankIndex = rankedSection.findIndex((r) => r.student_id === student.id);
  const meritRank = studentRankIndex >= 0 ? studentRankIndex + 1 : 1;

  // 3. Homework Summary
  const sectionHomework = db.homework.filter((h) => h.section_id === student.section_id);
  const submissions = db.homework_submissions.filter((s) => s.student_id === student.id);
  const homeworkPct = sectionHomework.length > 0 ? Math.round((submissions.length / sectionHomework.length) * 100) : 100;

  // 4. Fee Status
  const feeRecords = db.student_fees.filter((f) => f.student_id === student.id);
  const totalFees = feeRecords.reduce((sum, f) => sum + f.total_amount, 0);
  const paidFees = feeRecords.reduce((sum, f) => sum + f.paid_amount, 0);
  const pendingFees = totalFees - paidFees;

  return res.json({
    school_name: 'Oakridge Smart International School',
    academic_year: '2025-2026',
    generated_at: new Date().toISOString(),
    student: {
      id: student.id,
      name: student.full_name,
      id_number: student.id_number || student.user_id,
      class_name: cls?.name,
      section_name: sec?.full_name,
      gender: student.gender || 'Not specified',
      dob: student.dob || '2018-05-14',
      parent_name: student.parent_name || 'Rajesh Kumar',
      mentor_name: mentor?.full_name || 'Class Mentor',
    },
    academics: {
      overall_percentage: overallPercentage,
      overall_grade: overallGrade,
      section_rank: meritRank,
      total_students_in_section: sectionStudents.length || 1,
      subject_performance: subjectScores,
    },
    attendance: {
      total_days: totalDays,
      present_count: presentCount,
      absent_count: absentCount,
      late_count: lateCount,
      percentage: attendancePct,
      status: attendancePct >= 85 ? 'EXCELLENT' : attendancePct >= 75 ? 'SATISFACTORY' : 'LOW_ATTENDANCE_WARNING',
    },
    homework: {
      total_assigned: sectionHomework.length,
      submitted_count: submissions.length,
      completion_percentage: homeworkPct,
    },
    fees: {
      total_amount: totalFees,
      paid_amount: paidFees,
      pending_amount: pendingFees,
      status: pendingFees <= 0 ? 'CLEARED' : 'PENDING_DUES',
    },
    mentor_remarks: overallPercentage >= 85
      ? 'Aarav shows exemplary dedication and outstanding critical thinking across all subjects.'
      : 'Good academic progression. Focus on regular practice and lesson revisions.',
  });
});

// GET /api/reports/section/:section_id - Section Performance Report
router.get('/section/:section_id', (req: AuthenticatedRequest, res) => {
  const sectionId = req.params.section_id;
  const sec = db.sections.find((s) => s.id === sectionId);
  if (!sec) return res.status(404).json({ error: 'Section not found' });

  const cls = db.classes.find((c) => c.id === sec.class_id);
  const mentor = sec.mentor_id ? db.profiles.find((p) => p.id === sec.mentor_id) : undefined;
  const students = db.profiles.filter((p) => p.role === 'student' && p.section_id === sec.id);

  // Ranked students in this section
  const ranked = students
    .map((st) => {
      const sMarks = db.marks.filter((m) => m.student_id === st.id);
      const sc = sMarks.reduce((acc, curr) => acc + curr.marks_obtained, 0);
      const mx = sMarks.reduce((acc, curr) => acc + curr.max_marks, 0);
      const pct = mx > 0 ? Math.round((sc / mx) * 100) : 0;
      let grade = 'D';
      if (pct >= 90) grade = 'A+';
      else if (pct >= 80) grade = 'A';
      else if (pct >= 70) grade = 'B';
      else if (pct >= 60) grade = 'C';

      return {
        student_id: st.id,
        name: st.full_name,
        id_number: st.id_number || st.user_id,
        score: sc,
        max_marks: mx,
        percentage: pct,
        grade,
      };
    })
    .sort((a, b) => b.percentage - a.percentage)
    .map((item, idx) => ({
      rank: idx + 1,
      ...item,
    }));

  return res.json({
    section_id: sec.id,
    section_name: sec.full_name,
    class_name: cls?.name,
    mentor_name: mentor?.full_name || 'Unassigned',
    students_count: students.length,
    leaderboard: ranked,
  });
});

export default router;
