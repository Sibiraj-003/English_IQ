import { Router } from 'express';
import { db } from '../db/store.js';
import { extractUser, requireAdmin, AuthenticatedRequest } from '../middleware/authScope.js';

const router = Router();

// GET /api/notifications - User's notifications
router.get('/', (req: AuthenticatedRequest, res) => {
  const user = extractUser(req);
  if (!user) {
    return res.json([]);
  }

  const userNotifications = db.notifications
    .filter((n) => n.user_id === user.id)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return res.json(userNotifications);
});

// PATCH /api/notifications/:id/read - Mark notification as read
router.patch('/:id/read', (req: AuthenticatedRequest, res) => {
  const notif = db.notifications.find((n) => n.id === req.params.id);
  if (!notif) return res.status(404).json({ error: 'Notification not found' });

  notif.is_read = true;
  return res.json(notif);
});

// POST /api/notifications/broadcast - Admin announcement
router.post('/broadcast', requireAdmin, (req: AuthenticatedRequest, res) => {
  const { title, message, target_role, class_id } = req.body;

  if (!title || !message) {
    return res.status(400).json({ error: 'Title and message are required' });
  }

  let recipients = db.profiles;

  if (target_role && target_role !== 'all') {
    recipients = recipients.filter((p) => p.role === target_role);
  }

  if (class_id && class_id !== 'all') {
    recipients = recipients.filter((p) => p.class_id === class_id);
  }

  recipients.forEach((p) => {
    db.notifyUser(p.id, title, message, 'announcement');
  });

  return res.json({ message: `Announcement broadcast to ${recipients.length} recipients.` });
});

export default router;
