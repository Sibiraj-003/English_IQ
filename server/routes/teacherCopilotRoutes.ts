import { Router } from 'express';
import { extractUser, AuthenticatedRequest } from '../middleware/authScope.js';
import { teacherCopilotService, TeacherCopilotQueryRequest } from '../ai/teacherCopilot.js';

const router = Router();

/**
 * POST /api/teacher/copilot/chat
 * Primary Live AI conversational endpoint for teachers.
 * Analyzes questions against real database records and returns
 * structured data, answers, metrics, actionable alerts, and proactive follow-up questions.
 */
router.post('/chat', async (req: AuthenticatedRequest, res) => {
  try {
    const user = extractUser(req);
    const body: TeacherCopilotQueryRequest = req.body || {};

    const teacherId = body.teacher_id || (user?.role === 'teacher' ? user.id : undefined);

    if (!body.message || typeof body.message !== 'string' || !body.message.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Message is required and must be non-empty.',
      });
    }

    const payload: TeacherCopilotQueryRequest = {
      teacher_id: teacherId,
      class_id: body.class_id,
      section_id: body.section_id,
      subject_id: body.subject_id,
      message: body.message.trim(),
      history: Array.isArray(body.history) ? body.history : [],
    };

    const response = await teacherCopilotService.processTeacherQuery(payload);

    return res.json({
      success: true,
      data: response,
    });
  } catch (error: any) {
    console.error('[TeacherCopilotRoute] Error processing query:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process AI query.',
      message: error.message || 'Internal server error',
    });
  }
});

/**
 * POST /api/teacher/copilot/schedule-test
 * Dedicated automated endpoint to generate questions, schedule test, and dispatch alerts to students & parents
 */
router.post('/schedule-test', async (req: AuthenticatedRequest, res) => {
  try {
    const user = extractUser(req);
    const body = req.body || {};
    const teacherId = body.teacher_id || (user?.role === 'teacher' ? user.id : undefined);

    const context = teacherCopilotService.compileTeacherContext({
      teacher_id: teacherId,
      class_id: body.class_id,
      section_id: body.section_id,
      subject_id: body.subject_id,
    });

    const response = await teacherCopilotService.executeAutomatedTestCreation(
      {
        teacher_id: teacherId,
        class_id: body.class_id,
        section_id: body.section_id,
        subject_id: body.subject_id,
        message:
          body.message ||
          `Create question for ${context.activeScope.className} section ${context.activeScope.sectionName} subject ${context.activeScope.subjectName} publish test on ${body.date || 'tomorrow'} at ${body.timing || '10:00 AM'} with ${body.total_marks || 25} marks`,
      },
      context
    );

    return res.json({
      success: true,
      data: response,
    });
  } catch (error: any) {
    console.error('[TeacherCopilotRoute] Error in automated test scheduling:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to schedule test and dispatch notifications.',
      message: error.message || 'Internal server error',
    });
  }
});

/**
 * GET /api/teacher/copilot/summary
 * Retrieves scoped class snapshot metrics and highlights for the teacher copilot header
 */
router.get('/summary', (req: AuthenticatedRequest, res) => {
  try {
    const user = extractUser(req);
    const teacherId = (req.query.teacher_id as string) || (user?.role === 'teacher' ? user.id : undefined);
    const classId = req.query.class_id as string | undefined;
    const sectionId = req.query.section_id as string | undefined;
    const subjectId = req.query.subject_id as string | undefined;

    const context = teacherCopilotService.compileTeacherContext({
      teacher_id: teacherId,
      class_id: classId,
      section_id: sectionId,
      subject_id: subjectId,
    });

    const totalPendingHw = context.homeworkStats.reduce(
      (sum, h) => sum + (h.unsubmittedNames?.length || 0),
      0
    );

    return res.json({
      success: true,
      data: {
        teacher: context.teacher,
        assignments: context.assignments,
        activeScope: {
          classId: context.activeScope.class_id,
          className: context.activeScope.className,
          sectionId: context.activeScope.section_id,
          sectionName: context.activeScope.sectionName,
          subjectId: context.activeScope.subject_id,
          subjectName: context.activeScope.subjectName,
        },
        metrics: {
          totalEnrolled: context.students.length,
          todayAttendanceRate: context.attendance.attendancePercent,
          presentCount: context.attendance.presentCount,
          absentCount: context.attendance.absentCount,
          absentStudentNames: context.attendance.absentStudentNames,
          averageScore: context.academics.classAverage,
          atRiskCount: context.academics.atRiskStudents.length,
          topStudentsCount: context.academics.topStudents.length,
          weakTopics: context.academics.weakTopics,
          pendingHomeworkCount: totalPendingHw,
          unreadParentMessages: context.unreadMessages.length,
          todayScheduleSlots: context.todaySlots.length,
        },
        atRiskStudents: context.academics.atRiskStudents,
        topStudents: context.academics.topStudents,
        schedule: context.todaySlots,
      },
    });
  } catch (error: any) {
    console.error('[TeacherCopilotRoute] Error fetching summary:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to compile teacher context.',
      message: error.message,
    });
  }
});

export default router;
