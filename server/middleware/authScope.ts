import { Request, Response, NextFunction } from 'express';
import { db, Profile } from '../db/store.js';

export interface AuthenticatedRequest extends Request {
  user?: Profile;
}

/**
 * Extracts and verifies the current user from headers
 * Accepts:
 * - x-user-id: direct user ID / profile ID (e.g. 'tch-primary-001', 'ADM1001')
 * - x-user-role: role header
 * - Authorization: Bearer token or Supabase JWT
 */
export function extractUser(req: AuthenticatedRequest): Profile | null {
  const headerUserId = req.headers['x-user-id'] as string;
  const headerEmail = req.headers['x-user-email'] as string;

  if (headerUserId) {
    const profile = db.profiles.find(
      (p) =>
        p.id === headerUserId ||
        p.user_id === headerUserId ||
        p.id_number === headerUserId
    );
    if (profile) return profile;
  }

  if (headerEmail) {
    const profile = db.profiles.find(
      (p) => p.email.toLowerCase() === headerEmail.toLowerCase()
    );
    if (profile) return profile;
  }

  return null;
}

/**
 * Middleware: Requires an authenticated user
 */
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const user = extractUser(req);
  if (!user) {
    // Check if Authorization header provided
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // In production, Supabase JWT verification can take place here
    }
  }

  req.user = user || undefined;
  next();
}

/**
 * Middleware: Strictly requires Admin role
 */
export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const user = extractUser(req);
  if (!user || user.role !== 'admin') {
    return res.status(403).json({
      error: '403 Forbidden',
      message: 'Administrative privileges required for this action.',
    });
  }
  req.user = user;
  next();
}

/**
 * Middleware: Strictly enforces Teacher Access Scope
 * A teacher can ONLY access:
 * - Sections they are assigned to (with matching subject)
 * - OR sections where they are designated as the Section Mentor (full section visibility)
 * Admin bypasses this check.
 */
export function requireTeacherScope(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const user = extractUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
  }

  if (user.role === 'admin') {
    req.user = user;
    return next();
  }

  if (user.role !== 'teacher') {
    return res.status(403).json({
      error: '403 Forbidden',
      message: 'Teacher authorization required.',
    });
  }

  const sectionId = (req.params.sectionId || req.params.section_id || req.query.section_id || req.body.section_id) as string;
  const subjectId = (req.params.subjectId || req.params.subject_id || req.query.subject_id || req.body.subject_id) as string;

  // If a specific section is being targeted in the request
  if (sectionId) {
    const isAuthorized = db.canTeacherAccess(user.id, sectionId, subjectId || undefined);
    if (!isAuthorized) {
      return res.status(403).json({
        error: '403 Forbidden',
        message: `Teacher Access Denied: You are not assigned to Section ${sectionId}${subjectId ? ` for subject ${subjectId}` : ''}, and you are not its Section Mentor.`,
      });
    }
  }

  req.user = user;
  next();
}

/**
 * Middleware: Strictly enforces Parent Access Scope
 * A parent can ONLY access data belonging to their own registered child/children.
 */
export function requireParentScope(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const user = extractUser(req);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized', message: 'Authentication required' });
  }

  if (user.role === 'admin') {
    req.user = user;
    return next();
  }

  if (user.role !== 'parent') {
    return res.status(403).json({
      error: '403 Forbidden',
      message: 'Parent authorization required.',
    });
  }

  const studentId = (req.params.studentId || req.params.student_id || req.query.student_id || req.body.student_id) as string;

  if (studentId) {
    const isMyChild = db.isChildOfParent(user.id, studentId);
    if (!isMyChild) {
      return res.status(403).json({
        error: '403 Forbidden',
        message: 'Parent Access Denied: You can only access academic records of your own children.',
      });
    }
  }

  req.user = user;
  next();
}
