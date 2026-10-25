import { Router } from 'express';
import { db, FeeStructure, StudentFeeRecord, FeePayment } from '../db/store.js';
import { requireAdmin, extractUser, AuthenticatedRequest } from '../middleware/authScope.js';

const router = Router();

// GET /api/fees/structures - Fee structures
router.get('/structures', (_req, res) => {
  const enriched = db.fee_structures.map((fs) => {
    const cls = db.classes.find((c) => c.id === fs.class_id);
    return {
      ...fs,
      class_name: cls?.name,
    };
  });
  return res.json(enriched);
});

// POST /api/fees/structures - Admin creates fee structure
router.post('/structures', requireAdmin, (req: AuthenticatedRequest, res) => {
  const { class_id, title, amount, due_date } = req.body;

  if (!class_id || !title || !amount || !due_date) {
    return res.status(400).json({ error: 'class_id, title, amount, and due_date are required' });
  }

  const cls = db.classes.find((c) => c.id === class_id || c.name.toLowerCase() === class_id.toLowerCase());
  const effectiveClassId = cls ? cls.id : class_id;
  const className = cls ? cls.name : `Class ${class_id}`;

  const structure: FeeStructure = {
    id: `fee-str-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`,
    school_id: 'SCH001',
    class_id: effectiveClassId,
    title: title.trim(),
    amount: parseFloat(amount),
    due_date,
    academic_year: '2025-2026',
  };

  db.fee_structures.push(structure);

  // Auto-generate pending fee records for all currently enrolled students in this class
  const classStudents = db.profiles.filter((p) => p.role === 'student' && p.class_id === effectiveClassId);
  classStudents.forEach((st) => {
    db.student_fees.push({
      id: `sf-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`,
      school_id: 'SCH001',
      student_id: st.id,
      fee_structure_id: structure.id,
      total_amount: structure.amount,
      paid_amount: 0,
      status: 'pending',
      due_date: structure.due_date,
    });
  });

  db.logAudit('CREATE_FEE_STRUCTURE', 'fee_structures', structure.id, { title, amount, class: className }, req.user?.id);

  return res.status(201).json(structure);
});

// GET /api/fees/records & /api/fees/student-records - Student fee records with parent isolation
router.get(['/records', '/student-records'], (req: AuthenticatedRequest, res) => {
  const user = extractUser(req);
  const { student_id, class_id, status } = req.query;

  let records = db.student_fees;

  if (user?.role === 'parent') {
    const myChildren = db.getParentChildren(user.id).map((c) => c.id);
    records = records.filter((r) => myChildren.includes(r.student_id));
  } else if (user?.role === 'student') {
    records = records.filter((r) => r.student_id === user.id);
  }

  if (student_id) {
    records = records.filter((r) => r.student_id === student_id);
  }

  if (class_id) {
    records = records.filter((r) => {
      const st = db.profiles.find((p) => p.id === r.student_id);
      return st?.class_id === class_id;
    });
  }

  if (status) {
    records = records.filter((r) => r.status === status);
  }

  const enriched = records.map((r) => {
    const st = db.profiles.find((p) => p.id === r.student_id);
    const fs = db.fee_structures.find((f) => f.id === r.fee_structure_id);
    const cls = st?.class_id ? db.classes.find((c) => c.id === st.class_id) : undefined;
    const sec = st?.section_id ? db.sections.find((s) => s.id === st.section_id) : undefined;

    const totalFee = (r as any).total_fee ?? r.total_amount ?? fs?.amount ?? 0;
    const paid = r.paid_amount ?? 0;
    const pending = (r as any).pending_amount ?? Math.max(0, totalFee - paid);

    return {
      ...r,
      total_fee: totalFee,
      total_amount: totalFee,
      paid_amount: paid,
      pending_amount: pending,
      student_name: st?.full_name || 'Student',
      student_id: r.student_id,
      student_id_number: st?.id_number || st?.user_id,
      class_id: cls?.id || st?.class_id || 'CLS001',
      section_id: sec?.full_name || sec?.name || '1-A',
      class_name: cls?.name,
      section_name: sec?.full_name,
      title: fs?.title || 'Academic Tuition & Facility Fee',
      payments: (db.fee_payments || []).filter((p) => p.student_fee_id === r.id),
    };
  });

  return res.json(enriched);
});

// POST /api/fees/payments & /api/fees/pay - Record a fee payment and generate receipt
router.post(['/payments', '/pay'], (req: AuthenticatedRequest, res) => {
  const { student_fee_id, student_id, fee_structure_id, amount, payment_method, payment_mode, transaction_ref } = req.body;

  if (!amount || (!student_fee_id && !student_id)) {
    return res.status(400).json({ error: 'Student identifier and payment amount are required' });
  }

  let feeRecord = student_fee_id ? db.student_fees.find((f) => f.id === student_fee_id) : undefined;
  if (!feeRecord && student_id) {
    if (fee_structure_id) {
      feeRecord = db.student_fees.find((f) => f.student_id === student_id && f.fee_structure_id === fee_structure_id);
    }
    if (!feeRecord) {
      feeRecord = db.student_fees.find((f) => f.student_id === student_id);
    }
    if (!feeRecord) {
      // Create new fee record on the fly for this student
      const structure = db.fee_structures.find((f) => f.id === fee_structure_id) || db.fee_structures[0];
      const newRec: StudentFeeRecord = {
        id: `sf-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`,
        school_id: 'SCH001',
        student_id,
        fee_structure_id: structure?.id || 'fee-str-001',
        total_amount: structure?.amount || parseFloat(amount),
        total_fee: structure?.amount || parseFloat(amount),
        paid_amount: 0,
        pending_amount: structure?.amount || parseFloat(amount),
        status: 'pending',
        due_date: structure?.due_date || new Date().toISOString().split('T')[0],
      };
      db.student_fees.push(newRec);
      feeRecord = newRec;
    }
  }

  if (!feeRecord) return res.status(404).json({ error: 'Student fee record not found' });

  const payAmount = parseFloat(amount);
  feeRecord.paid_amount += payAmount;
  feeRecord.last_payment_date = new Date().toISOString();

  const totalFee = feeRecord.total_fee ?? feeRecord.total_amount;
  if (feeRecord.paid_amount >= totalFee) {
    feeRecord.status = 'paid';
    feeRecord.pending_amount = 0;
  } else if (feeRecord.paid_amount > 0) {
    feeRecord.status = 'partial';
    feeRecord.pending_amount = Math.max(0, totalFee - feeRecord.paid_amount);
  }

  const receiptNum = `REC-2025-${Math.floor(100000 + Math.random() * 900000)}`;
  const chosenMode = payment_mode || payment_method || 'Online UPI';

  const payment: FeePayment = {
    id: `pay-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`,
    student_fee_id: feeRecord.id,
    student_id: feeRecord.student_id,
    amount: payAmount,
    payment_method: chosenMode,
    transaction_ref: transaction_ref || `TXN-${Date.now()}`,
    receipt_number: receiptNum,
    paid_at: new Date().toISOString(),
  };

  db.fee_payments.push(payment);

  // Notify student and parents
  const student = db.profiles.find((p) => p.id === feeRecord.student_id);
  const parentMappings = db.parent_students.filter((ps) => ps.student_id === feeRecord.student_id);

  parentMappings.forEach((pm) => {
    db.notifyUser(
      pm.parent_id,
      `Fee Payment Received: ₹${payAmount}`,
      `Payment of ₹${payAmount} acknowledged for ${student?.full_name}. Receipt: ${receiptNum}.`,
      'fee',
      '/parent/fees'
    );
  });

  db.logAudit('RECORD_FEE_PAYMENT', 'fee_payments', payment.id, {
    receipt: receiptNum,
    amount: payAmount,
    student: student?.full_name,
  }, req.user?.id);

  return res.status(201).json({
    message: 'Payment recorded successfully',
    receipt_number: receiptNum,
    payment,
    updated_fee_record: feeRecord,
  });
});

export default router;
