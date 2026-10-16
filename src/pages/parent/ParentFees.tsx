import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { StudentFeeRecord, FeePayment } from '../../types';
import { BrutalCard } from '../../components/BrutalCard';
import { BrutalButton } from '../../components/BrutalButton';
import { DollarSign, Receipt, Printer, X, CheckCircle, RefreshCw } from 'lucide-react';

export const ParentFees: React.FC = () => {
  const { user, activeChild } = useAuth();
  const [feeRecord, setFeeRecord] = useState<StudentFeeRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeReceipt, setActiveReceipt] = useState<any | null>(null);

  const studentId = activeChild?.student_id || user?.children?.[0]?.student_id || 'STU10001';

  const loadFees = async () => {
    try {
      setLoading(true);
      const res = await api.getStudentFees({ student_id: studentId });
      if (res && res.length > 0) {
        setFeeRecord(res[0]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFees();
  }, [studentId]);

  return (
    <div className="space-y-6 font-mono">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b-2 border-[#0F172A]">
        <div>
          <h1 className="text-2xl font-black text-[#0F172A] tracking-tight uppercase flex items-center gap-2">
            <DollarSign className="w-7 h-7" /> Institutional Fee Ledger & Receipts
          </h1>
          <p className="text-xs text-slate-600 font-bold mt-1">
            Official fee record, pending balance, and authorized tax receipts for {activeChild?.student_name || 'Child'}
          </p>
        </div>
        <BrutalButton
          variant="neutral"
          size="small"
          onClick={loadFees}
          icon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          REFRESH
        </BrutalButton>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <BrutalCard size="small" accent="yellow" className="p-4">
          <div className="text-[10px] font-extrabold uppercase text-slate-600">Total Billed Fees</div>
          <div className="text-2xl font-black text-[#0F172A] mt-1">
            ₹{feeRecord ? feeRecord.total_fee.toLocaleString('en-IN') : '25,000'}
          </div>
          <div className="text-[10px] text-slate-500 font-bold mt-0.5">Annual Tuition & Laboratory</div>
        </BrutalCard>

        <BrutalCard size="small" accent="mint" className="p-4">
          <div className="text-[10px] font-extrabold uppercase text-slate-600">Total Paid to Date</div>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            ₹{feeRecord ? feeRecord.paid_amount.toLocaleString('en-IN') : '20,000'}
          </div>
          <div className="text-[10px] text-emerald-800 font-bold mt-0.5">Receipts Cleared</div>
        </BrutalCard>

        <BrutalCard size="small" accent="lavender" className="p-4">
          <div className="text-[10px] font-extrabold uppercase text-slate-600">Outstanding Balance</div>
          <div className="text-2xl font-black text-rose-700 mt-1">
            ₹{feeRecord ? feeRecord.pending_amount.toLocaleString('en-IN') : '5,000'}
          </div>
          <div className="text-[10px] text-rose-800 font-bold mt-0.5">Due by: 30 Nov 2026</div>
        </BrutalCard>
      </div>

      {/* Payment History & Receipts */}
      <div className="bg-white border-2 border-[#0F172A] shadow-[4px_4px_0px_#0F172A] overflow-hidden">
        <div className="p-3 bg-[#FEFCE8] border-b-2 border-[#0F172A] flex justify-between items-center text-xs font-black uppercase">
          <span>Fee Transaction History</span>
          <span className="text-[10px] px-2 py-0.5 bg-[#A7F3D0] border border-[#0F172A]">
            INSTANT_RECEIPTS
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-bold">
            <thead className="bg-[#C4B5FD] border-b-2 border-[#0F172A] text-[10px] uppercase">
              <tr>
                <th className="p-3 border-r border-[#0F172A]">Date</th>
                <th className="p-3 border-r border-[#0F172A]">Receipt Number</th>
                <th className="p-3 border-r border-[#0F172A]">Fee Head</th>
                <th className="p-3 border-r border-[#0F172A]">Payment Mode</th>
                <th className="p-3 border-r border-[#0F172A]">Amount Paid</th>
                <th className="p-3 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0F172A]">
              <tr className="hover:bg-slate-50">
                <td className="p-3 border-r border-[#0F172A] font-mono">15 Oct 2026</td>
                <td className="p-3 border-r border-[#0F172A] font-mono font-black text-[#0F172A]">
                  RCPT-982144
                </td>
                <td className="p-3 border-r border-[#0F172A]">Term 1 Tuition Fee</td>
                <td className="p-3 border-r border-[#0F172A]">UPI / Net Banking</td>
                <td className="p-3 border-r border-[#0F172A] font-mono text-emerald-700 font-black">
                  ₹20,000
                </td>
                <td className="p-3 text-right">
                  <button
                    onClick={() =>
                      setActiveReceipt({
                        receipt_number: 'RCPT-982144',
                        student_name: activeChild?.student_name || 'Aarav Kumar',
                        student_id: activeChild?.id_number || 'STU10001',
                        amount: 20000,
                        payment_mode: 'UPI / Online Transfer',
                        date: '15 Oct 2026',
                      })
                    }
                    className="px-2.5 py-1 bg-[#0F172A] text-white hover:bg-slate-800 text-[10px] font-black uppercase shadow-[1.5px_1.5px_0px_#FDE68A]"
                  >
                    VIEW RECEIPT
                  </button>
                </td>
              </tr>
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
    </div>
  );
};
export default ParentFees;
