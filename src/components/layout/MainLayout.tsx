import React, { useState, useEffect } from 'react';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { ToastContainer } from '../common/ToastContainer';
import { Menu, Database } from 'lucide-react';
import { storageService } from '../../services/storageService';

interface MainLayoutProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onSearchQueryChange?: (query: string) => void;
  children: React.ReactNode;
}

const RAW_API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.trim() || (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:3000' : '');
export const API_BASE = RAW_API_URL.replace(/\/+$/, '');

export const MainLayout: React.FC<MainLayoutProps> = ({
  activeTab,
  setActiveTab,
  onSearchQueryChange,
  children,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dbStatus, setDbStatus] = useState<{ connected: boolean; database?: string }>({
    connected: false,
    database: 'dispatch_db',
  });

  useEffect(() => {
    let isMounted = true;

    const checkDatabaseHealth = async () => {
      // 1. Sync immediately with StorageService connection state if available
      if (storageService.isCloudConnected()) {
        if (isMounted) {
          setDbStatus({
            connected: true,
            database: 'PostgreSQL',
          });
        }
      }

      const endpoint = API_BASE ? `${API_BASE}/api/health` : '/api/health';
      try {
        const res = await fetch(endpoint, {
          headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true',
          },
          cache: 'no-store',
        });
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            if (
              data &&
              (data.status === 'online' ||
                data.status === 'connected' ||
                data.database === 'connected' ||
                data.connected === true ||
                data.ok === true)
            ) {
              setDbStatus({
                connected: true,
                database: data.database || data.db_name || 'PostgreSQL',
              });
              return;
            }
          }
        }
      } catch (err) {
        // Fallback probe
      }

      // Check fallback via storage service state
      if (isMounted) {
        setDbStatus({
          connected: storageService.isCloudConnected(),
          database: 'PostgreSQL',
        });
      }
    };

    checkDatabaseHealth();
    const unsubscribe = storageService.subscribe(checkDatabaseHealth);
    const interval = setInterval(checkDatabaseHealth, 4000);

    return () => {
      isMounted = false;
      unsubscribe();
      clearInterval(interval);
    };
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
              ✕
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
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        {/* Mobile Top Header */}
        <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
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

        {/* Footer with PostgreSQL Connection Badge */}
        <footer className="h-9 bg-slate-900 flex items-center justify-between px-6 shrink-0 border-t border-slate-800">
          <div className="text-[10px] text-slate-400">
            © 2026 College Management Information Systems. All rights reserved.
          </div>
          <div className="flex items-center gap-4">
            <div
              className="flex items-center gap-1.5"
              title={dbStatus.connected ? 'Live connection to PostgreSQL Database' : 'Database Disconnected'}
            >
              <div
                className={`w-2 h-2 rounded-full ${dbStatus.connected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                  }`}
              ></div>
              <span
                className={`text-[10px] font-semibold flex items-center gap-1 ${dbStatus.connected ? 'text-emerald-400' : 'text-rose-400'
                  }`}
              >
                <Database className="h-3 w-3 inline" />
                {dbStatus.connected ? 'PostgreSQL: Connected' : 'PostgreSQL: Disconnected'}
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