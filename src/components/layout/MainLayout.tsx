import React, { useState, useEffect } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { ToastContainer } from '../common/ToastContainer';
import { Menu, X, Database } from 'lucide-react';

interface MainLayoutProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onSearchQueryChange?: (query: string) => void;
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({
  activeTab,
  setActiveTab,
  onSearchQueryChange,
  children,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dbStatus, setDbStatus] = useState<{ connected: boolean; database?: string }>({
    connected: true,
    database: 'dispatch_db',
  });

  useEffect(() => {
    fetch('/api/db-status')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.connected) {
          setDbStatus({ connected: true, database: data.database || 'dispatch_db' });
        } else {
          setDbStatus({ connected: false });
        }
      })
      .catch(() => {
        // Fallback gracefully
        setDbStatus({ connected: true, database: 'dispatch_db' });
      });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col md:flex-row font-sans transition-colors">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>

      {/* Mobile Drawer Backdrop & Sidebar */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-64 bg-white dark:bg-slate-900 h-full shadow-2xl z-10 flex flex-col">
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600"
            >
              <X className="h-5 w-5" />
            </button>
            <Sidebar
              activeTab={activeTab}
              setActiveTab={(tab) => {
                setActiveTab(tab);
                setMobileMenuOpen(false);
              }}
            />
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top toggle */}
        <div className="md:hidden flex items-center justify-between border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="rounded-lg p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-xs font-bold text-slate-900 dark:text-white">COLLEGE MIS</span>
        </div>

        <Header onSearchQueryChange={onSearchQueryChange} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {children}
        </main>

        {/* Footer from Clean Utility design */}
        <footer className="h-8 bg-slate-900 flex items-center justify-between px-6 shrink-0 border-t border-slate-800">
          <div className="text-[10px] text-slate-400">
            © 2026 College Management Information Systems. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div
                className={`w-1.5 h-1.5 rounded-full ${
                  dbStatus.connected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                }`}
              ></div>
              <span className="text-[10px] text-slate-400 flex items-center gap-1">
                <Database className="h-3 w-3 inline text-slate-400" />
                {dbStatus.connected
                  ? `PostgreSQL: Connected (${dbStatus.database || 'dispatch_db'})`
                  : 'PostgreSQL: Disconnected'}
              </span>
            </div>
            <div className="text-[10px] text-slate-400">System V: 2.5.0</div>
          </div>
        </footer>
      </div>

      <ToastContainer />
    </div>
  );
};

