import { Router } from 'express';
import { db, Profile, TeacherAssignment, ParentStudent } from '../db/store.js';
import { requireAdmin, AuthenticatedRequest } from '../middleware/authScope.js';

const router = Router();

interface CsvRowValidation {
  row_number: number;
  data: Record<string, string>;
  is_valid: boolean;
  errors: string[];
}

function parseCsv(csvText: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = csvText.trim().split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return { headers: [], rows: [] };

  const headers = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, '').toLowerCase().replace(/\s+/g, '_'));
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    // Basic CSV splitting handling commas
    const parts = lines[i].split(',').map((p) => p.trim().replace(/^["']|["']$/g, ''));
    const rowObj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      rowObj[h] = parts[idx] !== undefined ? parts[idx] : '';
    });
    rows.push(rowObj);
  }

  return { headers, rows };
}

// POST /api/admin/csv-preview - Parses and validates CSV row-by-row before committing
router.post('/csv-preview', requireAdmin, (req: AuthenticatedRequest, res) => {
  const { csv_content, entity_type } = req.body;

  if (!csv_content || !entity_type) {
    return res.status(400).json({ error: 'csv_content and entity_type (students | teachers | parents | assignments) are required' });
  }

  const { headers, rows } = parseCsv(csv_content);
  if (rows.length === 0) {
    return res.status(400).json({ error: 'No data rows found in CSV' });
  }

  const validations: CsvRowValidation[] = [];
  const seenEmails = new Set<string>();
  const seenIds = new Set<string>();

  rows.forEach((row, index) => {
    const rowNum = index + 2; // +1 for 0-index, +1 for header line
    const errors: string[] = [];

    if (entity_type === 'students') {
      const name = row.name || row.full_name;
      const email = row.email?.toLowerCase();
      const idNumber = row.student_id || row.id_number;
      const className = row.class || row.class_name;
      const sectionName = row.section || row.section_name;

      if (!name) errors.push('Missing Student Name');
      if (!email) errors.push('Missing Email');
      else if (!email.includes('@')) errors.push('Invalid email format');
      else {
        if (seenEmails.has(email) || db.profiles.some((p) => p.email.toLowerCase() === email)) {
          errors.push(`Duplicate email: ${email}`);
        }
        seenEmails.add(email);
      }

      if (idNumber) {
        if (seenIds.has(idNumber) || db.profiles.some((p) => p.id_number === idNumber || p.user_id === idNumber)) {
          errors.push(`Duplicate Student ID: ${idNumber}`);
        }
        seenIds.add(idNumber);
      }

      if (!className) errors.push('Missing Class (e.g. Class 1 or 1)');
      else {
        const clsFound = db.classes.find(
          (c) => c.name.toLowerCase() === className.toLowerCase() || c.grade.toString() === className.replace(/\D/g, '')
        );
        if (!clsFound) errors.push(`Class "${className}" does not exist in system`);
      }

      if (sectionName) {
        const secLetter = sectionName.trim().toUpperCase().replace(/.*-/, '');
        const secFound = db.sections.some((s) => s.name === secLetter || s.full_name.toLowerCase() === sectionName.toLowerCase());
        if (!secFound) errors.push(`Section "${sectionName}" not recognized`);
      }
    } else if (entity_type === 'teachers') {
      const name = row.name || row.full_name;
      const email = row.email?.toLowerCase();
      const idNumber = row.teacher_id || row.id_number;
      const subject = row.subject || row.subject_name;

      if (!name) errors.push('Missing Teacher Name');
      if (!email || !email.includes('@')) errors.push('Valid email required');
      else {
        if (seenEmails.has(email) || db.profiles.some((p) => p.email.toLowerCase() === email)) {
          errors.push(`Duplicate email: ${email}`);
        }
        seenEmails.add(email);
      }

      if (idNumber) {
        if (seenIds.has(idNumber) || db.profiles.some((p) => p.id_number === idNumber || p.user_id === idNumber)) {
          errors.push(`Duplicate Teacher ID: ${idNumber}`);
        }
        seenIds.add(idNumber);
      }

      if (subject) {
        const subFound = db.subjects.some((s) => s.name.toLowerCase() === subject.toLowerCase());
        if (!subFound) errors.push(`Subject "${subject}" is not in the subjects catalog`);
      }
    } else if (entity_type === 'parents') {
      const name = row.parent_name || row.name || row.full_name;
      const email = row.email?.toLowerCase();
      const studentId = row.student_id || row.child_id;

      if (!name) errors.push('Missing Parent Name');
      if (!email || !email.includes('@')) errors.push('Valid parent email required');
      if (!studentId) errors.push('Missing Child/Student ID');
      else {
        const stFound = db.profiles.find((p) => p.role === 'student' && (p.id_number === studentId || p.user_id === studentId || p.id === studentId));
        if (!stFound) errors.push(`Child with ID "${studentId}" not found in students directory`);
      }
    } else if (entity_type === 'assignments') {
      const teacherId = row.teacher_id || row.teacher_email;
      const sectionName = row.section || row.section_id;
      const subjectName = row.subject || row.subject_name;

      if (!teacherId) errors.push('Missing Teacher ID or Email');
      else {
        const tFound = db.profiles.find((p) => p.role === 'teacher' && (p.id === teacherId || p.id_number === teacherId || p.email.toLowerCase() === teacherId.toLowerCase()));
        if (!tFound) errors.push(`Teacher "${teacherId}" not found`);
      }

      if (!sectionName) errors.push('Missing Section (e.g. 1-A)');
      else {
        const sFound = db.sections.find((s) => s.id === sectionName || s.full_name.toLowerCase() === sectionName.toLowerCase());
        if (!sFound) errors.push(`Section "${sectionName}" not found`);
      }

      if (!subjectName) errors.push('Missing Subject');
      else {
        const subFound = db.subjects.find((s) => s.id === subjectName || s.name.toLowerCase() === subjectName.toLowerCase());
        if (!subFound) errors.push(`Subject "${subjectName}" not found`);
      }
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
    entity_type,
    total_rows: rows.length,
    valid_count: validCount,
    invalid_count: invalidCount,
    headers,
    preview: validations,
  });
});

// POST /api/admin/csv-import - Commits verified CSV data into database
router.post('/csv-import', requireAdmin, (req: AuthenticatedRequest, res) => {
  const { csv_content, entity_type } = req.body;

  if (!csv_content || !entity_type) {
    return res.status(400).json({ error: 'csv_content and entity_type are required' });
  }

  const { rows } = parseCsv(csv_content);
  let importedCount = 0;
  const failedRows: Array<{ row: number; reason: string }> = [];

  rows.forEach((row, index) => {
    const rowNum = index + 2;

    try {
      if (entity_type === 'students') {
        const name = (row.name || row.full_name || '').trim();
        const email = (row.email || '').trim().toLowerCase();
        const rawClass = row.class || row.class_name || 'Class 1';
        const rawSection = row.section || row.section_name || 'A';

        if (!name || !email) {
          failedRows.push({ row: rowNum, reason: 'Missing name or email' });
          return;
        }

        const cls = db.classes.find(
          (c) => c.name.toLowerCase() === rawClass.toLowerCase() || c.grade.toString() === rawClass.replace(/\D/g, '')
        ) || db.classes[0];

        const secLetter = rawSection.trim().toUpperCase().replace(/.*-/, '');
        let sec = db.sections.find((s) => s.class_id === cls.id && s.name === secLetter);
        if (!sec) {
          sec = db.sections.find((s) => s.class_id === cls.id) || db.sections[0];
        }

        const idNum = (row.student_id || row.id_number || `STU${Math.floor(10000 + Math.random() * 90000)}`).trim().toUpperCase();

        const newStudent: Profile = {
          id: `stu-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`,
          user_id: idNum,
          id_number: idNum,
          full_name: name,
          email,
          role: 'student',
          school_id: 'SCH001',
          class_id: cls.id,
          class_name: cls.name,
          section_id: sec.id,
          section_name: sec.full_name,
          phone: row.phone || row.parent_phone,
          parent_name: row.parent_name,
          parent_phone: row.parent_phone,
          batch: row.batch || 'Batch 2025-2026',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        db.profiles.push(newStudent);
        importedCount++;
      } else if (entity_type === 'teachers') {
        const name = (row.name || row.full_name || '').trim();
        const email = (row.email || '').trim().toLowerCase();
        const idNum = (row.teacher_id || row.id_number || `TCH${Math.floor(1000 + Math.random() * 9000)}`).trim().toUpperCase();

        if (!name || !email) {
          failedRows.push({ row: rowNum, reason: 'Missing name or email' });
          return;
        }

        const newTeacher: Profile = {
          id: `tch-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`,
          user_id: idNum,
          id_number: idNum,
          full_name: name,
          email,
          role: 'teacher',
          school_id: 'SCH001',
          phone: row.phone,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        db.profiles.push(newTeacher);

        // Auto-assign subject and section if provided in CSV
        const rawSubject = row.subject || row.subject_name;
        const rawSection = row.section || row.section_name;

        if (rawSubject && rawSection) {
          const sub = db.subjects.find((s) => s.name.toLowerCase() === rawSubject.toLowerCase());
          const sec = db.sections.find((s) => s.full_name.toLowerCase() === rawSection.toLowerCase());

          if (sub && sec) {
            db.teacher_assignments.push({
              id: `ta-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`,
              school_id: 'SCH001',
              teacher_id: newTeacher.id,
              class_id: sec.class_id,
              section_id: sec.id,
              subject_id: sub.id,
              is_active: true,
              created_at: new Date().toISOString(),
            });
          }
        }

        importedCount++;
      } else if (entity_type === 'parents') {
        const name = (row.parent_name || row.name || '').trim();
        const email = (row.email || '').trim().toLowerCase();
        const childId = (row.student_id || row.child_id || '').trim();

        if (!name || !email || !childId) {
          failedRows.push({ row: rowNum, reason: 'Parent name, email, and child ID required' });
          return;
        }

        const student = db.profiles.find((p) => p.role === 'student' && (p.id_number === childId || p.user_id === childId || p.id === childId));
        if (!student) {
          failedRows.push({ row: rowNum, reason: `Child with ID ${childId} not found` });
          return;
        }

        // Check if parent account already exists
        let parent = db.profiles.find((p) => p.role === 'parent' && p.email.toLowerCase() === email);
        if (!parent) {
          const idNum = `PAR${Math.floor(1000 + Math.random() * 9000)}`;
          parent = {
            id: `par-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`,
            user_id: idNum,
            id_number: idNum,
            full_name: name,
            email,
            role: 'parent',
            school_id: 'SCH001',
            phone: row.phone,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };
          db.profiles.push(parent);
        }

        // Link parent to student
        const isLinked = db.parent_students.some((ps) => ps.parent_id === parent!.id && ps.student_id === student.id);
        if (!isLinked) {
          db.parent_students.push({
            id: `ps-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`,
            school_id: 'SCH001',
            parent_id: parent.id,
            student_id: student.id,
            relationship: row.relationship || 'Parent',
            is_primary: true,
          });
        }

        importedCount++;
      }
    } catch (err: any) {
      failedRows.push({ row: rowNum, reason: err.message || 'Row processing error' });
    }
  });

  const summary = `Successfully imported ${importedCount} ${entity_type}. Failed: ${failedRows.length} rows.`;
  db.logAudit('BULK_CSV_IMPORT', entity_type, undefined, { imported: importedCount, failed: failedRows.length, summary }, req.user?.id);

  return res.json({
    success: true,
    entity_type,
    imported_count: importedCount,
    failed_count: failedRows.length,
    errors: failedRows,
    summary,
  });
});

export default router;
