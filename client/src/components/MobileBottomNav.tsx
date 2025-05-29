import React from 'react';
import { Link, useLocation } from 'wouter';
import { Home, Folder, BarChart3, User, Menu } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileBottomNavProps {
  onMenuClick: () => void;
}

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ onMenuClick }) => {
  const [location] = useLocation();

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/collection', icon: Folder, label: 'Collections' },
    { path: '/stats', icon: BarChart3, label: 'Stats' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700 px-2 py-2 lg:hidden z-50">
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location === item.path;
          
          return (
            <Link key={item.path} href={item.path}>
              <div className={cn(
                "flex flex-col items-center justify-center p-2 rounded-lg min-w-[60px] transition-all duration-200",
                isActive 
                  ? "bg-purple-600/20 text-purple-300" 
                  : "text-slate-400 hover:text-white hover:bg-slate-700/50"
              )}>
                <Icon className="w-5 h-5 mb-1" />
                <span className="text-xs font-medium">{item.label}</span>
              </div>
            </Link>
          );
        })}
        
        {/* Menu/Sidebar Toggle */}
        <button
          onClick={onMenuClick}
          className="flex flex-col items-center justify-center p-2 rounded-lg min-w-[60px] text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all duration-200"
        >
          <Menu className="w-5 h-5 mb-1" />
          <span className="text-xs font-medium">More</span>
        </button>
      </div>
    </div>
  );
};

export default MobileBottomNav;