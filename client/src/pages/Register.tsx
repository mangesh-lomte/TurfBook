import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ApiError } from '../lib/api';
import { Role } from '../types';
import { FootballIcon, ArenaIcon } from '../components/SportIcon';
import { Lock, Mail, User as UserIcon, Phone, ArrowRight, AlertCircle } from 'lucide-react';

export const Register: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState<Role>('CUSTOMER');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await register({
        fullName,
        email,
        phone,
        password,
        role,
      });

      if (role === 'OWNER') {
        navigate('/owner/dashboard');
      } else {
        navigate('/explore');
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Registration failed. Please check the inputs.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-dashboard relative overflow-hidden">
      <div className="max-w-md w-full space-y-6 bg-white p-8 sm:p-10 rounded-3xl border border-[#DFE6DF] shadow-elevated relative z-10">
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-brand border border-[#B9F65A]/40 text-white flex items-center justify-center font-black text-2xl mx-auto mb-4 shadow-brand">
            <span>T</span><span className="text-[#B9F65A]">B</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#18231D] tracking-tight">
            Create an Account
          </h1>
          <p className="text-xs text-[#526158] mt-1 font-normal">
            Join TurfBook as a player or turf facility owner.
          </p>
        </div>

        {/* Role Segmented Button (Clean Vector Icons) */}
        <div className="grid grid-cols-2 p-1.5 bg-[#F8FAF7] border border-[#DFE6DF] rounded-2xl">
          <button
            type="button"
            onClick={() => setRole('CUSTOMER')}
            className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              role === 'CUSTOMER'
                ? 'bg-gradient-booking text-[#18231D] shadow-lime-sm font-black'
                : 'text-[#526158] hover:text-[#18231D]'
            }`}
          >
            <FootballIcon className="w-3.5 h-3.5 text-current" />
            <span>Sports Player</span>
          </button>
          <button
            type="button"
            onClick={() => setRole('OWNER')}
            className={`py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              role === 'OWNER'
                ? 'bg-[#123B2A] text-white shadow-brand font-black'
                : 'text-[#526158] hover:text-[#18231D]'
            }`}
          >
            <ArenaIcon className="w-3.5 h-3.5 text-current" />
            <span>Turf Owner</span>
          </button>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="reg-name" className="block text-xs font-bold text-[#18231D] uppercase tracking-wider mb-1.5">
              Full Legal Name
            </label>
            <div className="flex items-center gap-2 px-3.5 py-2.5 bg-[#F8FAF7] border border-[#DFE6DF] rounded-xl focus-within:ring-2 focus-within:ring-[#176443]">
              <UserIcon className="w-4 h-4 text-[#526158] shrink-0" />
              <input
                id="reg-name"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Rohan Sharma"
                className="w-full bg-transparent text-xs text-[#18231D] focus:outline-none font-medium placeholder:text-[#526158]"
              />
            </div>
          </div>

          <div>
            <label htmlFor="reg-email" className="block text-xs font-bold text-[#18231D] uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="flex items-center gap-2 px-3.5 py-2.5 bg-[#F8FAF7] border border-[#DFE6DF] rounded-xl focus-within:ring-2 focus-within:ring-[#176443]">
              <Mail className="w-4 h-4 text-[#526158] shrink-0" />
              <input
                id="reg-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="player@example.com"
                className="w-full bg-transparent text-xs text-[#18231D] focus:outline-none font-medium placeholder:text-[#526158]"
              />
            </div>
          </div>

          <div>
            <label htmlFor="reg-phone" className="block text-xs font-bold text-[#18231D] uppercase tracking-wider mb-1.5">
              Phone Number
            </label>
            <div className="flex items-center gap-2 px-3.5 py-2.5 bg-[#F8FAF7] border border-[#DFE6DF] rounded-xl focus-within:ring-2 focus-within:ring-[#176443]">
              <Phone className="w-4 h-4 text-[#526158] shrink-0" />
              <input
                id="reg-phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full bg-transparent text-xs text-[#18231D] focus:outline-none font-medium placeholder:text-[#526158]"
              />
            </div>
          </div>

          <div>
            <label htmlFor="reg-password" className="block text-xs font-bold text-[#18231D] uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="flex items-center gap-2 px-3.5 py-2.5 bg-[#F8FAF7] border border-[#DFE6DF] rounded-xl focus-within:ring-2 focus-within:ring-[#176443]">
              <Lock className="w-4 h-4 text-[#526158] shrink-0" />
              <input
                id="reg-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-transparent text-xs text-[#18231D] focus:outline-none font-medium placeholder:text-[#526158]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#123B2A] hover:bg-[#176443] text-white font-bold text-xs rounded-xl shadow-brand transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span>Registering Account...</span>
            ) : (
              <>
                <span>Create Verified Account</span>
                <ArrowRight className="w-4 h-4 text-[#B9F65A]" />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-[#DFE6DF]">
          <span className="text-xs text-[#526158]">Already have an account? </span>
          <Link to="/login" className="text-xs font-bold text-[#123B2A] hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
};
