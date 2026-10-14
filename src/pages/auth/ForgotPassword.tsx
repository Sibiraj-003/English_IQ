import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { BrutalButton } from '../../components/BrutalButton';
import { BrutalCard } from '../../components/BrutalCard';
import { KeyRound, ArrowLeft, CheckCircle } from 'lucide-react';

export const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) setSent(true);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center p-4 font-mono selection:bg-[#FDE68A]">
      <BrutalCard size="large" accent="amber" className="w-full max-w-md p-6 sm:p-8">
        <div className="flex items-center justify-between pb-3 border-b-2 border-[#0F172A] mb-6">
          <span className="font-extrabold text-sm text-[#0F172A]">ACCOUNT_RECOVERY // PASSWORD</span>
          <span className="text-[10px] font-bold px-2 py-0.5 bg-[#FDE68A] text-[#0F172A] border border-[#0F172A]">
            RESET_KEY
          </span>
        </div>

        {sent ? (
          <div className="text-center py-6">
            <CheckCircle className="w-12 h-12 text-emerald-600 mx-auto mb-3" />
            <h3 className="font-extrabold text-base text-[#0F172A] mb-2">RECOVERY LINK SENT</h3>
            <p className="text-xs text-slate-600 mb-6">
              If an account matches <strong>{email}</strong>, a password reset link has been dispatched.
            </p>
            <Link to="/login">
              <BrutalButton variant="primary" size="sm" className="w-full">
                [ RETURN TO SIGN IN ]
              </BrutalButton>
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-xs text-slate-600 font-bold mb-4">
              Enter your registered school email address and we will generate an academic credential reset token.
            </p>
            <div>
              <label className="block text-xs font-bold text-[#0F172A] mb-1.5 uppercase">
                School Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your registered email"
                required
                className="w-full px-3.5 py-2.5 bg-white border-2 border-[#0F172A] text-sm text-[#0F172A] font-bold placeholder-slate-400 focus:outline-none focus:bg-[#FEFCE8] shadow-[2px_2px_0px_#0F172A]"
              />
            </div>

            <BrutalButton
              type="submit"
              variant="amber"
              className="w-full mt-2"
              icon={<KeyRound className="w-4 h-4" />}
            >
              [ SEND RECOVERY TOKEN ]
            </BrutalButton>

            <div className="text-center mt-4">
              <Link to="/login" className="inline-flex items-center gap-1 text-xs font-bold text-slate-600 hover:text-[#0F172A]">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Sign In
              </Link>
            </div>
          </form>
        )}
      </BrutalCard>
    </div>
  );
};
