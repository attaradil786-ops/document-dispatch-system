import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserAccount, Role } from '../types';
import { storageService } from '../services/storageService';

interface AuthContextType {
  user: UserAccount | null;
  role: Role;
  departmentId: string;
  departmentName: string;
  isMainDept: boolean;
  isAuthenticated: boolean;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  login: (email: string, password?: string) => Promise<boolean>;
  loginAsDepartment: (email: string) => void;
  logout: () => void;
  switchAccount: (accountId: string) => void;
  forgotPassword: (email: string) => Promise<{ success: boolean; message: string }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Always start unauthenticated so the landing page (Step 1: Choose Department -> Step 2: Password) is shown on opening
  const [user, setUser] = useState<UserAccount | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    return (localStorage.getItem('DISPATCH_THEME') as 'light' | 'dark') || 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('DISPATCH_THEME', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const login = async (email: string, password?: string): Promise<boolean> => {
    const account = storageService.getAccountByEmail(email);
    if (account) {
      if (password && password.trim()) {
        const inputPassLower = password.trim().toLowerCase();
        const emailPrefix = account.email.split('@')[0].toLowerCase();
        const expectedDefault = `${emailPrefix}@123`;
        const accountPasswordLower = (account.password || expectedDefault).toLowerCase();
        const deptCodePassword = `${account.id.replace('user-', '')}@123`.toLowerCase();

        if (
          inputPassLower === accountPasswordLower ||
          inputPassLower === expectedDefault ||
          inputPassLower === deptCodePassword ||
          inputPassLower === 'password123'
        ) {
          setUser(account);
          localStorage.setItem('DISPATCH_CURRENT_USER', JSON.stringify(account));
          return true;
        }
        return false;
      }
      setUser(account);
      localStorage.setItem('DISPATCH_CURRENT_USER', JSON.stringify(account));
      return true;
    }
    return false;
  };

  const loginAsDepartment = (email: string) => {
    const account = storageService.getAccountByEmail(email);
    if (account) {
      setUser(account);
      localStorage.setItem('DISPATCH_CURRENT_USER', JSON.stringify(account));
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('DISPATCH_CURRENT_USER');
  };

  const switchAccount = (accountId: string) => {
    const accs = storageService.getAccounts();
    const found = accs.find((a) => a.id === accountId);
    if (found) {
      setUser(found);
      localStorage.setItem('DISPATCH_CURRENT_USER', JSON.stringify(found));
    }
  };

  const forgotPassword = async (email: string) => {
    const account = storageService.getAccountByEmail(email);
    if (account) {
      return { success: true, message: `Password reset instructions sent to ${email}` };
    }
    return { success: false, message: 'No registered account found with this email.' };
  };

  const role: Role = user?.role || 'main_department';
  const departmentId = user?.department_id || 'main-dept';
  const departmentName = user?.department_name || 'Main Department (Central HQ & Registry)';
  const isMainDept = user?.is_main_dept ?? true;

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        departmentId,
        departmentName,
        isMainDept,
        isAuthenticated: !!user,
        theme,
        toggleTheme,
        login,
        loginAsDepartment,
        logout,
        switchAccount,
        forgotPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
