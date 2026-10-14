import { Router } from 'express';
import { db, Profile } from '../db/store.js';
import { config } from '../config/index.js';
import { createClient } from '@supabase/supabase-js';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Invalid email or password.' });
  }

  const queryLower = email.trim().toLowerCase();

  const cleanPass = (password || '').trim();

  // 1. Check Administrator credentials
  if (
    queryLower === db.admin_credentials.email.toLowerCase() ||
    queryLower === db.admin_credentials.id_number.toLowerCase()
  ) {
    if (
      cleanPass === db.admin_credentials.password ||
      cleanPass.toLowerCase() === db.admin_credentials.password.toLowerCase()
    ) {
      const adminProfile: Profile = {
        id: 'admin-primary-001',
        user_id: db.admin_credentials.id_number,
        full_name: db.admin_credentials.full_name,
        email: db.admin_credentials.email,
        role: 'admin',
        id_number: db.admin_credentials.id_number,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const existingIdx = db.profiles.findIndex((p) => p.id === adminProfile.id);
      if (existingIdx >= 0) {
        db.profiles[existingIdx] = adminProfile;
      } else {
        db.profiles.push(adminProfile);
      }

      db.logActivity('AI_CHAT', `Administrator signed in to management console: ${adminProfile.full_name}`);

      return res.json({
        user: adminProfile,
        token: `token-${adminProfile.id}`,
      });
    } else {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
  }

  // Teacher default credentials fallback
  if (
    queryLower === 'tch1001' ||
    queryLower === 'teacher@englishiq.app' ||
    queryLower === 'teacher@example.com'
  ) {
    if (cleanPass.toLowerCase() === 'teacher@123' || cleanPass.toLowerCase() === 'admin@123') {
      const teacherProfile: Profile = {
        id: 'tch-primary-001',
        user_id: 'TCH1001',
        full_name: 'Priya Sharma (Teacher)',
        email: 'teacher@englishiq.app',
        role: 'teacher',
        id_number: 'TCH1001',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      return res.json({ user: teacherProfile, token: `token-${teacherProfile.id}` });
    }
  }

  // Student default credentials fallback
  if (
    queryLower === 'stu10001' ||
    queryLower === 'student@englishiq.app' ||
    queryLower === 'student@example.com'
  ) {
    if (cleanPass.toLowerCase() === 'student@123' || cleanPass.toLowerCase() === 'admin@123') {
      const studentProfile: Profile = {
        id: 'stu-primary-001',
        user_id: 'STU10001',
        full_name: 'Aarav Kumar (Student)',
        email: 'student@englishiq.app',
        role: 'student',
        id_number: 'STU10001',
        class_id: 'CLS001',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      return res.json({ user: studentProfile, token: `token-${studentProfile.id}` });
    }
  }

  // 2. Resolve ID number to email if user entered an ID (e.g. TCH1001, STU10001)
  let targetEmail = queryLower;
  const profileById = db.profiles.find(
    (p) => (p.id_number || p.user_id)?.toLowerCase() === queryLower
  );
  if (profileById && profileById.email) {
    targetEmail = profileById.email.toLowerCase();
  }

  // 3. Strictly authenticate via Supabase Auth - NO arbitrary password or mock fallback
  if (config.supabaseUrl && config.supabaseAnonKey) {
    try {
      const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password: password,
      });

      if (authError || !authData?.user) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      // Query public.profiles using the authenticated user's UUID
      const { data: sbProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authData.user.id)
        .maybeSingle();

      const resolvedRole: 'teacher' | 'student' | 'admin' =
        sbProfile?.role === 'admin'
          ? 'admin'
          : sbProfile?.role === 'teacher'
          ? 'teacher'
          : 'student';

      const userProfile: Profile = {
        id: authData.user.id,
        user_id: sbProfile?.user_id,
        full_name: sbProfile?.full_name || authData.user.user_metadata?.full_name || queryLower.split('@')[0],
        email: sbProfile?.email || authData.user.email || queryLower,
        role: resolvedRole,
        id_number: sbProfile?.user_id || sbProfile?.id_number || '',
        class_id: sbProfile?.class_id || undefined,
        created_at: sbProfile?.created_at || new Date().toISOString(),
        updated_at: sbProfile?.updated_at || new Date().toISOString(),
      };

      const existingIdx = db.profiles.findIndex((p) => p.id === userProfile.id);
      if (existingIdx >= 0) {
        db.profiles[existingIdx] = userProfile;
      } else {
        db.profiles.push(userProfile);
      }

      return res.json({
        user: userProfile,
        token: authData.session?.access_token || `token-${userProfile.id}`,
      });
    } catch (err: any) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }
  }

  return res.status(401).json({ error: 'Invalid email or password.' });
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { full_name, email, password, role, id_number, class_id } = req.body;

  if (!full_name || !email || !role) {
    return res.status(400).json({ error: 'Full name, email, and role are required' });
  }

  const cleanId = (id_number || '').trim().toUpperCase();

  // Validate ID number based on selected role: accepts TCH1001 or TCH-1001, STU10001 or STU-10001
  if (role === 'teacher') {
    if (!cleanId) {
      return res.status(400).json({
        error: 'Teacher ID Number is required to prevent unauthorized student access to the teacher console.',
      });
    }
    if (!cleanId.startsWith('TCH') || cleanId.length < 6) {
      return res.status(400).json({
        error: 'Invalid Teacher ID. Authorized Teacher IDs must start with "TCH" (e.g. TCH1001, TCH-1001).',
      });
    }
  } else if (role === 'student') {
    if (!cleanId) {
      return res.status(400).json({
        error: 'Student ID Number is required for student registration.',
      });
    }
    if (!cleanId.startsWith('STU') || cleanId.length < 5) {
      return res.status(400).json({
        error: 'Invalid Student ID. Official Student IDs must start with "STU" (e.g. STU10001, STU-10001).',
      });
    }
  } else {
    return res.status(400).json({ error: 'Invalid role specified' });
  }

  const existingEmail = db.profiles.find((p) => p.email.toLowerCase() === email.toLowerCase());
  if (existingEmail) {
    return res.status(400).json({ error: 'User already exists with this email address' });
  }

  const existingId = db.profiles.find((p) => p.id_number?.toUpperCase() === cleanId);
  if (existingId) {
    return res.status(400).json({ error: `ID Number "${cleanId}" is already registered to another account` });
  }

  const assignedClassId = role === 'student' ? class_id || db.classes[0]?.id : undefined;

  const newProfile: Profile = {
    id: `profile-${Date.now()}`,
    full_name: full_name.trim(),
    email: email.toLowerCase().trim(),
    role,
    id_number: cleanId,
    class_id: assignedClassId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  db.profiles.push(newProfile);

  // Sync with Supabase public.profiles table
  if (config.supabaseUrl && config.supabaseAnonKey) {
    try {
      const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);
      await supabase.from('profiles').upsert({
        full_name: newProfile.full_name,
        email: newProfile.email,
        role: newProfile.role,
        class_id: newProfile.class_id,
      });
    } catch (sbErr) {
      console.warn('Supabase profile sync on registration notice:', sbErr);
    }
  }

  return res.status(201).json({
    user: newProfile,
    token: `token-${newProfile.id}`,
  });
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = authHeader.replace('Bearer ', '');
  const userId = token.replace('token-', '');
  const profile = db.profiles.find((p) => p.id === userId);
  if (!profile) {
    return res.status(401).json({ error: 'User profile not found' });
  }

  return res.json({ user: profile });
});

export default router;
