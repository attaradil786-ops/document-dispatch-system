import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserAccount } from '../types';
import { storageService } from '../services/storageService';
import {
  FileStack,
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  ArrowLeft,
  Building2,
  Check,
  Key,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const accounts = storageService.getAccounts();

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedAccount, setSelectedAccount] = useState<UserAccount | null>(null);

  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSelectDepartment = (account: UserAccount) => {
    setSelectedAccount(account);
    setPassword('');
    setErrorMsg('');
    setStep(2);
  };

  const handleBackToDepartments = () => {
    setStep(1);
    setPassword('');
    setErrorMsg('');
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAccount || !password.trim()) return;

    setIsLoading(true);
    setErrorMsg('');

    const success = await login(selectedAccount.email, password.trim());
    setIsLoading(false);

    if (!success) {
      setErrorMsg(`Incorrect password for ${selectedAccount.department_name}. Please try again.`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-3xl space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/20">
            <FileStack className="h-7 w-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Inter-Department Document Dispatch Hub
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 max-w-lg mx-auto">
            Official institutional portal for inter-department work uploads, policy circulars, and dispatch tracking
          </p>
        </div>

        {/* STEP 1: CHOOSE YOUR DEPARTMENT */}
        {step === 1 && (
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <span className="inline-block rounded-full bg-blue-500/20 px-3 py-1 text-[10px] font-extrabold text-blue-300 border border-blue-400/30 uppercase tracking-widest">
                  Step 1 of 2
                </span>
                <h2 className="text-xl font-black text-white mt-1">
                  Choose Your Department to Login
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Select your assigned department account below to enter password credentials.
                </p>
              </div>
              <Building2 className="h-8 w-8 text-blue-500/40 hidden sm:block" />
            </div>

            {/* Grid of Department Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {accounts.map((acc) => {
                return (
                  <button
                    key={acc.id}
                    onClick={() => handleSelectDepartment(acc)}
                    className="group relative text-left p-5 rounded-2xl border border-slate-800 bg-slate-950/70 hover:bg-slate-800 hover:border-blue-500/50 transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4 shadow-sm hover:shadow-lg hover:shadow-blue-500/10"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="font-mono text-xs font-black text-blue-400 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-900">
                          {acc.department_id.replace('dept-', '').toUpperCase()}
                        </span>
                        {acc.is_main_dept ? (
                          <span className="text-[9px] px-2 py-0.5 rounded-full font-extrabold bg-purple-500 text-white uppercase tracking-wider">
                            MAIN HQ
                          </span>
                        ) : (
                          <span className="text-[9px] px-2 py-0.5 rounded-full font-bold bg-slate-800 text-slate-300 uppercase">
                            SUB DEPT
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-extrabold text-white group-hover:text-blue-300 transition-colors">
                        {acc.department_name}
                      </h3>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Officer: <span className="text-slate-300 font-medium">{acc.full_name}</span>
                      </p>
                      <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                        {acc.email}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                      <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400">
                        <Lock className="h-3 w-3 text-slate-500" />
                        Password Protected
                      </span>
                      <span className="flex items-center gap-1 text-[11px] font-bold text-blue-400 group-hover:translate-x-0.5 transition-transform">
                        Select <ChevronRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* STEP 2: ENTER PASSWORD FOR SELECTED DEPARTMENT */}
        {step === 2 && selectedAccount && (
          <div className="rounded-3xl border border-slate-800 bg-slate-900 p-6 sm:p-8 shadow-2xl space-y-6 animate-in fade-in zoom-in-95">
            <button
              type="button"
              onClick={handleBackToDepartments}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-800 hover:bg-slate-700 px-3.5 py-1.5 text-xs font-bold text-slate-300 transition-colors cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Choose Different Department</span>
            </button>

            <div className="border-b border-slate-800 pb-4">
              <span className="inline-block rounded-full bg-blue-500/20 px-3 py-1 text-[10px] font-extrabold text-blue-300 border border-blue-400/30 uppercase tracking-widest">
                Step 2 of 2
              </span>
              <h2 className="text-xl font-black text-white mt-1">
                Enter Department Password
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Authenticate your session to access the official inter-department dispatch portal.
              </p>
            </div>

            {/* Selected Department Card Summary */}
            <div className="rounded-2xl border border-blue-900/50 bg-blue-950/30 p-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-blue-400 font-mono">
                    [{selectedAccount.department_id.replace('dept-', '').toUpperCase()}]
                  </span>
                  <h3 className="text-sm font-bold text-white">
                    {selectedAccount.department_name}
                  </h3>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Officer: {selectedAccount.full_name} • <span className="font-mono text-blue-300">{selectedAccount.email}</span>
                </p>
              </div>

              {selectedAccount.is_main_dept ? (
                <span className="text-[10px] px-2.5 py-1 rounded-full font-black bg-purple-500 text-white uppercase shrink-0">
                  MAIN HQ
                </span>
              ) : (
                <span className="text-[10px] px-2.5 py-1 rounded-full font-bold bg-blue-600 text-white uppercase shrink-0">
                  SUB DEPT
                </span>
              )}
            </div>

            {errorMsg && (
              <div className="rounded-2xl bg-rose-950/80 border border-rose-800 p-3.5 text-xs font-bold text-rose-300 text-center">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleLoginSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Lock className="h-4 w-4 text-blue-400" />
                  Enter Password for {selectedAccount.department_name}
                </label>

                <div className="relative">
                  <Key className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-500" />
                  <input
                    type="password"
                    autoFocus
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter department password..."
                    className="w-full rounded-2xl border border-slate-800 bg-slate-950 pl-10 pr-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading || !password.trim()}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-blue-600 hover:bg-blue-500 py-3.5 text-xs font-bold text-white shadow-xl shadow-blue-500/25 transition-all disabled:opacity-50 cursor-pointer"
              >
                <span>{isLoading ? 'Authenticating...' : `Sign In as ${selectedAccount.department_name}`}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
