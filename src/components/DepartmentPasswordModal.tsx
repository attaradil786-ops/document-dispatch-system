import React, { useState } from 'react';
import { UserAccount } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Building2, Lock, Key, X, Check, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';

interface DepartmentPasswordModalProps {
  targetAccount: UserAccount | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const DepartmentPasswordModal: React.FC<DepartmentPasswordModalProps> = ({
  targetAccount,
  onClose,
  onSuccess,
}) => {
  const { login } = useAuth();
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!targetAccount) return null;

  const emailPrefix = targetAccount.email.split('@')[0];
  const expectedPassword = targetAccount.password || `${emailPrefix}@123`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) {
      setErrorMsg('Please enter the department password.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    const success = await login(targetAccount.email, password.trim());
    setIsLoading(false);

    if (success) {
      if (onSuccess) onSuccess();
      onClose();
    } else {
      setErrorMsg(`Incorrect password for ${targetAccount.department_name}. Please try again.`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-md rounded-3xl border border-slate-800 bg-slate-900 p-6 text-white shadow-2xl space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400">
            <Lock className="h-6 w-6" />
          </div>
          <div>
            <span className="inline-block rounded-full bg-blue-500/20 px-2.5 py-0.5 text-[10px] font-extrabold text-blue-300 border border-blue-400/30 uppercase tracking-wider">
              Security Verification Required
            </span>
            <h3 className="text-lg font-black tracking-tight mt-0.5">
              Switch Department Account
            </h3>
          </div>
        </div>

        {/* Selected Department Box */}
        <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Target Department
            </span>
            {targetAccount.is_main_dept ? (
              <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                HQ CENTRAL
              </span>
            ) : (
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                SUB DEPT
              </span>
            )}
          </div>
          <p className="text-sm font-black text-white">{targetAccount.department_name}</p>
          <p className="text-xs text-slate-400">
            {targetAccount.full_name} • <span className="font-mono text-blue-300">{targetAccount.email}</span>
          </p>
        </div>

        {errorMsg && (
          <div className="flex items-start gap-2 rounded-2xl bg-rose-950/80 border border-rose-800 p-3 text-xs text-rose-300 font-bold">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
              <Key className="h-3.5 w-3.5 text-blue-400" />
              Department Password
            </label>

            <input
              type="password"
              autoFocus
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter department password..."
              className="w-full rounded-2xl border border-slate-800 bg-slate-950/80 px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-2xl border border-slate-800 bg-slate-800/60 py-3 text-xs font-bold text-slate-300 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isLoading || !password.trim()}
              className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-500 py-3 text-xs font-bold text-white shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50 cursor-pointer"
            >
              <span>{isLoading ? 'Verifying...' : 'Verify & Switch'}</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
