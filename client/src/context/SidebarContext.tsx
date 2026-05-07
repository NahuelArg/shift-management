import React, { createContext, useContext, useEffect, useState } from 'react';

interface SidebarContextType {
  compact: boolean;
  toggleCompact: () => void;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

const STORAGE_KEY = 'sidebar-compact';

export const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [compact, setCompact] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) === 'true';
    } catch {
      return false;
    }
  });
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(compact));
    } catch {
      // ignore
    }
  }, [compact]);

  const toggleCompact = () => setCompact(prev => !prev);

  return (
    <SidebarContext.Provider value={{ compact, toggleCompact, mobileOpen, setMobileOpen }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error('useSidebar must be used within SidebarProvider');
  return ctx;
};
