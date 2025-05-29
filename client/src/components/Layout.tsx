import React, { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';
import { useLocation } from 'wouter';
import { useCollectionContext } from '@/context/CollectionContext';
import { useAuth } from '@/hooks/useAuth';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [location] = useLocation();
  const { activeCollection } = useCollectionContext();
  const { user, isLoading } = useAuth();
  
  // Determine if we should show the status indicator based on the current location
  // AND user being logged in
  const showStatusIndicator = location !== "/" && location !== "/auth" && Boolean(user);
  
  // Helper function to get view name based on location
  const getViewName = (): string => {
    let viewName = "Loading...";
    
    if (location.startsWith("/collection")) {
      viewName = "Collection Manager";
    } else if (location.startsWith("/set/")) {
      viewName = "Set Viewer";
    } else if (location === "/my-collection") {
      viewName = "My Collection";
    } else if (location === "/search") {
      viewName = "Search Results";
    } else if (location.startsWith("/admin")) {
      viewName = "Admin Panel";
    } else if (location.startsWith("/card/")) {
      viewName = "Card Details";
    }
    
    return viewName;
  };
  
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      
      {/* Status indicator removed as requested */}
      
      <main className="flex-grow container mx-auto px-4 py-6">
        {children}
      </main>
      
      <Footer />
    </div>
  );
};

export default Layout;