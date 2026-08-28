import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserAccount } from '../types';
import { storageService } from '../services/storageService';
import { Building2, ShieldCheck, Mail, Phone, MapPin, LogIn, Check, Lock } from 'lucide-react';
import { DepartmentPasswordModal } from '../components/DepartmentPasswordModal';

export const DepartmentRegistryPage: React.FC = () => {
  const { user } = useAuth();
  const accounts = storageService.getAccounts();
  const departments = storageService.getDepartments();

  const [targetAccount, setTargetAccount] = useState<UserAccount | null>(null);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Banner */}
      <div className="rounded-3xl bg-slate-900 p-6 text-white shadow-xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20">
            <Building2 className="h-6 w-6 text-blue-300" />
          </div>
          <div>
            <span className="inline-block rounded-full bg-blue-500/20 px-3 py-1 text-[10px] font-bold text-blue-300 border border-blue-400/30 uppercase tracking-widest">
              Institutional Directory
            </span>
            <h2 className="text-2xl font-black tracking-tight mt-1">
              Department Authentication & Registry
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              Overview of all registered department accounts, officers, contact boundaries, and credentials.
            </p>
          </div>
        </div>
      </div>

      {/* Grid of Department Accounts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.map((dept) => {
          const account = accounts.find((a) => a.department_id === dept.id);
          const isCurrentlyActive = user?.department_id === dept.id;
          const emailPrefix = account?.email.split('@')[0] || dept.code.toLowerCase();
          const deptPassword = account?.password || `${emailPrefix}@123`;

          return (
            <div
              key={dept.id}
              className={`rounded-3xl border p-6 flex flex-col justify-between transition-all ${
                dept.is_main
                  ? 'border-purple-300 dark:border-purple-900 bg-gradient-to-br from-purple-50/50 via-white to-white dark:from-purple-950/20 dark:via-slate-900 dark:to-slate-900 shadow-md'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-mono text-xs font-black text-blue-600 dark:text-blue-400">
                      [{dept.code}]
                    </span>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white mt-0.5">
                      {dept.name}
                    </h3>
                  </div>
                  {dept.is_main ? (
                    <span className="rounded-full bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 border border-purple-200 px-2.5 py-0.5 text-[9px] font-extrabold uppercase shrink-0">
                      MAIN HQ
                    </span>
                  ) : (
                    <span className="rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 px-2.5 py-0.5 text-[9px] font-bold uppercase shrink-0">
                      SUB DEPT
                    </span>
                  )}
                </div>

                <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0" />
                    <span className="font-bold text-slate-900 dark:text-white">
                      {dept.head_officer}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px]">
                    <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>{account?.email || dept.email}</span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px]">
                    <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>{dept.phone}</span>
                  </div>

                  <div className="flex items-center gap-2 text-[11px]">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{dept.building}</span>
                  </div>

                  {/* Sub-Criteria Badges */}
                  {dept.sub_criteria_list && dept.sub_criteria_list.length > 0 && (
                    <div className="pt-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                        Sub-Criteria (1.1 - 1.5)
                      </span>
                      <div className="flex flex-wrap gap-1">
                        {dept.sub_criteria_list.map((sc) => (
                          <span
                            key={sc}
                            className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900"
                          >
                            Criteria {sc}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
                {isCurrentlyActive ? (
                  <div className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-bold text-xs border border-emerald-200 dark:border-emerald-800">
                    <Check className="h-4 w-4 text-emerald-600" />
                    <span>Currently Active Account</span>
                  </div>
                ) : (
                  <button
                    onClick={() => account && setTargetAccount(account)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-slate-900 hover:bg-blue-600 dark:bg-slate-800 dark:hover:bg-blue-600 text-white font-bold text-xs shadow-sm transition-all cursor-pointer"
                  >
                    <LogIn className="h-3.5 w-3.5" />
                    <span>Login as {dept.code} Department</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Password verification modal when switching */}
      {targetAccount && (
        <DepartmentPasswordModal
          targetAccount={targetAccount}
          onClose={() => setTargetAccount(null)}
        />
      )}
    </div>
  );
};
