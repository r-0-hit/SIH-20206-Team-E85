import React, { useState } from 'react';
import { Flame, Lock, Mail, User as UserIcon, ShieldAlert, ArrowRight } from 'lucide-react';
import { authService } from '../services/authService';
import { User } from '../types/index';

interface LoginPageProps {
  onLoginSuccess: (user: User) => void;
  onNavigate: (page: string) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess, onNavigate }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'ANALYST' | 'ADMIN'>('ANALYST');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (isRegister) {
        const res = await authService.register(username, email, password, fullName, role);
        onLoginSuccess(res.user);
      } else {
        const res = await authService.login(email, password);
        onLoginSuccess(res.user);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  const loginWithDemo = async (demoEmail: string, demoPass: string) => {
    setError(null);
    setLoading(true);
    try {
      const res = await authService.login(demoEmail, demoPass);
      onLoginSuccess(res.user);
    } catch (err: any) {
      setError(err.message || 'Failed to sign in with demo credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <div className="sheet sheet-framed shadow-hard w-full max-w-md space-y-6 p-8">
        {/* Stamp */}
        <div className="space-y-3 border-b-2 border-ink pb-4 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center border-2 border-ink bg-signal">
            <Flame className="h-6 w-6 text-white" />
          </span>
          <h1 className="font-display text-2xl font-extrabold uppercase tracking-tight text-ink">
            {isRegister ? 'Create analyst account' : 'PyroGuard AI access'}
          </h1>
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-ink-muted">
            {isRegister
              ? 'Register credentials for satellite GIS intelligence'
              : 'Sign in to access thermal detection telemetry'}
          </p>
        </div>

        {error && (
          <div className="flex items-center gap-2.5 border-2 border-risk-critical bg-[#FDECE8] px-3.5 py-3 font-mono text-[11px] uppercase tracking-wider text-risk-critical">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* 1-Click Demo Buttons */}
        {!isRegister && (
          <div className="space-y-2 border-b-2 border-ink pb-5">
            <span className="block text-center font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-ink-muted">
              Quick demo credentials
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => loginWithDemo('admin@pyroguard.ai', 'Admin@12345')}
                className="sheet sheet-hover shadow-hard-sm p-2.5 text-center"
              >
                <span className="block font-display text-[11px] font-extrabold uppercase text-signal">
                  Chief admin
                </span>
                <span className="block font-mono text-[9px] uppercase tracking-wider text-ink-muted">
                  Full permissions
                </span>
              </button>
              <button
                type="button"
                onClick={() => loginWithDemo('analyst@pyroguard.ai', 'Analyst@12345')}
                className="sheet sheet-hover shadow-hard-sm p-2.5 text-center"
              >
                <span className="block font-display text-[11px] font-extrabold uppercase text-blueprint">
                  GIS analyst
                </span>
                <span className="block font-mono text-[9px] uppercase tracking-wider text-ink-muted">
                  Operations
                </span>
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <>
              <div>
                <label className="label">Full Name</label>
                <div className="relative">
                  <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Dr. John Doe"
                    className="input pl-9"
                  />
                </div>
              </div>

              <div>
                <label className="label">Username</label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="johndoe"
                  className="input"
                />
              </div>

              <div>
                <label className="label">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as any)}
                  className="input"
                >
                  <option value="ANALYST">GIS Analyst (Review & Verify)</option>
                  <option value="ADMIN">System Administrator (Full Control)</option>
                </select>
              </div>
            </>
          )}

          <div>
            <label className="label">Email Address</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="analyst@pyroguard.ai"
                className="input pl-9"
              />
            </div>
          </div>

          <div>
            <label className="label">Password</label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="input pl-9"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3"
          >
            {loading ? 'Authenticating…' : isRegister ? 'Complete registration' : 'Sign in'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </form>

        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setError(null);
            }}
            className="font-mono text-[10px] font-bold uppercase tracking-wider text-blueprint hover:text-signal"
          >
            {isRegister
              ? 'Already registered? Sign in'
              : 'No analyst account? Register here'}
          </button>
        </div>
      </div>
    </div>
  );
};

