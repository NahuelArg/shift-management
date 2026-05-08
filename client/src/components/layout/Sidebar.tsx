import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSidebar } from '../../context/SidebarContext';
import Avatar from '../ui/Avatar';

interface NavItem {
  to: string;
  label: string;
  icon: React.ReactNode;
}

const HomeIcon = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);
const UsersIcon = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path strokeLinecap="round" d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
  </svg>
);
const ScissorsIcon = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
    <circle cx="6" cy="6" r="3" /><circle cx="6" cy="18" r="3" /><path strokeLinecap="round" d="M20 4L8.12 15.88M14.47 14.48L20 20M8.12 8.12L12 12" />
  </svg>
);
const ClockIcon = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" /><path strokeLinecap="round" d="M12 6v6l4 2" />
  </svg>
);
const BookmarkIcon = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2v16z" />
  </svg>
);
const ChartIcon = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);
const CalendarIcon = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
    <rect x="3" y="4" width="18" height="18" rx="2" /><path strokeLinecap="round" d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);
const HistoryIcon = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const ChevronIcon = ({ flipped }: { flipped?: boolean }) => (
  <svg
    width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
    style={{ transform: flipped ? 'rotate(180deg)' : undefined, transition: 'transform 0.2s' }}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
  </svg>
);
const LogoutIcon = () => (
  <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const navByRole: Record<string, NavItem[]> = {
  ADMIN: [
    { to: '/dashboard/admin', label: 'Dashboard',  icon: <HomeIcon /> },
    { to: '/users',           label: 'Empleados',  icon: <UsersIcon /> },
    { to: '/bookings',        label: 'Reservas',   icon: <BookmarkIcon /> },
    { to: '/services',        label: 'Servicios',  icon: <ScissorsIcon /> },
    { to: '/schedules',       label: 'Horarios',   icon: <ClockIcon /> },
    { to: '/calendar',        label: 'Calendario', icon: <CalendarIcon /> },
  ],
  EMPLOYEE: [
    { to: '/dashboard/employee', label: 'Mis Turnos', icon: <HomeIcon /> },
    { to: '/bookings',           label: 'Historial',  icon: <HistoryIcon /> },
  ],
  CLIENT: [
    { to: '/dashboard', label: 'Mis Reservas', icon: <HomeIcon /> },
    { to: '/bookings',  label: 'Reservar',     icon: <BookmarkIcon /> },
  ],
};

const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const { compact, toggleCompact, mobileOpen, setMobileOpen } = useSidebar();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/home');
  };

  const visibleItems: NavItem[] = user ? (navByRole[user.role] ?? []) : [];
  const isActive = (to: string) => location.pathname === to;

  const sidebarContent = (
    <aside
      className={`
        flex flex-col h-full bg-sidebar transition-all duration-200
        ${compact ? 'w-16' : 'w-60'}
      `}
    >
      {/* Logo + collapse toggle */}
      <div className={`flex items-center h-16 px-4 border-b border-white/5 ${compact ? 'justify-center' : 'justify-between'}`}>
        {!compact && (
          <Link to="/home" className="text-sidebar-text-active font-bold text-base tracking-tight truncate hover:text-white transition-colors">
            ShiftManager
          </Link>
        )}
        <button
          onClick={toggleCompact}
          className="w-8 h-8 flex items-center justify-center rounded-lg text-sidebar-text hover:text-sidebar-text-active hover:bg-sidebar-hover transition-colors shrink-0"
          aria-label={compact ? 'Expandir sidebar' : 'Colapsar sidebar'}
        >
          <ChevronIcon flipped={!compact} />
        </button>
      </div>

      {/* Nav items */}
      <nav className="flex-1 py-3 overflow-y-auto">
        {visibleItems.map(item => (
          <Link
            key={item.to + item.label}
            to={item.to}
            onClick={() => setMobileOpen(false)}
            title={compact ? item.label : undefined}
            className={`
              flex items-center gap-3 mx-2 mb-0.5 px-3 py-2.5 rounded-lg text-sm font-medium
              transition-colors duration-150
              ${isActive(item.to)
                ? 'bg-sidebar-active text-sidebar-text-active'
                : 'text-sidebar-text hover:bg-sidebar-hover hover:text-sidebar-text-active'
              }
              ${compact ? 'justify-center px-0' : ''}
            `}
          >
            <span className="shrink-0">{item.icon}</span>
            {!compact && <span className="truncate">{item.label}</span>}
          </Link>
        ))}
      </nav>

      {/* User + logout */}
      <div className="border-t border-white/5 p-3">
        {user && !compact && (
          <div className="flex items-center gap-3 px-2 py-2 mb-1">
            <Avatar name={user.name} size="sm" className="shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-sidebar-text-active truncate">{user.name}</p>
              <p className="text-xs text-sidebar-text truncate">{user.role}</p>
            </div>
          </div>
        )}
        <button
          onClick={handleLogout}
          title={compact ? 'Cerrar sesión' : undefined}
          className={`
            w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
            text-sidebar-text hover:bg-sidebar-hover hover:text-danger transition-colors
            ${compact ? 'justify-center' : ''}
          `}
        >
          <LogoutIcon />
          {!compact && 'Cerrar sesión'}
        </button>
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:flex h-full shrink-0">{sidebarContent}</div>

      {/* Mobile overlay + drawer */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="relative z-50 animate-slide-in-left w-60">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
