import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface AuthPageProps {
  onSuccess?: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onSuccess }) => {
  const { user, login, register, logout } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setSubmitting(true);
    try {
      if (isLogin) {
        await login(email, password);
        setSuccessMsg('Authentication successful! Welcome to VehicleIQ.');
        if (onSuccess) onSuccess();
      } else {
        await register(email, password);
        setSuccessMsg('Account created and verified! Welcome to VehicleIQ.');
        if (onSuccess) onSuccess();
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Authentication error');
    } finally {
      setSubmitting(false);
    }
  };

  if (user) {
    return (
      <div className="py-16 px-4 max-w-xl mx-auto text-viq-on-surface">
        <div className="bg-viq-surface-container-high border border-viq-outline-variant/30 rounded-2xl p-8 shadow-2xl text-center">
          <div className="w-16 h-16 bg-viq-primary-container/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-viq-primary/30">
            <span className="material-symbols-outlined text-viq-primary text-3xl">verified_user</span>
          </div>
          <h2 className="text-2xl font-bold font-jakarta mb-2">Authenticated Session</h2>
          <p className="text-viq-on-surface-variant text-sm mb-6 font-mono">
            Logged in as: <strong className="text-viq-primary">{user.email}</strong>
          </p>
          <div className="flex flex-wrap gap-2 justify-center mb-6 text-xs font-mono">
            <span className="px-3 py-1 bg-viq-surface-container-lowest rounded-full border border-viq-outline-variant/20">
              Role: {user.is_admin ? 'ADMINISTRATOR' : 'STANDARD USER'}
            </span>
            <span className="px-3 py-1 bg-viq-surface-container-lowest rounded-full border border-viq-outline-variant/20 text-emerald-400">
              Status: ACTIVE
            </span>
          </div>
          <button
            onClick={logout}
            className="px-6 py-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 font-bold text-sm rounded-lg transition-colors cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-16 px-4 max-w-md mx-auto text-viq-on-surface">
      <div className="bg-viq-surface-container-high border border-viq-outline-variant/30 rounded-2xl p-8 shadow-2xl">
        <div className="text-center mb-8">
          <span className="font-mono text-label-caps text-viq-primary uppercase tracking-widest">
            {isLogin ? 'SECURE LOGIN' : 'NEW REGISTRATION'}
          </span>
          <h2 className="text-2xl font-bold font-jakarta mt-1">
            {isLogin ? 'Sign in to VehicleIQ' : 'Create an Account'}
          </h2>
          <p className="text-viq-on-surface-variant text-xs mt-2">
            Access your saved garage, personalized multi-attribute AI scoring, and dealer quotes.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 text-red-400 text-xs rounded-lg">
            {errorMsg}
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs rounded-lg">
            {successMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-viq-outline mb-1">
              Email Address
            </label>
            <input
              name="email"
              type="email"
              required
              placeholder="user@example.com"
              className="w-full bg-viq-surface-container-lowest border border-viq-outline-variant/30 text-viq-on-surface rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-viq-primary"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-viq-outline mb-1">
              Password
            </label>
            <input
              name="password"
              type="password"
              required
              placeholder="••••••••"
              className="w-full bg-viq-surface-container-lowest border border-viq-outline-variant/30 text-viq-on-surface rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-viq-primary"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-2 bg-viq-primary hover:bg-viq-primary-hover text-viq-on-primary font-bold text-sm py-2.5 rounded-lg transition-colors disabled:opacity-50 cursor-pointer shadow-lg shadow-viq-primary/20"
          >
            {submitting ? 'Authenticating...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-viq-outline-variant/20 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setErrorMsg('');
              setSuccessMsg('');
            }}
            className="text-xs text-viq-on-surface-variant hover:text-viq-primary transition-colors cursor-pointer"
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>

        <div className="mt-4 p-3 bg-viq-surface-container-lowest rounded-lg border border-viq-outline-variant/10 text-[11px] text-viq-outline font-mono text-center">
          Demo Admin: <strong>admin@vehicleiq.ai</strong> / <strong>admin123</strong>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
