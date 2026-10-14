import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { BrutalButton } from '../../components/BrutalButton';
import { BrutalCard } from '../../components/BrutalCard';
import { ShieldCheck, ArrowRight, Lock, Key, Users } from 'lucide-react';

export const Register: React.FC = () => {
  const { user, role } = useAuth();
  const navigate = useNavigate();

  // If already logged in as admin, direct to admin user management
  React.useEffect(() => {
    if (user && role === 'admin') {
      navigate('/admin/dashboard');
    }
  }, [user, role, navigate]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center p-4 font-mono selection:bg-[#FDE68A]">
      {/* Brand Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 border-2 border-[#0F172A] bg-[#C4B5FD] shadow-[4px_4px_0px_#0F172A] mb-3">
          <img src="/logo.svg" alt="EnglishIQ Logo" className="w-12 h-12 object-contain" />
        </div>
        <h1 className="font-extrabold text-3xl text-[#0F172A] tracking-tight font-sans">
          EnglishIQ
        </h1>
        <p className="text-xs font-bold text-slate-600 tracking-wider uppercase mt-1">
          SCHOOL MANAGEMENT & ADMISSION POLICY
        </p>
      </div>

      <BrutalCard size="large" accent="mint" className="w-full max-w-lg p-6 sm:p-8">
        <div className="flex items-center justify-between pb-3 border-b-2 border-[#0F172A] mb-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-700" />
            <span className="font-extrabold text-sm text-[#0F172A]">SECURITY_POLICY // CLOSED_REGISTRATION</span>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 bg-[#0F172A] text-white border border-[#0F172A]">
            ADMIN_CONTROLLED
          </span>
        </div>

        <div className="space-y-4">
          <div className="p-4 bg-[#FEFCE8] border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A]">
            <div className="flex items-center gap-2 text-xs font-extrabold text-amber-900 mb-1.5 uppercase">
              <Lock className="w-4 h-4 text-amber-800" />
              DIRECT SELF-REGISTRATION IS DISABLED
            </div>
            <p className="text-xs text-slate-700 leading-relaxed font-bold">
              To guarantee role security and prevent unauthorized student access to teacher assessment consoles, all Teacher and Student accounts are provisioned exclusively by the School Administrator.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
            <div className="p-3 bg-white border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A]">
              <div className="text-xs font-extrabold text-[#0F172A] flex items-center gap-1.5 mb-1">
                <Users className="w-3.5 h-3.5 text-indigo-600" />
                TEACHERS & STUDENTS
              </div>
              <p className="text-[11px] text-slate-600 leading-normal">
                Contact your School Office to receive your verified account with your official ID (e.g. <span className="font-bold text-[#0F172A]">TCH1001</span> or <span className="font-bold text-[#0F172A]">STU10001</span>).
              </p>
            </div>

            <div className="p-3 bg-white border-2 border-[#0F172A] shadow-[2px_2px_0px_#0F172A]">
              <div className="text-xs font-extrabold text-[#0F172A] flex items-center gap-1.5 mb-1">
                <Key className="w-3.5 h-3.5 text-emerald-600" />
                ADMINISTRATORS
              </div>
              <p className="text-[11px] text-slate-600 leading-normal">
                Log in with your Admin ID (<span className="font-bold text-[#0F172A]">ADM1001</span>) to access the User Provisioning Center and add new teachers or students.
              </p>
            </div>
          </div>

          <div className="pt-4 border-t-2 border-[#0F172A] space-y-2.5">
            <BrutalButton
              variant="primary"
              className="w-full"
              onClick={() => navigate('/login')}
              icon={<ArrowRight className="w-4 h-4" />}
            >
              [ RETURN TO SIGN IN ]
            </BrutalButton>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t-2 border-[#0F172A] text-center text-xs text-slate-500 font-bold">
          School ID System &copy; EnglishIQ Academic Operating System
        </div>
      </BrutalCard>
    </div>
  );
};
export default Register;
