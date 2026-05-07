import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface TabItem {
  to: string;
  label: string;
  icon: React.ReactNode;
  roles?: Array<'ADMIN' | 'CLIENT' | 'EMPLOYEE'>;
}

const HomeIcon = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);
const CalendarIcon = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
    <rect x="3" y="4" width="18" height="18" rx="2" /><path strokeLinecap="round" d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);
const BookmarkIcon = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z" />
  </svg>
);
const UsersIcon = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" />
  </svg>
);
const ScissorsIcon = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
    <circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><path strokeLinecap="round" d="M20 4L8.12 15.88M14.47 14.48L20 20M8.12 8.12L12 12" />
  </svg>
);

const tabs: TabItem[] = [
  { to: '/dashboard',          label: 'Inicio',    icon: <HomeIcon />,     roles: ['CLIENT'] },
  { to: '/dashboard/employee', label: 'Inicio',    icon: <HomeIcon />,     roles: ['EMPLOYEE'] },
  { to: '/dashboard/admin',    label: 'Inicio',    icon: <HomeIcon />,     roles: ['ADMIN'] },
  { to: '/calendar',           label: 'Calendario', icon: <CalendarIcon />, roles: ['ADMIN', 'EMPLOYEE'] },
  { to: '/bookings',           label: 'Turnos',    icon: <BookmarkIcon />, roles: ['ADMIN', 'CLIENT', 'EMPLOYEE'] },
  { to: '/services',           label: 'Servicios', icon: <ScissorsIcon />, roles: ['ADMIN'] },
  { to: '/users',              label: 'Usuarios',  icon: <UsersIcon />,    roles: ['ADMIN'] },
];

const MobileTabBar: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const visibleTabs = tabs.filter(t => !t.roles || t.roles.includes(user.role)).slice(0, 5);

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-surface border-t border-border
                 flex items-center justify-around px-2 pb-safe"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      {visibleTabs.map(tab => {
        const active = location.pathname === tab.to;
        return (
          <Link
            key={tab.to}
            to={tab.to}
            className={`flex flex-col items-center gap-0.5 py-2 px-3 text-xs font-medium transition-colors
              ${active ? 'text-primary' : 'text-content-3 hover:text-content-2'}`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

export default MobileTabBar;
