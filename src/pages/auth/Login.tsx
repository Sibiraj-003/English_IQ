import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { BrutalButton } from '../../components/BrutalButton';
import { BrutalCard } from '../../components/BrutalCard';
import { ArrowRight } from 'lucide-react';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Invalid email or password.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const loggedInUser = await login(email, password);
      if (loggedInUser.role === 'admin') {
        navigate('/admin/dashboard');
      } else if (loggedInUser.role === 'teacher') {
        navigate('/teacher/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } catch (err: any) {
      // Requirement 4: UI must show "Invalid email or password."
      setError('Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

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
          AI-POWERED ENGLISH LEARNING PORTAL
        </p>
      </div>

      {/* Main Login Card */}
      <BrutalCard size="large" accent="lavender" className="w-full max-w-md p-6 sm:p-8">
        <div className="flex items-center justify-between pb-3 border-b-2 border-[#0F172A] mb-6">
          <span className="font-extrabold text-sm text-[#0F172A]">ACADEMIC_PORTAL // SIGN_IN</span>
          <span className="text-[10px] font-bold px-2 py-0.5 bg-[#A7F3D0] text-[#0F172A] border border-[#0F172A]">
            AUTHENTICATED_ACCESS
          </span>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-100 border-2 border-[#0F172A] text-xs font-bold text-rose-800 shadow-[2px_2px_0px_#0F172A]">
            [ERROR] {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#0F172A] mb-1.5 uppercase">
              Official Institution ID or Email
            </label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your institution ID or mail"
              required
              className="w-full px-3.5 py-2.5 bg-white border-2 border-[#0F172A] text-sm text-[#0F172A] font-bold placeholder-slate-400 focus:outline-none focus:bg-[#FEFCE8] shadow-[2px_2px_0px_#0F172A]"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-bold text-[#0F172A] uppercase">
                Password
              </label>
              <Link to="/forgot-password" className="text-[11px] font-bold text-slate-500 hover:text-[#0F172A] underline">
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-3.5 py-2.5 bg-white border-2 border-[#0F172A] text-sm text-[#0F172A] font-bold placeholder-slate-400 focus:outline-none focus:bg-[#FEFCE8] shadow-[2px_2px_0px_#0F172A]"
            />
          </div>

          <BrutalButton
            type="submit"
            variant="primary"
            className="w-full mt-2"
            disabled={loading}
            icon={<ArrowRight className="w-4 h-4" />}
          >
            {loading ? 'AUTHENTICATING...' : '[ SIGN IN TO PORTAL ]'}
          </BrutalButton>
        </form>

        {/* Provisioning Notice */}
        <div className="mt-6 pt-4 border-t-2 border-[#0F172A] text-center text-xs text-slate-600 font-bold leading-relaxed">
          Authorized school portal. Accounts are provisioned exclusively by the Administrator.{' '}
          <Link to="/register" className="text-[#0F172A] underline hover:bg-[#FDE68A] px-1 block mt-1">
            View Admission & Access Information
          </Link>
        </div>
      </BrutalCard>
    </div>
  );
};
