import { Router } from 'express';
import { db, Profile } from '../db/store.js';
import { config } from '../config/index.js';
import { createClient } from '@supabase/supabase-js';

const router = Router();

// GET /api/admin/stats
router.get('/stats', (_req, res) => {
  const teachersCount = db.profiles.filter((p) => p.role === 'teacher').length;
  const studentsCount = db.profiles.filter((p) => p.role === 'student').length;
  const parentsCount = db.profiles.filter((p) => p.role === 'parent').length;
  const totalClasses = db.classes.length;
  const totalSections = db.sections.length;
  const totalSubjects = db.subjects.length;

  const totalFeeAmount = db.student_fees.reduce((acc, f) => acc + f.total_amount, 0);
  const totalFeeCollected = db.student_fees.reduce((acc, f) => acc + f.paid_amount, 0);

  return res.json({
    total_users: db.profiles.length,
    total_teachers: teachersCount,
    total_students: studentsCount,
    total_parents: parentsCount,
    total_classes: totalClasses,
    total_sections: totalSections,
    total_subjects: totalSubjects,
    total_fee_amount: totalFeeAmount,
    total_fee_collected: totalFeeCollected,
    total_fee_pending: totalFeeAmount - totalFeeCollected,
    admin_id: db.admin_credentials.id_number,
    admin_email: db.admin_credentials.email,
  });
});

// GET /api/admin/audit-logs
router.get('/audit-logs', (_req, res) => {
  return res.json(db.audit_logs);
});

// GET /api/admin/users
router.get('/users', (_req, res) => {
  const users = db.profiles.map((p) => {
    const assignedClass = p.class_id ? db.classes.find((c) => c.id === p.class_id) : undefined;

    // Real dynamic achievement badges for students
    const achievement_badges: Array<{
      id: string;
      name: string;
      type: string;
      unlocked: boolean;
      description: string;
    }> = [];

    if (p.role === 'student') {
      const attempts = db.student_attempts.filter(
        (a) => a.student_id === p.id || a.student_id === p.user_id
      );

      // 1. Attendance Achievement Badge (Awarded when student joins / attends the portal)
      achievement_badges.push({
        id: 'ach-attendance',
        name: 'Portal Attendance',
        type: 'attendance',
        unlocked: true,
        description: 'Awarded for active portal attendance and showing up ready to learn.',
      });

      // 2. Test Responsibility Achievement Badge (Awarded when student attends tests)
      const hasTakenTest = attempts.length > 0;
      achievement_badges.push({
        id: 'ach-responsibility',
        name: 'Test Responsibility',
        type: 'responsibility',
        unlocked: hasTakenTest,
        description: hasTakenTest
          ? 'Awarded for fulfilling academic responsibility by attending test evaluations.'
          : 'Pending test attendance: Student must attend and submit an assessment.',
      });

      // 3. High Achiever Badge
      if (attempts.some((a) => a.percentage >= 90)) {
        achievement_badges.push({
          id: 'ach-high-achiever',
          name: 'High Achiever (90%+)',
          type: 'excellence',
          unlocked: true,
          description: 'Awarded for scoring 90%+ in assessment.',
        });
      }
    }

    return {
      ...p,
      achievement_badges,
      class_name: assignedClass?.name || p.class_id,
    };
  });

  return res.json(users);
});

// POST /api/admin/users - Admin-only user creation
router.post('/users', async (req, res) => {
  try {
    let { full_name, email, password, role, id_number, class_id, batch } = req.body;

    if (!full_name || !email || !role || !password) {
      return res.status(400).json({ error: 'Full name, email, password, and role are required.' });
    }

    const cleanEmail = email.trim().toLowerCase();
    let cleanId = (id_number || '').trim().toUpperCase();

    // 1. Role and ID format validation & auto-formatting
    if (role === 'teacher') {
      if (!cleanId) {
        cleanId = `TCH${Math.floor(1000 + Math.random() * 9000)}`;
      } else if (!cleanId.startsWith('TCH')) {
        cleanId = `TCH${cleanId.replace(/\D/g, '') || Math.floor(1000 + Math.random() * 9000)}`;
      }
    } else if (role === 'student') {
      if (!cleanId) {
        cleanId = `STU${Math.floor(20000 + Math.random() * 80000)}`;
      } else if (!cleanId.startsWith('STU')) {
        cleanId = `STU${cleanId.replace(/\D/g, '') || Math.floor(20000 + Math.random() * 80000)}`;
      }
      if (!class_id) {
        class_id = db.classes[0]?.id || 'CLS001';
      }
    } else if (role === 'parent') {
      if (!cleanId) {
        cleanId = `PAR${Math.floor(2000 + Math.random() * 8000)}`;
      } else if (!cleanId.startsWith('PAR')) {
        cleanId = `PAR${cleanId.replace(/\D/g, '') || Math.floor(2000 + Math.random() * 8000)}`;
      }
    } else {
      return res.status(400).json({ error: 'Role must be "teacher", "student", or "parent".' });
    }

    // 2. Uniqueness checks
    const duplicateEmail = db.profiles.find((p) => p.email.toLowerCase() === cleanEmail);
    if (duplicateEmail) {
      return res.status(400).json({ error: `An account with email "${cleanEmail}" already exists.` });
    }

    const duplicateId = db.profiles.find((p) => p.id_number?.toUpperCase() === cleanId);
    if (duplicateId) {
      return res.status(400).json({ error: `Official ID "${cleanId}" is already registered to ${duplicateId.full_name}.` });
    }

    let authUserId = `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    // 3. Register user with Supabase Auth if service or signup is available
    if (config.supabaseUrl && config.supabaseAnonKey) {
      try {
        const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);
        const studentBatch = role === 'student' ? (batch?.trim() || 'Batch 2025-2026') : undefined;

        const { data: suData, error: suErr } = await supabase.auth.signUp({
          email: cleanEmail,
          password: password,
          options: {
            data: {
              full_name: full_name.trim(),
              role,
              user_id: cleanId,
              class_id: role === 'student' ? class_id : undefined,
              batch: studentBatch,
            },
          },
        });

        if (suData?.user?.id) {
          authUserId = suData.user.id;
        }

        // Upsert into Supabase public.profiles
        await supabase.from('profiles').upsert({
          id: authUserId,
          user_id: cleanId,
          full_name: full_name.trim(),
          email: cleanEmail,
          role,
          class_id: role === 'student' ? class_id : undefined,
          batch: studentBatch,
        });
      } catch (sbErr: any) {
        console.warn('Supabase profile creation sync notice:', sbErr.message);
      }
    }

    const studentBatch = role === 'student' ? (batch?.trim() || 'Batch 2025-2026') : undefined;

    // 4. Save to local store database
    const assignedClass = role === 'student' && class_id ? db.classes.find((c) => c.id === class_id) : undefined;
    const assignedSection = assignedClass ? db.sections.find((s) => s.class_id === assignedClass.id) : undefined;

    const newProfile: Profile = {
      id: authUserId,
      user_id: cleanId,
      full_name: full_name.trim(),
      email: cleanEmail,
      role,
      id_number: cleanId,
      class_id: role === 'student' ? class_id : undefined,
      class_name: assignedClass?.name,
      section_id: assignedSection?.id,
      section_name: assignedSection?.full_name,
      batch: studentBatch,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    db.profiles.push(newProfile);

    // Update class counts and auto-seed initial fee record
    if (role === 'student' && class_id) {
      if (assignedClass) {
        assignedClass.student_count = (assignedClass.student_count || 0) + 1;
      }

      const feeStructure = db.fee_structures.find((f) => f.class_id === class_id) || db.fee_structures[0];
      if (feeStructure) {
        db.student_fees.push({
          id: `sf-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
          school_id: 'SCH001',
          student_id: newProfile.id,
          fee_structure_id: feeStructure.id,
          total_amount: feeStructure.amount,
          total_fee: feeStructure.amount,
          paid_amount: 0,
          pending_amount: feeStructure.amount,
          status: 'pending',
          due_date: feeStructure.due_date,
        });
      }
    }

    db.logActivity(
      'AI_CHAT',
      `Admin provisioned account: ${newProfile.full_name} (${role.toUpperCase()}, ID: ${cleanId})`
    );

    return res.status(201).json({
      message: `Account created successfully for ${newProfile.full_name}.`,
      user: newProfile,
    });
  } catch (err: any) {
    console.error('Error creating user:', err);
    return res.status(500).json({ error: err.message || 'Failed to create user.' });
  }
});

// DELETE /api/admin/users/:id
router.delete('/users/:id', async (req, res) => {
  const userId = req.params.id;

  if (userId === 'admin-primary-001' || userId === 'ADM1001') {
    return res.status(400).json({ error: 'Cannot delete primary Administrator account.' });
  }

  const idx = db.profiles.findIndex((p) => p.id === userId || p.user_id === userId);
  if (idx === -1) {
    return res.status(404).json({ error: 'User not found.' });
  }

  const removed = db.profiles.splice(idx, 1)[0];

  // Try to remove from Supabase
  if (config.supabaseUrl && config.supabaseAnonKey) {
    try {
      const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);
      await supabase.from('profiles').delete().eq('id', userId);
    } catch (e) {
      // ignore
    }
  }

  db.logActivity('AI_CHAT', `Admin deleted user account: ${removed.full_name} (${removed.id_number || removed.email})`);

  return res.json({ success: true, message: `User ${removed.full_name} removed.` });
});

// PUT /api/admin/credentials - Update Admin ID and Password
router.put('/credentials', (req, res) => {
  const { id_number, password, full_name, email } = req.body;

  if (id_number) db.admin_credentials.id_number = id_number.trim().toUpperCase();
  if (password) db.admin_credentials.password = password;
  if (full_name) db.admin_credentials.full_name = full_name.trim();
  if (email) db.admin_credentials.email = email.trim().toLowerCase();

  db.logActivity('AI_CHAT', `Admin credentials updated: ID ${db.admin_credentials.id_number}`);

  return res.json({
    message: 'Admin credentials updated successfully.',
    admin_id: db.admin_credentials.id_number,
    admin_email: db.admin_credentials.email,
  });
});

export default router;
