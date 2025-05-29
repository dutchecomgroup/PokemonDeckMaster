import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import Sidebar from './Sidebar';
import { cn } from '@/lib/utils';

interface MobileSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch?: (query: string, type: string, rarity: string) => void;
}

const MobileSidebar: React.FC<MobileSidebarProps> = ({ isOpen, onClose, onSearch }) => {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Handle swipe gestures
  useEffect(() => {
    let startX = 0;
    let currentX = 0;
    let isDragging = false;

    const handleTouchStart = (e: TouchEvent) => {
      startX = e.touches[0].clientX;
      isDragging = true;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging) return;
      
      currentX = e.touches[0].clientX;
      const diffX = currentX - startX;
      
      // Only allow swiping left to close
      if (diffX < 0 && sidebarRef.current) {
        const translateX = Math.max(diffX, -320); // Sidebar width
        sidebarRef.current.style.transform = `translateX(${translateX}px)`;
      }
    };

    const handleTouchEnd = () => {
      if (!isDragging) return;
      
      const diffX = currentX - startX;
      
      if (sidebarRef.current) {
        sidebarRef.current.style.transform = '';
        
        // Close if swiped more than 100px to the left
        if (diffX < -100) {
          onClose();
        }
      }
      
      isDragging = false;
    };

    // Add global swipe-in gesture from left edge
    const handleGlobalTouchStart = (e: TouchEvent) => {
      const startX = e.touches[0].clientX;
      
      // Detect swipe from left edge (within 20px)
      if (startX < 20 && !isOpen) {
        // Show a subtle hint that swipe is detected
        // This could be expanded to show a preview
      }
    };

    if (isOpen && sidebarRef.current) {
      sidebarRef.current.addEventListener('touchstart', handleTouchStart);
      sidebarRef.current.addEventListener('touchmove', handleTouchMove);
      sidebarRef.current.addEventListener('touchend', handleTouchEnd);
    }

    // Global listener for swipe-in
    document.addEventListener('touchstart', handleGlobalTouchStart);

    return () => {
      if (sidebarRef.current) {
        sidebarRef.current.removeEventListener('touchstart', handleTouchStart);
        sidebarRef.current.removeEventListener('touchmove', handleTouchMove);
        sidebarRef.current.removeEventListener('touchend', handleTouchEnd);
      }
      document.removeEventListener('touchstart', handleGlobalTouchStart);
    };
  }, [isOpen, onClose]);

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

  return (
    <>
      {/* Overlay */}
      <div
        ref={overlayRef}
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
        {/* Header with close button */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-lg font-semibold text-white">Menu</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sidebar content */}
        <div className="pb-20"> {/* Add bottom padding for bottom nav */}
          <Sidebar onSearch={onSearch} />
        </div>
      </div>

      {/* Swipe indicator - subtle visual hint */}
      {!isOpen && (
        <div className="fixed left-0 top-1/2 transform -translate-y-1/2 w-1 h-12 bg-gradient-to-b from-purple-600/50 to-transparent rounded-r-full lg:hidden z-30 opacity-30">
        </div>
      )}
    </>
  );
};

export default MobileSidebar;