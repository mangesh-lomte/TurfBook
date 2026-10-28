import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ApiError } from '../lib/api';
import { FootballIcon, ArenaIcon } from '../components/SportIcon';
import { Lock, Mail, Sparkles, ArrowRight, AlertCircle, Shield } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, demoLogin } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/explore';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      navigate(redirectUrl);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to login. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemo = async (role: 'CUSTOMER' | 'OWNER' | 'ADMIN') => {
    setError(null);
    setLoading(true);
    try {
      await demoLogin(role);
      if (role === 'ADMIN') navigate('/admin/overview');
      else if (role === 'OWNER') navigate('/owner/dashboard');
      else navigate(redirectUrl);
    } catch (err: unknown) {
      if (err instanceof ApiError) setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gradient-dashboard relative overflow-hidden">
      <div className="max-w-md w-full space-y-6 bg-white p-8 sm:p-10 rounded-3xl border border-[#DFE6DF] shadow-elevated relative z-10">
        {/* Header - No kickers */}
        <div className="text-center">
          <div className="w-14 h-14 rounded-2xl bg-gradient-brand border border-[#B9F65A]/40 text-white flex items-center justify-center font-black text-2xl mx-auto mb-4 shadow-brand">
            <span>T</span><span className="text-[#B9F65A]">B</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#18231D] tracking-tight">
            Sign In to TurfBook
          </h1>
          <p className="text-xs text-[#526158] mt-1 font-normal">
            Access your bookings, explore verified arenas, and manage sports grounds.
          </p>
        </div>

        {/* 1-Click Demo Login Box (Vector Icons) */}
        <div className="bg-[#F0F6EE] border border-[#C5E1BF] rounded-2xl p-4 shadow-xs">
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#123B2A] uppercase tracking-wider mb-2.5">
            <Sparkles className="w-4 h-4 text-[#27864F]" />
            <span>1-Click Instant Persona Sign-In</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuickDemo('CUSTOMER')}
              className="py-2.5 px-2 bg-white hover:bg-[#F8FAF7] border border-[#DFE6DF] hover:border-[#123B2A] rounded-xl text-xs font-bold text-[#18231D] transition-all shadow-xs active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <FootballIcon className="w-3.5 h-3.5 text-[#27864F]" />
              <span>Player</span>
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuickDemo('OWNER')}
              className="py-2.5 px-2 bg-white hover:bg-[#F8FAF7] border border-[#DFE6DF] hover:border-[#123B2A] rounded-xl text-xs font-bold text-[#18231D] transition-all shadow-xs active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <ArenaIcon className="w-3.5 h-3.5 text-[#27864F]" />
              <span>Owner</span>
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={() => handleQuickDemo('ADMIN')}
              className="py-2.5 px-2 bg-white hover:bg-[#F8FAF7] border border-[#DFE6DF] hover:border-[#123B2A] rounded-xl text-xs font-bold text-[#18231D] transition-all shadow-xs active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Shield className="w-3.5 h-3.5 text-[#27864F]" />
              <span>Admin</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="login-email" className="block text-xs font-bold text-[#18231D] uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="flex items-center gap-2 px-3.5 py-2.5 bg-[#F8FAF7] border border-[#DFE6DF] rounded-xl focus-within:ring-2 focus-within:ring-[#176443]">
              <Mail className="w-4 h-4 text-[#526158] shrink-0" />
              <input
                id="login-email"
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
            <label htmlFor="login-password" className="block text-xs font-bold text-[#18231D] uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="flex items-center gap-2 px-3.5 py-2.5 bg-[#F8FAF7] border border-[#DFE6DF] rounded-xl focus-within:ring-2 focus-within:ring-[#176443]">
              <Lock className="w-4 h-4 text-[#526158] shrink-0" />
              <input
                id="login-password"
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
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In to Account</span>
                <ArrowRight className="w-4 h-4 text-[#B9F65A]" />
              </>
            )}
          </button>
        </form>

        <div className="text-center pt-2 border-t border-[#DFE6DF]">
          <span className="text-xs text-[#526158]">Don't have an account yet? </span>
          <Link to="/register" className="text-xs font-bold text-[#123B2A] hover:underline">
            Register now
          </Link>
        </div>
      </div>
    </div>
  );
};
