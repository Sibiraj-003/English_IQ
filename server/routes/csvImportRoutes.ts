import { Router } from 'express';
import { db, Profile, TeacherAssignment, ParentStudent, StudentFeeRecord, PendingOnboardingAccount } from '../db/store.js';
import { requireAdmin, AuthenticatedRequest } from '../middleware/authScope.js';

const router = Router();

interface CsvRowValidation {
  row_number: number;
  data: Record<string, string>;
  is_valid: boolean;
  errors: string[];
}

function normalizeHeader(h: string): string {
  return h
    .trim()
    .replace(/^["']|["']$/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function parseCsv(csvText: string): { originalHeaders: string[]; normalizedHeaders: string[]; rows: Record<string, string>[] } {
  if (!csvText) return { originalHeaders: [], normalizedHeaders: [], rows: [] };

  const lines = csvText.replace(/^\uFEFF/, '').trim().split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return { originalHeaders: [], normalizedHeaders: [], rows: [] };

  const originalHeaders = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));
  const normalizedHeaders = originalHeaders.map(normalizeHeader);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(',').map((p) => p.trim().replace(/^["']|["']$/g, ''));
    const rowObj: Record<string, string> = {};

    normalizedHeaders.forEach((nh, idx) => {
      rowObj[nh] = parts[idx] !== undefined ? parts[idx] : '';
      // Also map original header verbatim for preview table column display
      if (originalHeaders[idx]) {
        rowObj[originalHeaders[idx]] = rowObj[nh];
      }
    });

    // Alias common variants
    if (rowObj['student_id'] || rowObj['id_number'] || rowObj['user_id'] || rowObj['id']) {
      rowObj['canonical_id'] = rowObj['student_id'] || rowObj['id_number'] || rowObj['user_id'] || rowObj['id'];
    }
    if (rowObj['teacher_id']) rowObj['canonical_teacher_id'] = rowObj['teacher_id'];
    if (rowObj['parent_id']) rowObj['canonical_parent_id'] = rowObj['parent_id'];
    if (rowObj['name'] || rowObj['full_name'] || rowObj['student_name'] || rowObj['teacher_name'] || rowObj['parent_name']) {
      rowObj['canonical_name'] = rowObj['name'] || rowObj['full_name'] || rowObj['student_name'] || rowObj['teacher_name'] || rowObj['parent_name'];
    }
    if (rowObj['email'] || rowObj['mail'] || rowObj['email_address']) {
      rowObj['canonical_email'] = (rowObj['email'] || rowObj['mail'] || rowObj['email_address']).toLowerCase();
    }
    if (rowObj['class'] || rowObj['class_name'] || rowObj['class_id'] || rowObj['grade']) {
      rowObj['canonical_class'] = rowObj['class'] || rowObj['class_name'] || rowObj['class_id'] || rowObj['grade'];
    }
    if (rowObj['section'] || rowObj['section_name'] || rowObj['section_id']) {
      rowObj['canonical_section'] = rowObj['section'] || rowObj['section_name'] || rowObj['section_id'];
    }
    if (rowObj['subject'] || rowObj['subject_name'] || rowObj['subject_id'] || rowObj['subject_code']) {
      rowObj['canonical_subject'] = rowObj['subject'] || rowObj['subject_name'] || rowObj['subject_id'] || rowObj['subject_code'];
    }

    rows.push(rowObj);
  }

  return { originalHeaders, normalizedHeaders, rows };
}

function normalizeDatasetType(rawType: string): 'student' | 'teacher' | 'parent' | 'teacher_assignment' | 'student_assignment' {
  const t = (rawType || '').toLowerCase().trim();
  if (t === 'teacher' || t === 'teachers') return 'teacher';
  if (t === 'parent' || t === 'parents') return 'parent';
  if (t === 'teacher_assignment' || t === 'assignments' || t === 'teacher_assignments') return 'teacher_assignment';
  if (t === 'student_assignment' || t === 'student_assignments') return 'student_assignment';
  return 'student';
}

// POST /api/csv-import/preview & /api/csv-import/csv-preview
router.post(['/preview', '/csv-preview'], (req: AuthenticatedRequest, res) => {
  const csvText = req.body.csv_text || req.body.csv_content || req.body.csvText || '';
  const rawType = req.body.type || req.body.entity_type || req.body.dataset || 'student';
  const entityType = normalizeDatasetType(rawType);

  if (!csvText || !csvText.trim()) {
    return res.status(400).json({ error: 'CSV content is required for preview.' });
  }

  const { originalHeaders, rows } = parseCsv(csvText);
  if (rows.length === 0) {
    return res.status(400).json({ error: 'No data rows found in CSV. Please provide header row and at least 1 data row.' });
  }

  const validations: CsvRowValidation[] = [];
  const seenEmails = new Set<string>();
  const seenIds = new Set<string>();

  rows.forEach((row, index) => {
    const rowNum = index + 2;
    const errors: string[] = [];

    if (entityType === 'student') {
      const name = row['canonical_name'];
      const email = row['canonical_email'];
      const idNum = row['canonical_id'];
      const rawClass = row['canonical_class'];
      const rawSection = row['canonical_section'];

      if (!name) errors.push('Missing Student Name');

      if (email && !email.includes('@')) {
        errors.push(`Invalid email format: ${email}`);
      } else if (email) {
        if (seenEmails.has(email)) {
          errors.push(`Duplicate email in CSV: ${email}`);
        }
        seenEmails.add(email);
      }

      if (idNum) {
        if (seenIds.has(idNum.toUpperCase())) {
          errors.push(`Duplicate Student ID in CSV: ${idNum}`);
        }
        seenIds.add(idNum.toUpperCase());
      }

      if (rawClass) {
        const clsFound = db.classes.find(
          (c) =>
            c.id.toLowerCase() === rawClass.toLowerCase() ||
            c.name.toLowerCase() === rawClass.toLowerCase() ||
            c.grade.toString() === rawClass.replace(/\D/g, '')
        );
        if (!clsFound) {
          errors.push(`Class "${rawClass}" does not match curriculum (e.g. CLS001, Class 1)`);
        }
      }

      if (rawSection) {
        const secClean = rawSection.trim().toUpperCase();
        const secLetter = secClean.replace(/.*-/, '').replace(/.*\d+/, '');
        const secFound = db.sections.some(
          (s) =>
            s.id.toLowerCase() === rawSection.toLowerCase() ||
            s.full_name.toLowerCase() === rawSection.toLowerCase() ||
            s.id.replace(/-/g, '').toLowerCase() === rawSection.replace(/-/g, '').toLowerCase() ||
            s.full_name.replace(/-/g, '').toLowerCase() === rawSection.replace(/-/g, '').toLowerCase() ||
            (rawClass && (s.class_id.toLowerCase() === rawClass.toLowerCase() || s.full_name.startsWith(rawClass.replace(/\D/g, '') + '-')) && s.name.toUpperCase() === secLetter) ||
            s.name.toUpperCase() === secLetter
        );
        if (!secFound) {
          errors.push(`Section "${rawSection}" not recognized (e.g. SEC-1A, 1-A, A)`);
        }
      }
    } else if (entityType === 'teacher') {
      const name = row['canonical_name'];
      const email = row['canonical_email'];
      const idNum = row['canonical_id'] || row['canonical_teacher_id'];
      const subject = row['canonical_subject'];

      if (!name) errors.push('Missing Teacher Name');
      if (email && !email.includes('@')) errors.push('Valid email required');
      if (idNum && !idNum.toUpperCase().startsWith('TCH')) {
        errors.push('Teacher ID should begin with "TCH"');
      }

      if (subject) {
        const subFound = db.subjects.some(
          (s) =>
            s.id.toLowerCase() === subject.toLowerCase() ||
            s.name.toLowerCase() === subject.toLowerCase() ||
            s.code?.toLowerCase() === subject.toLowerCase()
        );
        if (!subFound) errors.push(`Subject "${subject}" not in catalog`);
      }
    } else if (entityType === 'parent') {
      const name = row['canonical_name'];
      const email = row['canonical_email'];
      const childId = row['student_id'] || row['child_id'] || row['canonical_id'];

      if (!name) errors.push('Missing Parent Name');
      if (email && !email.includes('@')) errors.push('Valid parent email required');
      if (!childId) errors.push('Missing Child/Student ID');
    } else if (entityType === 'teacher_assignment') {
      const teacherId = row['canonical_teacher_id'] || row['teacher_id'] || row['canonical_id'];
      const section = row['canonical_section'];
      const subject = row['canonical_subject'];

      if (!teacherId) errors.push('Missing Teacher ID');
      if (!section) errors.push('Missing Section identifier');
      if (!subject) errors.push('Missing Subject');
    } else if (entityType === 'student_assignment') {
      const studentId = row['canonical_id'] || row['student_id'];
      const rawClass = row['canonical_class'];
      const rawSection = row['canonical_section'];

      if (!studentId) errors.push('Missing Student ID');
      if (!rawClass) errors.push('Missing Class');
      if (!rawSection) errors.push('Missing Section');
    }

    validations.push({
      row_number: rowNum,
      data: row,
      is_valid: errors.length === 0,
      errors,
    });
  });

  const validCount = validations.filter((v) => v.is_valid).length;
  const invalidCount = validations.filter((v) => !v.is_valid).length;

  return res.json({
    type: entityType,
    entity_type: entityType,
    total_rows: rows.length,
    valid_rows: validCount,
    valid_count: validCount,
    error_count: invalidCount,
    invalid_count: invalidCount,
    headers: originalHeaders,
    rows: validations,
    preview: validations,
  });
});

// POST /api/csv-import/commit & /api/csv-import/import & /api/csv-import/csv-import
router.post(['/commit', '/import', '/csv-import'], (req: AuthenticatedRequest, res) => {
  const rawType = req.body.type || req.body.entity_type || req.body.dataset || 'student';
  const entityType = normalizeDatasetType(rawType);
  const passwordScheme = (req.body.password_scheme || req.body.password_format || 'student_roll') as 'student_roll' | 'parent_mobile';

  let rawRows: Record<string, string>[] = [];

  if (Array.isArray(req.body.rows)) {
    // Received rows from previewResult.rows
    rawRows = req.body.rows.map((r: any) => (r.data ? r.data : r));
  } else if (req.body.csv_text || req.body.csv_content || req.body.csvText) {
    const text = req.body.csv_text || req.body.csv_content || req.body.csvText;
    const parsed = parseCsv(text);
    rawRows = parsed.rows;
  }

  if (!rawRows || rawRows.length === 0) {
    return res.status(400).json({ error: 'No data rows provided for import.' });
  }

  let importedCount = 0;
  const failedRows: Array<{ row: number; reason: string }> = [];

  rawRows.forEach((row, index) => {
    const rowNum = index + 2;

    try {
      if (entityType === 'student') {
        const name = (row['canonical_name'] || row['name'] || row['full_name'] || '').trim();
        const rawClass = row['canonical_class'] || row['class'] || row['class_name'] || 'Class 1';
        const rawSection = row['canonical_section'] || row['section'] || row['section_name'] || 'A';
        const parentName = (row['parent_name'] || row['parent'] || '').trim();
        const parentPhone = (row['parent_phone'] || row['phone'] || '').trim();

        if (!name) {
          failedRows.push({ row: rowNum, reason: 'Missing Student Name' });
          return;
        }

        const idNum = (
          row['canonical_id'] ||
          row['student_id'] ||
          row['id_number'] ||
          `STU${Math.floor(20000 + Math.random() * 80000)}`
        ).trim().toUpperCase();

        const email = (
          row['canonical_email'] ||
          row['email'] ||
          `${name.toLowerCase().replace(/\s+/g, '.')}.${idNum.toLowerCase()}@student.org`
        ).trim().toLowerCase();

        // Match Class
        const cls =
          db.classes.find(
            (c) =>
              c.id.toLowerCase() === rawClass.toLowerCase() ||
              c.name.toLowerCase() === rawClass.toLowerCase() ||
              c.grade.toString() === rawClass.replace(/\D/g, '')
          ) || db.classes[0];

        // Match Section
        const secClean = rawSection.trim().toUpperCase();
        const secLetter = secClean.replace(/.*-/, '').replace(/.*\d+/, '');
        let sec = db.sections.find(
          (s) =>
            s.id.toLowerCase() === rawSection.toLowerCase() ||
            s.full_name.toLowerCase() === rawSection.toLowerCase() ||
            s.id.replace(/-/g, '').toLowerCase() === rawSection.replace(/-/g, '').toLowerCase() ||
            s.full_name.replace(/-/g, '').toLowerCase() === rawSection.replace(/-/g, '').toLowerCase() ||
            (s.class_id === cls.id && s.name.toUpperCase() === secLetter)
        );
        if (!sec) {
          sec =
            db.sections.find((s) => s.class_id === cls.id && s.name.toUpperCase() === secLetter) ||
            db.sections.find((s) => s.class_id === cls.id) ||
            db.sections[0];
        }

        // Generate clean temporary password:
        // - "student" + roll number / ID digits (e.g. "student20021") OR
        // - Parent's mobile number (e.g. "9123450020")
        const idDigits = idNum.replace(/\D/g, '') || idNum.toLowerCase().replace(/\s+/g, '');
        const parentDigits = parentPhone.replace(/\D/g, '').slice(-10);

        let tempPassword = row['password'];
        if (!tempPassword) {
          if (passwordScheme === 'parent_mobile' && parentDigits.length >= 10) {
            tempPassword = parentDigits;
          } else {
            // Default: student and their roll number
            tempPassword = `student${idDigits || Math.floor(10000 + Math.random() * 90000)}`;
          }
        }

        // Check if student profile already exists in db.profiles
        let student = db.profiles.find((p) => p.id_number === idNum || p.email.toLowerCase() === email);
        if (student) {
          student.full_name = name;
          student.class_id = cls.id;
          student.class_name = cls.name;
          student.section_id = sec.id;
          student.section_name = sec.full_name;
          student.parent_name = parentName || student.parent_name;
          student.parent_phone = parentPhone || student.parent_phone;
          student.updated_at = new Date().toISOString();
        } else {
          // STRICT RULE: "Add them to the database after they login into the system other than dont add."
          // Do NOT add to db.profiles yet! Stage in db.pending_onboarding_accounts.
          const existingPendingIdx = db.pending_onboarding_accounts.findIndex(
            (p) => p.id_number.toUpperCase() === idNum.toUpperCase() || p.email.toLowerCase() === email.toLowerCase()
          );

          const pendingAccount: PendingOnboardingAccount = {
            id: existingPendingIdx >= 0 ? db.pending_onboarding_accounts[existingPendingIdx].id : `pending-stu-${idNum.toLowerCase()}`,
            name,
            role: 'student',
            id_number: idNum,
            email,
            password: row['password'] || (existingPendingIdx >= 0 ? db.pending_onboarding_accounts[existingPendingIdx].password : tempPassword),
            class_id: cls.id,
            class_name: cls.name,
            section_id: sec.id,
            section_name: sec.full_name,
            parent_name: parentName,
            parent_phone: parentPhone,
            phone: parentPhone,
            status: 'pending_login',
            created_at: new Date().toISOString(),
          };

          if (existingPendingIdx >= 0) {
            db.pending_onboarding_accounts[existingPendingIdx] = pendingAccount;
          } else {
            db.pending_onboarding_accounts.push(pendingAccount);
          }
        }

        importedCount++;
      } else if (entityType === 'teacher') {
        const name = (row['canonical_name'] || row['name'] || '').trim();
        const idNum = (row['canonical_id'] || row['canonical_teacher_id'] || `TCH${Math.floor(1000 + Math.random() * 9000)}`).trim().toUpperCase();
        const email = (row['canonical_email'] || row['email'] || `${name.toLowerCase().replace(/\s+/g, '.')}@school.org`).trim().toLowerCase();
        const phone = row['phone'] || row['contact'];
        const rawSubject = row['canonical_subject'] || row['subject'];
        const rawSection = row['canonical_section'] || row['section'];

        if (!name) {
          failedRows.push({ row: rowNum, reason: 'Teacher name is required' });
          return;
        }

        const idDigits = idNum.replace(/\D/g, '') || idNum.toLowerCase().replace(/\s+/g, '');
        const tempPassword = row['password'] || `teacher${idDigits || Math.floor(1000 + Math.random() * 9000)}`;

        let teacher = db.profiles.find((p) => p.id_number === idNum || p.email.toLowerCase() === email);
        if (teacher) {
          teacher.full_name = name;
          teacher.phone = phone || teacher.phone;
          teacher.updated_at = new Date().toISOString();
        } else {
          // STRICT RULE: "Add them to the database after they login into the system other than dont add."
          // Do NOT add to db.profiles yet! Stage in db.pending_onboarding_accounts.
          const sec = rawSection
            ? db.sections.find((s) => s.full_name.toLowerCase() === rawSection.toLowerCase() || s.id.toLowerCase() === rawSection.toLowerCase())
            : undefined;

          const existingPendingIdx = db.pending_onboarding_accounts.findIndex(
            (p) => p.id_number.toUpperCase() === idNum.toUpperCase() || p.email.toLowerCase() === email.toLowerCase()
          );

          const pendingAccount: PendingOnboardingAccount = {
            id: existingPendingIdx >= 0 ? db.pending_onboarding_accounts[existingPendingIdx].id : `pending-tch-${idNum.toLowerCase()}`,
            name,
            role: 'teacher',
            id_number: idNum,
            email,
            password: row['password'] || (existingPendingIdx >= 0 ? db.pending_onboarding_accounts[existingPendingIdx].password : tempPassword),
            phone,
            subject: rawSubject,
            section_id: sec?.id,
            section_name: sec?.full_name,
            class_id: sec?.class_id,
            status: 'pending_login',
            created_at: new Date().toISOString(),
          };

          if (existingPendingIdx >= 0) {
            db.pending_onboarding_accounts[existingPendingIdx] = pendingAccount;
          } else {
            db.pending_onboarding_accounts.push(pendingAccount);
          }
        }

        importedCount++;
      } else if (entityType === 'parent') {
        const name = (row['canonical_name'] || row['name'] || '').trim();
        const idNum = (row['canonical_id'] || row['canonical_parent_id'] || `PAR${Math.floor(1000 + Math.random() * 9000)}`).trim().toUpperCase();
        const email = (row['canonical_email'] || row['email'] || `${name.toLowerCase().replace(/\s+/g, '.')}@parents.org`).trim().toLowerCase();
        const phone = row['phone'];
        const childId = (row['student_id'] || row['child_id'] || '').trim();

        if (!name) {
          failedRows.push({ row: rowNum, reason: 'Parent name is required' });
          return;
        }

        let parent = db.profiles.find((p) => p.id_number === idNum || p.email.toLowerCase() === email);
        if (!parent) {
          parent = {
            id: `par-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
            user_id: idNum,
            id_number: idNum,
            full_name: name,
            email,
            role: 'parent',
            school_id: 'SCH001',
            phone,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          db.profiles.push(parent);
        }

        if (childId) {
          const student = db.profiles.find((p) => p.role === 'student' && (p.id_number === childId || p.user_id === childId || p.id === childId));
          if (student && !db.parent_students.some((ps) => ps.parent_id === parent!.id && ps.student_id === student.id)) {
            db.parent_students.push({
              id: `ps-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
              school_id: 'SCH001',
              parent_id: parent.id,
              student_id: student.id,
              relationship: 'Parent',
              is_primary: true,
            });
          }
        }

        importedCount++;
      } else if (entityType === 'teacher_assignment') {
        const teacherId = row['canonical_teacher_id'] || row['teacher_id'] || row['canonical_id'];
        const rawSection = row['canonical_section'] || row['section'];
        const rawSubject = row['canonical_subject'] || row['subject'];

        const teacher = db.profiles.find((p) => p.role === 'teacher' && (p.id === teacherId || p.id_number === teacherId || p.email.toLowerCase() === teacherId.toLowerCase()));
        const sec = db.sections.find((s) => s.id.toLowerCase() === rawSection.toLowerCase() || s.full_name.toLowerCase() === rawSection.toLowerCase());
        const sub = db.subjects.find((s) => s.id.toLowerCase() === rawSubject.toLowerCase() || s.name.toLowerCase() === rawSubject.toLowerCase() || s.code?.toLowerCase() === rawSubject.toLowerCase());

        if (!teacher || !sec || !sub) {
          failedRows.push({ row: rowNum, reason: `Unmatched teacher, section, or subject mapping (${teacherId}, ${rawSection}, ${rawSubject})` });
          return;
        }

        db.teacher_assignments.push({
          id: `ta-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`,
          school_id: 'SCH001',
          teacher_id: teacher.id,
          class_id: sec.class_id,
          section_id: sec.id,
          subject_id: sub.id,
          is_active: true,
          created_at: new Date().toISOString(),
        });

        importedCount++;
      } else if (entityType === 'student_assignment') {
        const studentId = row['canonical_id'] || row['student_id'];
        const rawClass = row['canonical_class'] || row['class'];
        const rawSection = row['canonical_section'] || row['section'];

        const student = db.profiles.find((p) => p.role === 'student' && (p.id === studentId || p.id_number === studentId || p.email.toLowerCase() === studentId.toLowerCase()));
        const cls = db.classes.find((c) => c.id.toLowerCase() === rawClass.toLowerCase() || c.name.toLowerCase() === rawClass.toLowerCase() || c.grade.toString() === rawClass.replace(/\D/g, ''));
        const sec = db.sections.find((s) => s.id.toLowerCase() === rawSection.toLowerCase() || s.full_name.toLowerCase() === rawSection.toLowerCase());

        if (!student || !cls || !sec) {
          failedRows.push({ row: rowNum, reason: `Cannot assign student ${studentId} to class ${rawClass} and section ${rawSection}` });
          return;
        }

        student.class_id = cls.id;
        student.class_name = cls.name;
        student.section_id = sec.id;
        student.section_name = sec.full_name;
        student.updated_at = new Date().toISOString();

        importedCount++;
      }
    } catch (err: any) {
      failedRows.push({ row: rowNum, reason: err.message || 'Row import processing error' });
    }
  });

  const summary = `Successfully processed ${importedCount} ${entityType} records. Staged for login: ${importedCount}, Failed: ${failedRows.length} rows.`;
  db.logAudit('BULK_CSV_IMPORT', entityType, undefined, { imported: importedCount, failed: failedRows.length, summary }, req.user?.id);

  const credentials = getOnboardingCredentialsList();

  return res.json({
    success: true,
    entity_type: entityType,
    type: entityType,
    imported_count: importedCount,
    failed_count: failedRows.length,
    errors: failedRows,
    credentials,
    summary,
  });
});

export function getOnboardingCredentialsList() {
  return db.pending_onboarding_accounts.map((acc) => {
    const inDb = db.profiles.some(
      (p) =>
        (p.id_number && p.id_number.toUpperCase() === acc.id_number.toUpperCase()) ||
        (p.email && p.email.toLowerCase() === acc.email.toLowerCase())
    );
    return {
      id: acc.id,
      name: acc.name,
      role: acc.role,
      id_number: acc.id_number,
      email: acc.email,
      password: acc.password,
      class_id: acc.class_id,
      class_name: acc.class_name,
      section_id: acc.section_id,
      section_name: acc.section_name,
      parent_name: acc.parent_name,
      parent_phone: acc.parent_phone,
      phone: acc.phone,
      subject: acc.subject,
      status: inDb ? ('activated' as const) : ('pending_login' as const),
      in_database: inDb,
      created_at: acc.created_at,
      activated_at: acc.activated_at,
    };
  });
}

// GET /api/csv-import/credentials & /api/admin/csv-import/credentials
router.get(['/credentials', '/onboarding-credentials'], (_req: AuthenticatedRequest, res) => {
  const credentials = getOnboardingCredentialsList();
  return res.json({ credentials, total: credentials.length });
});

// POST /api/csv-import/credentials/activate/:id (force activate single account)
router.post('/credentials/activate/:id', (req: AuthenticatedRequest, res) => {
  const idOrNum = String(req.params.id || '');
  const profile = db.activatePendingAccount(idOrNum);
  if (!profile) {
    return res.status(404).json({ error: `Onboarding account "${idOrNum}" not found in staging registry.` });
  }
  return res.json({
    success: true,
    message: `Account for ${profile.full_name} (${profile.role}) successfully activated and added to database!`,
    profile,
    credentials: getOnboardingCredentialsList(),
  });
});

// POST /api/csv-import/credentials/activate-all (force activate all pending accounts)
router.post('/credentials/activate-all', (_req: AuthenticatedRequest, res) => {
  let count = 0;
  for (const acc of [...db.pending_onboarding_accounts]) {
    if (acc.status === 'pending_login') {
      const p = db.activatePendingAccount(acc.id);
      if (p) count++;
    }
  }
  return res.json({
    success: true,
    activated_count: count,
    message: `Successfully activated ${count} accounts and added them to database profiles.`,
    credentials: getOnboardingCredentialsList(),
  });
});

// DELETE /api/csv-import/credentials/:id (remove staged account)
router.delete('/credentials/:id', (req: AuthenticatedRequest, res) => {
  const target = String(req.params.id || '');
  const idx = db.pending_onboarding_accounts.findIndex(
    (p) => p.id === target || p.id_number.toUpperCase() === target.toUpperCase() || p.email.toLowerCase() === target.toLowerCase()
  );
  if (idx >= 0) {
    const deleted = db.pending_onboarding_accounts.splice(idx, 1)[0];
    return res.json({ success: true, message: `Removed staged account ${deleted.name}`, deleted, credentials: getOnboardingCredentialsList() });
  }
  return res.status(404).json({ error: 'Account not found in staging list' });
});

export default router;
