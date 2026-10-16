import { Router } from 'express';
import { db, ParentTeacherMessage } from '../db/store.js';
import { extractUser, AuthenticatedRequest } from '../middleware/authScope.js';

const router = Router();

// GET /api/messages - List messages for current user
router.get('/', (req: AuthenticatedRequest, res) => {
  const user = extractUser(req);
  if (!user) return res.status(401).json({ error: 'Authentication required' });

  const { student_id, other_user_id } = req.query;

  let msgs = db.messages.filter((m) => m.sender_id === user.id || m.receiver_id === user.id);

  if (student_id) {
    msgs = msgs.filter((m) => m.student_id === student_id);
  }

  if (other_user_id) {
    msgs = msgs.filter((m) => m.sender_id === other_user_id || m.receiver_id === other_user_id);
  }

  const enriched = msgs.map((m) => {
    const sender = db.profiles.find((p) => p.id === m.sender_id);
    const receiver = db.profiles.find((p) => p.id === m.receiver_id);
    const student = db.profiles.find((p) => p.id === m.student_id);
    const sub = m.subject_id ? db.subjects.find((s) => s.id === m.subject_id) : undefined;

    return {
      ...m,
      sender_name: sender?.full_name,
      sender_role: sender?.role,
      receiver_name: receiver?.full_name,
      receiver_role: receiver?.role,
      student_name: student?.full_name,
      subject_name: sub?.name,
    };
  });

  return res.json(enriched);
});

// POST /api/messages - Send message respecting student/section relation
router.post('/', (req: AuthenticatedRequest, res) => {
  const user = extractUser(req);
  if (!user) return res.status(401).json({ error: 'Authentication required' });

  const { receiver_id, student_id, subject_id, message } = req.body;

  if (!receiver_id || !student_id || !message) {
    return res.status(400).json({ error: 'receiver_id, student_id, and message are required' });
  }

  const student = db.profiles.find((p) => p.id === student_id && p.role === 'student');
  if (!student) return res.status(404).json({ error: 'Student context not found' });

  const receiver = db.profiles.find((p) => p.id === receiver_id);
  if (!receiver) return res.status(404).json({ error: 'Recipient user not found' });

  // 1. If Parent is sending: Receiver MUST be a teacher assigned to child's section or mentor
  if (user.role === 'parent') {
    if (!db.isChildOfParent(user.id, student.id)) {
      return res.status(403).json({ error: '403 Forbidden', message: 'You can only message teachers regarding your own registered child.' });
    }

    if (receiver.role !== 'teacher') {
      return res.status(400).json({ error: 'Parents can only message authorized teachers or mentors.' });
    }

    if (student.section_id) {
      const isAuthorized = db.canTeacherAccess(receiver.id, student.section_id);
      if (!isAuthorized) {
        return res.status(403).json({ error: '403 Forbidden', message: 'Selected teacher is not assigned to your child\'s section.' });
      }
    }
  }

  // 2. If Teacher is sending: Receiver MUST be parent of the student
  if (user.role === 'teacher') {
    if (student.section_id) {
      const isAuthorized = db.canTeacherAccess(user.id, student.section_id);
      if (!isAuthorized) {
        return res.status(403).json({ error: '403 Forbidden', message: 'You are not assigned to this student\'s section.' });
      }
    }

    if (receiver.role !== 'parent') {
      return res.status(400).json({ error: 'Teachers can only message parents of students in their assigned sections.' });
    }

    const isChild = db.isChildOfParent(receiver.id, student.id);
    if (!isChild) {
      return res.status(403).json({ error: '403 Forbidden', message: 'The recipient is not the registered parent of this student.' });
    }
  }

  const newMsg: ParentTeacherMessage = {
    id: `msg-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`,
    school_id: 'SCH001',
    sender_id: user.id,
    receiver_id,
    student_id,
    subject_id,
    message: message.trim(),
    is_read: false,
    created_at: new Date().toISOString(),
  };

  db.messages.push(newMsg);

  // Send an in-app notification to receiver
  db.notifyUser(
    receiver_id,
    `New Message from ${user.full_name} (${user.role.toUpperCase()})`,
    `Regarding ${student.full_name}: "${message.substring(0, 80)}${message.length > 80 ? '...' : ''}"`,
    'general',
    user.role === 'parent' ? '/teacher/messages' : '/parent/messages'
  );

  return res.status(201).json(newMsg);
});

export default router;
