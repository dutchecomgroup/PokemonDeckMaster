import React, { createContext, useContext, useState, useEffect } from 'react';

interface GlobalNavContextType {
  isMobileSidebarOpen: boolean;
  setIsMobileSidebarOpen: (open: boolean) => void;
  openMobileSidebar: () => void;
  closeMobileSidebar: () => void;
}

const GlobalNavContext = createContext<GlobalNavContextType | undefined>(undefined);

export const GlobalNavProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  const openMobileSidebar = () => setIsMobileSidebarOpen(true);
  const closeMobileSidebar = () => setIsMobileSidebarOpen(false);

  // Listen for global sidebar open events (from edge swipe)
  useEffect(() => {
    const handleOpenSidebar = () => {
      setIsMobileSidebarOpen(true);
    };

    document.addEventListener('openMobileSidebar', handleOpenSidebar);
    return () => document.removeEventListener('openMobileSidebar', handleOpenSidebar);
  }, []);

  // Prevent body scroll when sidebar is open
  useEffect(() => {
    if (isMobileSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileSidebarOpen]);

  return (
    <GlobalNavContext.Provider
      value={{
        isMobileSidebarOpen,
        setIsMobileSidebarOpen,
        openMobileSidebar,
        closeMobileSidebar,
      }}
    >
      {children}
    </GlobalNavContext.Provider>
  );
};

export const useGlobalNav = () => {
  const context = useContext(GlobalNavContext);
  if (context === undefined) {
    throw new Error('useGlobalNav must be used within a GlobalNavProvider');
  }
  return context;
};