import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  Send,
  Inbox,
  FileCheck,
  Building2,
  ShieldCheck,
  ChevronRight,
  FileStack,
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isCollapsed?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab }) => {
  const { isMainDept, departmentName } = useAuth();

  const navItems = [
    {
      id: 'dashboard',
      label: 'Dispatch Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'dispatch',
      label: 'Upload & Dispatch',
      icon: Send,
      badge: 'New',
    },
    {
      id: 'inbox',
      label: 'Received Documents',
      icon: Inbox,
      badge: null,
    },
    {
      id: 'outbox',
      label: 'Sent Dispatches',
      icon: FileCheck,
      badge: null,
    },
    {
      id: 'departments',
      label: 'Department Registry',
      icon: Building2,
      badge: null,
    },
    {
      id: 'audit',
      label: 'Security & RLS Isolation',
      icon: ShieldCheck,
      badge: 'Protected',
    },
  ];

  return (
    <aside className="w-64 shrink-0 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col h-screen sticky top-0 transition-colors z-20">
      {/* Brand Header */}
      <div className="flex h-16 items-center gap-3 border-b border-slate-200 dark:border-slate-800 px-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md">
          <FileStack className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-sm font-black tracking-tight text-slate-900 dark:text-white leading-tight">
            DOC DISPATCH
          </h1>
          <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
            Inter-Dept System
          </p>
        </div>
      </div>

      {/* Scope Pill */}
      <div className="mx-4 mt-4 rounded-xl border border-blue-100 dark:border-blue-900/60 bg-blue-50/70 dark:bg-blue-950/40 p-3">
        <p className="text-[10px] font-extrabold uppercase tracking-wider text-blue-700 dark:text-blue-300">
          Active Department Token
        </p>
        <p className="mt-0.5 text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
          {isMainDept ? 'Main Dept (Central HQ)' : departmentName}
        </p>
        <span className="mt-1 inline-block text-[9px] font-semibold text-slate-500 dark:text-slate-400">
          {isMainDept
            ? '⚡ Multi-Dept Broadcast & Global Oversight'
            : '🔒 Work uploads routed strictly to Main Dept'}
        </span>
      </div>

      {/* Main Menu Label */}
      <div className="mt-4 px-4">
        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest px-2">
          Dispatch Controls
        </span>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/30'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-md ${
                    isActive ? 'bg-white/20 text-white' : 'text-slate-400'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <span>{item.label}</span>
              </div>
              <div className="flex items-center gap-1.5">
                {item.badge && !isActive && (
                  <span className="rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 px-2 py-0.5 text-[9px] font-bold">
                    {item.badge}
                  </span>
                )}
                {isActive && <ChevronRight className="h-3.5 w-3.5 text-white/80" />}
              </div>
            </button>
          );
        })}
      </nav>

      {/* Footer info */}
      <div className="p-4 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-400 text-center">
        <span>Department Dispatch Engine v2.5</span>
      </div>
    </aside>
  );
};
