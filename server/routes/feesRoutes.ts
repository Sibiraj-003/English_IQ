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

  const cls = db.classes.find((c) => c.id === class_id);
  if (!cls) return res.status(404).json({ error: 'Class not found' });

  const structure: FeeStructure = {
    id: `fee-str-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`,
    school_id: 'SCH001',
    class_id,
    title: title.trim(),
    amount: parseFloat(amount),
    due_date,
    academic_year: '2025-2026',
  };

  db.fee_structures.push(structure);

  // Auto-generate pending fee records for all currently enrolled students in this class
  const classStudents = db.profiles.filter((p) => p.role === 'student' && p.class_id === class_id);
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

  db.logAudit('CREATE_FEE_STRUCTURE', 'fee_structures', structure.id, { title, amount, class: cls.name }, req.user?.id);

  return res.status(201).json(structure);
});

// GET /api/fees/records - Student fee records with parent isolation
router.get('/records', (req: AuthenticatedRequest, res) => {
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

    return {
      ...r,
      student_name: st?.full_name,
      student_id_number: st?.id_number || st?.user_id,
      class_name: cls?.name,
      section_name: sec?.full_name,
      title: fs?.title || 'Academic Fee',
      payments: db.fee_payments.filter((p) => p.student_fee_id === r.id),
    };
  });

  return res.json(enriched);
});

// POST /api/fees/payments - Record a fee payment and generate receipt
router.post('/payments', (req: AuthenticatedRequest, res) => {
  const { student_fee_id, amount, payment_method, transaction_ref } = req.body;

  if (!student_fee_id || !amount) {
    return res.status(400).json({ error: 'student_fee_id and payment amount are required' });
  }

  const feeRecord = db.student_fees.find((f) => f.id === student_fee_id);
  if (!feeRecord) return res.status(404).json({ error: 'Student fee record not found' });

  const payAmount = parseFloat(amount);
  feeRecord.paid_amount += payAmount;
  feeRecord.last_payment_date = new Date().toISOString();

  if (feeRecord.paid_amount >= feeRecord.total_amount) {
    feeRecord.status = 'paid';
  } else if (feeRecord.paid_amount > 0) {
    feeRecord.status = 'partial';
  }

  const receiptNum = `REC-2025-${Math.floor(100000 + Math.random() * 900000)}`;

  const payment: FeePayment = {
    id: `pay-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 5)}`,
    student_fee_id,
    student_id: feeRecord.student_id,
    amount: payAmount,
    payment_method: payment_method || 'Online Payment',
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
    payment,
    updated_fee_record: feeRecord,
  });
});

export default router;
