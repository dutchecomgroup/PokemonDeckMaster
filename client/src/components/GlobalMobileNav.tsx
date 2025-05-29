import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'wouter';
import { Home, Folder, BarChart3, User, Menu, Settings, Star, Search, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

interface GlobalMobileNavProps {
  onSidebarToggle: () => void;
}

const GlobalMobileNav: React.FC<GlobalMobileNavProps> = ({ onSidebarToggle }) => {
  const [location] = useLocation();
  const { user } = useAuth();
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Auto-hide on scroll down, show on scroll up
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false); // Hide on scroll down
      } else {
        setIsVisible(true); // Show on scroll up
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const navItems = [
    { 
      path: '/', 
      icon: Home, 
      label: 'Home',
      isActive: location === '/'
    },
    { 
      path: '/collection', 
      icon: Folder, 
      label: 'Collections',
      isActive: location.startsWith('/collection')
    },
    { 
      path: '/statistics', 
      icon: BarChart3, 
      label: 'Stats',
      isActive: location.startsWith('/statistics')
    },
    { 
      path: '/settings', 
      icon: User, 
      label: 'Profile',
      isActive: location.startsWith('/settings') || location.startsWith('/profile')
    },
  ];

  return (
    <div className={cn(
      "fixed bottom-0 left-0 right-0 bg-slate-800/95 backdrop-blur-sm border-t border-slate-700 px-2 py-2 lg:hidden z-50 transition-transform duration-300",
      isVisible ? "translate-y-0" : "translate-y-full"
    )}>
      <div className="flex items-center justify-around max-w-md mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          
          return (
            <Link key={item.path} href={item.path}>
              <div className={cn(
                "flex flex-col items-center justify-center p-3 rounded-xl min-w-[64px] transition-all duration-200 active:scale-95 cursor-pointer",
                item.isActive 
                  ? "bg-purple-600/20 text-purple-300 shadow-lg" 
                  : "text-slate-400 hover:text-white hover:bg-slate-700/50"
              )}>
                <Icon className={cn(
                  "mb-1 transition-all duration-200",
                  item.isActive ? "w-6 h-6" : "w-5 h-5"
                )} />
                <span className={cn(
                  "font-medium transition-all duration-200",
                  item.isActive ? "text-xs" : "text-xs"
                )}>{item.label}</span>
              </div>
            </Link>
          );
        })}
        
        {/* Menu/Sidebar Toggle */}
        <button
          onClick={onSidebarToggle}
          className="flex flex-col items-center justify-center p-3 rounded-xl min-w-[64px] text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all duration-200 active:scale-95"
        >
          <Menu className="w-5 h-5 mb-1" />
          <span className="text-xs font-medium">More</span>
        </button>
      </div>

      {/* Connection status indicator */}
      {user && (
        <div className="absolute top-1 right-2 w-2 h-2 bg-green-400 rounded-full opacity-60"></div>
      )}
    </div>
  );
};

export default GlobalMobileNav;