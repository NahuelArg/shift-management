import React from 'react';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import MobileTabBar from './MobileTabBar';

interface AppShellProps {
  children: React.ReactNode;
}

const AppShell: React.FC<AppShellProps> = ({ children }) => (
  <div className="app-shell">
    <Sidebar />
    <div className="main-content">
      <TopBar />
      <main className="page-body animate-fade-in">
        {children}
      </main>
    </div>
    <MobileTabBar />
  </div>
);

export default AppShell;
