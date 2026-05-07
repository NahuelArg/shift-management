import React from 'react';
import { useLocation } from 'react-router-dom';
import { useSidebar } from '../../context/SidebarContext';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../ui/Avatar';

const pageTitles: Record<string, string> = {
  '/dashboard/admin':    'Dashboard',
  '/dashboard/employee': 'Dashboard',
  '/dashboard':          'Dashboard',
  '/calendar':           'Calendario',
  '/bookings':           'Turnos',
  '/services':           'Servicios',
  '/schedules':          'Horarios',
  '/business':           'Negocio',
  '/users':              'Usuarios',
};

const HamburgerIcon = () => (
  <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const TopBar: React.FC = () => {
  const { setMobileOpen } = useSidebar();
  const { user } = useAuth();
  const location = useLocation();

  const title = pageTitles[location.pathname] ?? 'ShiftManager';

  return (
    <header className="h-14 flex items-center justify-between px-4 bg-surface border-b border-border shrink-0">
      {/* Mobile: hamburger + title */}
      <div className="flex items-center gap-3">
        <button
          className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg text-content-2 hover:bg-surface-3 transition-colors"
          onClick={() => setMobileOpen(true)}
          aria-label="Abrir menú"
        >
          <HamburgerIcon />
        </button>
        <h1 className="text-base font-semibold text-content">{title}</h1>
      </div>

      {/* Right: avatar */}
      {user && (
        <div className="flex items-center gap-2">
          <span className="hidden sm:block text-sm text-content-2">{user.name}</span>
          <Avatar name={user.name} size="sm" />
        </div>
      )}
    </header>
  );
};

export default TopBar;
