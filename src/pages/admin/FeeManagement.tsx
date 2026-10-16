import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { FeeStructure, StudentFeeRecord, FeePayment, UserProfile, SchoolClass } from '../../types';
import { BrutalCard } from '../../components/BrutalCard';
import { BrutalButton } from '../../components/BrutalButton';
import {
  DollarSign,
  Plus,
  Receipt,
  CheckCircle,
  AlertCircle,
  Clock,
  Printer,
  X,
  CreditCard,
  RefreshCw,
} from 'lucide-react';

export const FeeManagement: React.FC = () => {
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [studentFees, setStudentFees] = useState<StudentFeeRecord[]>([]);
  const [students, setStudents] = useState<UserProfile[]>([]);
  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Record Payment Modal
  const [showPayModal, setShowPayModal] = useState(false);
  const [payStudentId, setPayStudentId] = useState('');
  const [payStructureId, setPayStructureId] = useState('');
  const [payAmount, setPayAmount] = useState('15000');
  const [payMode, setPayMode] = useState('UPI');
  const [payRef, setPayRef] = useState('TXN-' + Math.floor(100000 + Math.random() * 900000));
  const [submittingPayment, setSubmittingPayment] = useState(false);

  // Active Receipt Modal
  const [activeReceipt, setActiveReceipt] = useState<{
    receipt_number: string;
    student_name: string;
    student_id: string;
    amount: number;
    payment_mode: string;
    date: string;
  } | null>(null);

  // Add Fee Structure Modal
  const [showAddStructureModal, setShowAddStructureModal] = useState(false);
  const [structTitle, setStructTitle] = useState('');
  const [structClassId, setStructClassId] = useState('CLS001');
  const [structAmount, setStructAmount] = useState('25000');
  const [structDueDate, setStructDueDate] = useState('2026-11-30');

  const loadData = async () => {
    try {
      setLoading(true);
      const [structList, feeRecords, userList, classList] = await Promise.all([
        api.getFeeStructures(),
        api.getStudentFees(),
        api.getAdminUsers(),
        api.getClasses(),
      ]);
      setFeeStructures(structList);
      setStudentFees(feeRecords);
      setStudents(userList.filter((u) => u.role === 'student'));
      setClasses(classList);

      if (structList.length > 0) setPayStructureId(structList[0].id);
      if (userList.filter((u) => u.role === 'student').length > 0) {
        setPayStudentId(userList.filter((u) => u.role === 'student')[0].id);
      }
    } catch (err: any) {
      console.error(err);
      setFeedback({ type: 'error', message: 'Failed to load fee records' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payStudentId || !payStructureId || !payAmount) return;
    try {
      setSubmittingPayment(true);
      const res = await api.recordFeePayment({
        student_id: payStudentId,
        fee_structure_id: payStructureId,
        amount: parseFloat(payAmount),
        payment_mode: payMode,
        transaction_ref: payRef,
      });

      const stu = students.find((s) => s.id === payStudentId);
      setActiveReceipt({
        receipt_number: res.receipt_number,
        student_name: stu?.full_name || payStudentId,
        student_id: stu?.id_number || payStudentId,
        amount: parseFloat(payAmount),
        payment_mode: payMode,
        date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
      });

      setFeedback({ type: 'success', message: `Payment processed! Receipt #${res.receipt_number} issued.` });
      setShowPayModal(false);
      loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Payment processing failed' });
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleCreateStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!structTitle.trim()) return;
    try {
      await api.createFeeStructure({
        title: structTitle.trim(),
        class_id: structClassId,
        amount: parseFloat(structAmount),
        due_date: structDueDate,
      });
      setFeedback({ type: 'success', message: 'Fee structure created successfully.' });
      setShowAddStructureModal(false);
      setStructTitle('');
      loadData();
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to create fee structure' });
    }
  };

  const totalExpected = studentFees.reduce((acc, f) => acc + (f.total_fee || 0), 0);
  const totalCollected = studentFees.reduce((acc, f) => acc + (f.paid_amount || 0), 0);
  const totalPending = studentFees.reduce((acc, f) => acc + (f.pending_amount || 0), 0);

  return (
    <div className="space-y-6 font-mono">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b-2 border-[#0F172A]">
        <div>
          <h1 className="text-2xl font-black text-[#0F172A] tracking-tight uppercase flex items-center gap-2">
            <DollarSign className="w-7 h-7" /> Fee & Revenue Management
          </h1>
          <p className="text-xs text-slate-600 font-bold mt-1">
            Institutional fee structures, student ledgers, automated receipts, and payment status tracking
          </p>
        </div>
        <div className="flex items-center gap-2">
          <BrutalButton
            variant="neutral"
            size="small"
            onClick={loadData}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            REFRESH
          </BrutalButton>
          <BrutalButton
            variant="secondary"
            size="small"
            onClick={() => setShowAddStructureModal(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            NEW FEE STRUCTURE
          </BrutalButton>
          <BrutalButton
            variant="primary"
            size="small"
            onClick={() => setShowPayModal(true)}
            icon={<Receipt className="w-4 h-4" />}
          >
            RECORD PAYMENT
          </BrutalButton>
        </div>
      </div>

      {feedback && (
        <div
          className={`p-3 border-2 border-[#0F172A] text-xs font-bold flex items-center justify-between shadow-[2px_2px_0px_#0F172A] ${
            feedback.type === 'success' ? 'bg-[#A7F3D0] text-[#0F172A]' : 'bg-rose-100 text-rose-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="font-extrabold uppercase text-[10px]">
            [DISMISS]
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <BrutalCard size="small" accent="yellow" className="p-4">
          <div className="text-[10px] font-extrabold uppercase text-slate-600">Total Billed Fees</div>
          <div className="text-2xl font-black text-[#0F172A] mt-1">₹{totalExpected.toLocaleString('en-IN')}</div>
          <div className="text-[10px] text-slate-500 font-bold mt-0.5">Enrolled Student Cohort</div>
        </BrutalCard>
        <BrutalCard size="small" accent="mint" className="p-4">
          <div className="text-[10px] font-extrabold uppercase text-slate-600">Total Collected</div>
          <div className="text-2xl font-black text-emerald-700 mt-1">₹{totalCollected.toLocaleString('en-IN')}</div>
          <div className="text-[10px] text-emerald-800 font-bold mt-0.5">
            {totalExpected > 0 ? Math.round((totalCollected / totalExpected) * 100) : 0}% Realization Rate
          </div>
        </BrutalCard>
        <BrutalCard size="small" accent="lavender" className="p-4">
          <div className="text-[10px] font-extrabold uppercase text-slate-600">Outstanding Pending</div>
          <div className="text-2xl font-black text-rose-700 mt-1">₹{totalPending.toLocaleString('en-IN')}</div>
          <div className="text-[10px] text-rose-800 font-bold mt-0.5">Automated Reminders Enabled</div>
        </BrutalCard>
      </div>

      {/* Student Fee Records Table */}
      <div className="bg-white border-2 border-[#0F172A] shadow-[4px_4px_0px_#0F172A] overflow-hidden">
        <div className="p-3 bg-[#FEFCE8] border-b-2 border-[#0F172A] flex justify-between items-center text-xs font-black uppercase">
          <span>Student Fee Ledgers ({studentFees.length} records)</span>
          <span className="text-[10px] px-2 py-0.5 bg-[#A7F3D0] border border-[#0F172A]">
            INSTANT_RECEIPTS_AVAILABLE
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-bold">
            <thead className="bg-[#C4B5FD] border-b-2 border-[#0F172A] text-[10px] uppercase">
              <tr>
                <th className="p-3 border-r border-[#0F172A]">Student</th>
                <th className="p-3 border-r border-[#0F172A]">Class & Section</th>
                <th className="p-3 border-r border-[#0F172A]">Total Billed</th>
                <th className="p-3 border-r border-[#0F172A]">Paid Amount</th>
                <th className="p-3 border-r border-[#0F172A]">Pending Balance</th>
                <th className="p-3 border-r border-[#0F172A]">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0F172A]">
              {studentFees.map((f) => (
                <tr key={f.id} className="hover:bg-slate-50">
                  <td className="p-3 border-r border-[#0F172A]">
                    <div className="font-extrabold text-[#0F172A]">{f.student_name || f.student_id}</div>
                    <div className="text-[10px] text-slate-500 font-mono">ID: {f.student_id}</div>
                  </td>
                  <td className="p-3 border-r border-[#0F172A]">
                    <span className="px-2 py-0.5 bg-[#FEFCE8] border border-[#0F172A]">
                      {f.class_id} // {f.section_id || '1-A'}
                    </span>
                  </td>
                  <td className="p-3 border-r border-[#0F172A] font-mono">
                    ₹{f.total_fee.toLocaleString('en-IN')}
                  </td>
                  <td className="p-3 border-r border-[#0F172A] font-mono text-emerald-700">
                    ₹{f.paid_amount.toLocaleString('en-IN')}
                  </td>
                  <td className="p-3 border-r border-[#0F172A] font-mono text-rose-700">
                    ₹{f.pending_amount.toLocaleString('en-IN')}
                  </td>
                  <td className="p-3 border-r border-[#0F172A]">
                    <span
                      className={`text-[10px] px-2 py-0.5 border border-[#0F172A] font-extrabold uppercase ${
                        f.status === 'paid'
                          ? 'bg-[#A7F3D0] text-[#0F172A]'
                          : f.status === 'partial'
                          ? 'bg-[#FDE68A] text-[#0F172A]'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {f.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => {
                        setPayStudentId(f.student_id);
                        setPayAmount(String(f.pending_amount || 5000));
                        setShowPayModal(true);
                      }}
                      className="px-2 py-1 bg-[#0F172A] text-white hover:bg-slate-800 text-[10px] font-extrabold uppercase shadow-[1.5px_1.5px_0px_#FDE68A]"
                    >
                      COLLECT
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable Receipt Modal */}
      {activeReceipt && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <BrutalCard size="medium" accent="yellow" className="w-full max-w-md p-6 bg-white relative">
            <button
              onClick={() => setActiveReceipt(null)}
              className="absolute top-4 right-4 p-1 border-2 border-[#0F172A] bg-white hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Receipt Content */}
            <div className="p-4 border-2 border-[#0F172A] bg-[#FEFCE8] text-center mb-4">
              <div className="text-[10px] font-extrabold uppercase text-slate-600">OFFICIAL FEE RECEIPT</div>
              <h2 className="text-xl font-black text-[#0F172A] uppercase">Smart School International</h2>
              <div className="text-[10px] font-mono text-slate-500 mt-0.5">CBSE & State Board Curriculum // SCH001</div>
              <div className="my-2 border-b-2 border-[#0F172A] border-dashed" />
              <div className="flex justify-between text-xs font-bold">
                <span>Receipt No:</span>
                <span className="font-mono font-black">{activeReceipt.receipt_number}</span>
              </div>
              <div className="flex justify-between text-xs font-bold mt-1">
                <span>Date:</span>
                <span>{activeReceipt.date}</span>
              </div>
            </div>

            <div className="space-y-2 text-xs font-bold mb-4">
              <div className="flex justify-between p-2 bg-white border border-[#0F172A]">
                <span className="text-slate-600">Student Name:</span>
                <span className="font-extrabold text-[#0F172A]">{activeReceipt.student_name}</span>
              </div>
              <div className="flex justify-between p-2 bg-white border border-[#0F172A]">
                <span className="text-slate-600">Student ID:</span>
                <span className="font-mono">{activeReceipt.student_id}</span>
              </div>
              <div className="flex justify-between p-2 bg-white border border-[#0F172A]">
                <span className="text-slate-600">Payment Mode:</span>
                <span>{activeReceipt.payment_mode}</span>
              </div>
              <div className="flex justify-between p-2.5 bg-[#A7F3D0] border-2 border-[#0F172A] text-sm">
                <span className="font-black text-[#0F172A]">Amount Paid:</span>
                <span className="font-black text-[#0F172A] font-mono">
                  ₹{activeReceipt.amount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <BrutalButton
                variant="primary"
                size="small"
                onClick={() => window.print()}
                icon={<Printer className="w-3.5 h-3.5" />}
              >
                PRINT RECEIPT
              </BrutalButton>
              <BrutalButton variant="neutral" size="small" onClick={() => setActiveReceipt(null)}>
                CLOSE
              </BrutalButton>
            </div>
          </BrutalCard>
        </div>
      )}

      {/* Record Payment Modal */}
      {showPayModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <BrutalCard size="medium" accent="mint" className="w-full max-w-md p-6 bg-white">
            <h3 className="text-base font-black text-[#0F172A] uppercase pb-2 border-b-2 border-[#0F172A] mb-4">
              Record Student Fee Payment
            </h3>
            <form onSubmit={handleRecordPayment} className="space-y-3 text-xs font-bold">
              <div>
                <label className="block text-[#0F172A] mb-1 uppercase">Select Student</label>
                <select
                  value={payStudentId}
                  onChange={(e) => setPayStudentId(e.target.value)}
                  required
                  className="w-full p-2 bg-white border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] focus:outline-none"
                >
                  <option value="">-- Choose Student --</option>
                  {students.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.full_name} ({s.id_number || s.email})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[#0F172A] mb-1 uppercase">Fee Structure</label>
                <select
                  value={payStructureId}
                  onChange={(e) => setPayStructureId(e.target.value)}
                  required
                  className="w-full p-2 bg-white border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] focus:outline-none"
                >
                  {feeStructures.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.title} (₹{f.amount})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#0F172A] mb-1 uppercase">Amount (₹)</label>
                  <input
                    type="number"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    required
                    min="1"
                    className="w-full p-2 bg-white border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] focus:outline-none font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[#0F172A] mb-1 uppercase">Payment Mode</label>
                  <select
                    value={payMode}
                    onChange={(e) => setPayMode(e.target.value)}
                    className="w-full p-2 bg-white border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] focus:outline-none"
                  >
                    <option value="UPI">UPI</option>
                    <option value="Cash">Cash</option>
                    <option value="Net Banking">Net Banking</option>
                    <option value="Card">Debit / Credit Card</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[#0F172A] mb-1 uppercase">Transaction / Ref Number</label>
                <input
                  type="text"
                  value={payRef}
                  onChange={(e) => setPayRef(e.target.value)}
                  className="w-full p-2 bg-white border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] focus:outline-none font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <BrutalButton variant="neutral" size="small" onClick={() => setShowPayModal(false)}>
                  CANCEL
                </BrutalButton>
                <BrutalButton variant="primary" size="small" type="submit" disabled={submittingPayment}>
                  {submittingPayment ? 'PROCESSING...' : 'PROCESS PAYMENT'}
                </BrutalButton>
              </div>
            </form>
          </BrutalCard>
        </div>
      )}

      {/* Add Fee Structure Modal */}
      {showAddStructureModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <BrutalCard size="medium" accent="yellow" className="w-full max-w-md p-6 bg-white">
            <h3 className="text-base font-black text-[#0F172A] uppercase pb-2 border-b-2 border-[#0F172A] mb-4">
              Add School Fee Structure
            </h3>
            <form onSubmit={handleCreateStructure} className="space-y-3 text-xs font-bold">
              <div>
                <label className="block text-[#0F172A] mb-1 uppercase">Title (e.g. Annual Tuition Fee)</label>
                <input
                  type="text"
                  value={structTitle}
                  onChange={(e) => setStructTitle(e.target.value)}
                  required
                  placeholder="e.g. Term 1 Tuition Fee"
                  className="w-full p-2 bg-white border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#0F172A] mb-1 uppercase">Target Class</label>
                  <select
                    value={structClassId}
                    onChange={(e) => setStructClassId(e.target.value)}
                    className="w-full p-2 bg-white border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] focus:outline-none"
                  >
                    {classes.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[#0F172A] mb-1 uppercase">Amount (₹)</label>
                  <input
                    type="number"
                    value={structAmount}
                    onChange={(e) => setStructAmount(e.target.value)}
                    required
                    min="1"
                    className="w-full p-2 bg-white border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[#0F172A] mb-1 uppercase">Due Date</label>
                <input
                  type="date"
                  value={structDueDate}
                  onChange={(e) => setStructDueDate(e.target.value)}
                  required
                  className="w-full p-2 bg-white border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A] focus:outline-none font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <BrutalButton variant="neutral" size="small" onClick={() => setShowAddStructureModal(false)}>
                  CANCEL
                </BrutalButton>
                <BrutalButton variant="primary" size="small" type="submit">
                  SAVE STRUCTURE
                </BrutalButton>
              </div>
            </form>
          </BrutalCard>
        </div>
      )}
    </div>
  );
};
export default FeeManagement;
