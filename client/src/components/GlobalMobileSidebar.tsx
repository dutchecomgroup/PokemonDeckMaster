import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'wouter';
import { X, Search, Settings, Star, Crown, HelpCircle, LogOut, Palette, Moon, Sun } from 'lucide-react';
import Sidebar from './Sidebar';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

interface GlobalMobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const GlobalMobileSidebar: React.FC<GlobalMobileSidebarProps> = ({ isOpen, onClose }) => {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const { user, logoutMutation } = useAuth();
  const [swipeStartX, setSwipeStartX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Enhanced swipe handling
  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      if (!isOpen) return;
      setSwipeStartX(e.touches[0].clientX);
      setIsDragging(true);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging || !isOpen) return;
      
      const currentX = e.touches[0].clientX;
      const diffX = currentX - swipeStartX;
      
      // Only allow swiping left to close
      if (diffX < 0 && sidebarRef.current) {
        const translateX = Math.max(diffX, -320);
        sidebarRef.current.style.transform = `translateX(${translateX}px)`;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isDragging || !isOpen) return;
      
      const currentX = e.changedTouches[0].clientX;
      const diffX = currentX - swipeStartX;
      
      if (sidebarRef.current) {
        sidebarRef.current.style.transform = '';
        
        // Close if swiped more than 80px to the left
        if (diffX < -80) {
          onClose();
        }
      }
      
      setIsDragging(false);
    };

    // Global swipe-in from left edge detection
    const handleGlobalTouchStart = (e: TouchEvent) => {
      const startX = e.touches[0].clientX;
      
      // Detect swipe from left edge (within 25px) when sidebar is closed
      if (startX < 25 && !isOpen) {
        let moved = false;
        
        const handleMove = (moveEvent: TouchEvent) => {
          const currentX = moveEvent.touches[0].clientX;
          if (currentX - startX > 50 && !moved) {
            moved = true;
            // Open sidebar on successful swipe-in
            setTimeout(() => {
              if (!isOpen) {
                // Trigger a custom event or call a function to open
                document.dispatchEvent(new CustomEvent('openMobileSidebar'));
              }
            }, 100);
          }
        };
        
        const handleEnd = () => {
          document.removeEventListener('touchmove', handleMove);
          document.removeEventListener('touchend', handleEnd);
        };
        
        document.addEventListener('touchmove', handleMove);
        document.addEventListener('touchend', handleEnd);
      }
    };

    if (sidebarRef.current) {
      sidebarRef.current.addEventListener('touchstart', handleTouchStart, { passive: true });
      sidebarRef.current.addEventListener('touchmove', handleTouchMove, { passive: true });
      sidebarRef.current.addEventListener('touchend', handleTouchEnd, { passive: true });
    }

    // Global edge swipe listener
    document.addEventListener('touchstart', handleGlobalTouchStart, { passive: true });

    return () => {
      if (sidebarRef.current) {
        sidebarRef.current.removeEventListener('touchstart', handleTouchStart);
        sidebarRef.current.removeEventListener('touchmove', handleTouchMove);
        sidebarRef.current.removeEventListener('touchend', handleTouchEnd);
      }
      document.removeEventListener('touchstart', handleGlobalTouchStart);
    };
  }, [isOpen, onClose, swipeStartX, isDragging]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const quickActions = [
    { icon: Search, label: 'Search Cards', path: '/search' },
    { icon: Star, label: 'Favorites', path: '/favorites' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          "fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden z-40",
          isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        ref={sidebarRef}
        className={cn(
          "fixed top-0 left-0 h-full w-80 bg-slate-800 border-r border-slate-700 transform transition-transform duration-300 ease-out lg:hidden z-50 overflow-y-auto",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* User Profile Header */}
        <div className="p-4 bg-gradient-to-r from-purple-600/20 to-blue-600/20 border-b border-slate-700">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold">
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
              <div>
                <h3 className="text-white font-semibold">{user?.username || 'Guest'}</h3>
                <p className="text-slate-400 text-sm">{user?.email || 'Not logged in'}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          {user && (
            <Badge className="bg-green-600/20 text-green-300 border-green-500/30">
              <Crown className="w-3 h-3 mr-1" />
              Premium Member
            </Badge>
          )}
        </div>

        {/* Quick Actions */}
        <div className="p-4 border-b border-slate-700">
          <h4 className="text-slate-300 font-medium mb-3">Quick Actions</h4>
          <div className="grid grid-cols-3 gap-2">
            {quickActions.map((action) => (
              <Link key={action.path} href={action.path}>
                <button
                  onClick={() => {
                    setTimeout(() => onClose(), 100); // Auto-close with smooth transition
                  }}
                  className="flex flex-col items-center p-3 rounded-lg bg-slate-700/50 hover:bg-slate-700 transition-colors"
                >
                  <action.icon className="w-5 h-5 text-purple-400 mb-1" />
                  <span className="text-xs text-slate-300">{action.label}</span>
                </button>
              </Link>
            ))}
          </div>
        </div>

        {/* Main Sidebar Content */}
        <div className="flex-1" onClick={(e) => {
          // Auto-close sidebar when clicking on navigation links
          const target = e.target as HTMLElement;
          if (target.tagName === 'A' || target.closest('a')) {
            setTimeout(() => onClose(), 150); // Small delay for smooth transition
          }
        }}>
          <Sidebar onSearch={(query, type, rarity) => {
            console.log('Global sidebar search:', { query, type, rarity });
            onClose();
          }} />
        </div>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-slate-700 space-y-2">
          <Separator className="mb-3" />
          
          <Link href="/help">
            <button
              onClick={onClose}
              className="w-full flex items-center space-x-3 p-3 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            >
              <HelpCircle className="w-5 h-5" />
              <span>Help & Support</span>
            </button>
          </Link>

          {user && (
            <button
              onClick={() => {
                logoutMutation.mutate();
                onClose();
              }}
              className="w-full flex items-center space-x-3 p-3 rounded-lg text-red-400 hover:text-red-300 hover:bg-red-600/10 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span>Sign Out</span>
            </button>
          )}
        </div>
      </div>

      {/* Swipe Indicator - Enhanced */}
      {!isOpen && (
        <div className="fixed left-0 top-1/2 transform -translate-y-1/2 w-1 h-16 bg-gradient-to-b from-transparent via-purple-600/60 to-transparent rounded-r-full lg:hidden z-30 opacity-40 animate-pulse">
        </div>
      )}
    </>
  );
};

export default GlobalMobileSidebar;