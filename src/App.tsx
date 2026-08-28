import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { MainLayout } from './components/layout/MainLayout';
import { LoginPage } from './pages/LoginPage';
import { DispatchDashboardPage } from './pages/DispatchDashboardPage';
import { DispatchUploadPage } from './pages/DispatchUploadPage';
import { InboxPage } from './pages/InboxPage';
import { OutboxPage } from './pages/OutboxPage';
import { DepartmentRegistryPage } from './pages/DepartmentRegistryPage';
import { SecurityAuditPage } from './pages/SecurityAuditPage';

const AppContent: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (!user) {
    return <LoginPage />;
  }

  const renderActivePage = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DispatchDashboardPage onNavigateUpload={() => setActiveTab('dispatch')} />;
      case 'dispatch':
        return <DispatchUploadPage onSuccess={() => setActiveTab('outbox')} />;
      case 'inbox':
        return <InboxPage />;
      case 'outbox':
        return <OutboxPage />;
      case 'departments':
        return <DepartmentRegistryPage />;
      case 'audit':
        return <SecurityAuditPage />;
      default:
        return <DispatchDashboardPage onNavigateUpload={() => setActiveTab('dispatch')} />;
    }
  };

  return (
    <MainLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderActivePage()}
    </MainLayout>
  );
};

export function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <AppContent />
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
