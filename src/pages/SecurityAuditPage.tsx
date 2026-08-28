import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { storageService } from '../services/storageService';
import { SecurityAuditResult } from '../types';
import { ShieldCheck, CheckCircle2, AlertOctagon, RefreshCw, Lock, ShieldAlert } from 'lucide-react';

export const SecurityAuditPage: React.FC = () => {
  const { user } = useAuth();
  const [testResults, setTestResults] = useState<SecurityAuditResult[]>(() =>
    user ? storageService.runSecurityAudit(user) : []
  );
  const [isRunning, setIsRunning] = useState(false);

  const handleRunAudit = () => {
    if (!user) return;
    setIsRunning(true);
    setTimeout(() => {
      setTestResults(storageService.runSecurityAudit(user));
      setIsRunning(false);
    }, 500);
  };

  const allPassed = testResults.every((r) => r.passed);

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Banner Header */}
      <div className="rounded-3xl bg-slate-900 p-6 text-white shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
            <ShieldCheck className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <span className="inline-block rounded-full bg-emerald-500/20 px-3 py-1 text-[10px] font-bold text-emerald-300 border border-emerald-400/30 uppercase tracking-widest">
              Live Data Isolation Suite
            </span>
            <h2 className="text-2xl font-black tracking-tight mt-1">
              Department Security & Isolation Verification
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Automated assertions verifying strict main department routing and sub-department privacy locks.
            </p>
          </div>
        </div>

        <button
          onClick={handleRunAudit}
          disabled={isRunning}
          className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-xs font-bold text-white shadow-lg shadow-emerald-500/25 hover:bg-emerald-500 disabled:opacity-50 transition-all shrink-0"
        >
          <RefreshCw className={`h-4 w-4 ${isRunning ? 'animate-spin' : ''}`} />
          <span>{isRunning ? 'Running Security Suite...' : 'Run Security Audit'}</span>
        </button>
      </div>

      {/* Global Status Pill */}
      <div
        className={`rounded-3xl border p-5 flex items-center justify-between ${
          allPassed
            ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
            : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
        }`}
      >
        <div className="flex items-center gap-3">
          {allPassed ? (
            <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
          ) : (
            <AlertOctagon className="h-6 w-6 text-rose-600 shrink-0" />
          )}
          <div>
            <h3 className="text-sm font-black">
              {allPassed
                ? 'DEPARTMENT DATA ISOLATION VERIFIED (100% PASS)'
                : 'SECURITY BREACH DETECTED'}
            </h3>
            <p className="text-xs opacity-90 mt-0.5">
              Sub-departments are strictly restricted to uploading work to Main Dept and prevented from viewing sibling departments' private dispatches.
            </p>
          </div>
        </div>
      </div>

      {/* Test Assertion List */}
      <div className="space-y-4">
        {testResults.map((test, index) => (
          <div
            key={index}
            className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-xs space-y-3"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-600 font-bold text-xs">
                  0{index + 1}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    {test.test_name}
                  </h4>
                  <p className="text-[11px] text-slate-500">
                    Subject: {test.user_dept} ➔ Action: {test.attempted_action}
                  </p>
                </div>
              </div>

              <span
                className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                  test.passed
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border-emerald-200'
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border-rose-200'
                }`}
              >
                {test.passed ? 'PASSED' : 'FAILED'}
              </span>
            </div>

            <div className="rounded-2xl bg-slate-50 dark:bg-slate-800/50 p-3 text-xs space-y-1">
              <p className="text-slate-700 dark:text-slate-300 font-medium">
                {test.message}
              </p>
              <div className="flex items-center gap-4 text-[10px] text-slate-400 pt-1 border-t border-slate-200 dark:border-slate-700">
                <span>Expected: <strong className="text-slate-600 dark:text-slate-300">{test.expected_outcome}</strong></span>
                <span>Actual: <strong className="text-slate-600 dark:text-slate-300">{test.actual_outcome}</strong></span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
