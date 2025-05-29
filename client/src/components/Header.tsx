import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'wouter';
import { useCollectionContext } from '@/context/CollectionContext';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/hooks/useAuth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import GlobalSearch from './GlobalSearch';
import ThemeToggle from './ThemeToggle';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger,
  DropdownMenuGroup
} from '@/components/ui/dropdown-menu';
import { 
  Home, 
  Search, 
  FolderOpen, 
  UserCircle, 
  LogOut, 
  Menu, 
  X, 
  BarChart3, 
  Settings, 
  ChevronDown, 
  ShieldCheck,
  Loader2,
  Sun,
  Moon
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const Header: React.FC = () => {
  const [location, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { collections, activeCollection } = useCollectionContext();
  const { user, logoutMutation } = useAuth();
  const { theme, setTheme } = useTheme();
  const previousLocation = useRef(location);
  
  // Check if we're on the auth page
  const isAuthPage = location === '/auth';

  // Track scroll position to add shadow effects and close menu when scrolling
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
      
      // Close mobile menu on scroll
      if (mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [mobileMenuOpen]);
  
  // Close mobile menu when location changes
  useEffect(() => {
    if (previousLocation.current !== location && mobileMenuOpen) {
      setMobileMenuOpen(false);
    }
    previousLocation.current = location;
  }, [location, mobileMenuOpen]);

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${
      scrolled 
        ? 'bg-background/95 dark:bg-background/95 backdrop-blur-sm shadow-md border-b border-border' 
        : 'bg-background dark:bg-background border-b border-transparent'
    }`}>
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        {/* Logo Area with Brand Gradient */}
        <div className="logo flex-shrink-0">
          <Link href="/" className="flex items-center">
            <div className="rounded-lg bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-2 mr-3 shadow-md">
              <i className="fas fa-dragon text-white text-xl"></i>
            </div>
            <div className="flex flex-col leading-tight">
              <span className="font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-lg tracking-tight">
                TCG DeckMaster
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 -mt-1">Pokémon Card Collection</span>
            </div>
          </Link>
        </div>
        
        {/* Desktop Navigation */}
        {user && (
          <nav className="hidden lg:block absolute left-1/2 transform -translate-x-1/2">
            <ul className="flex items-center space-x-1 h-10 relative bg-slate-50 dark:bg-slate-800/60 rounded-full px-1 shadow-inner">
              <NavLink href="/" label="Home" icon={<Home size={16} />} />
              <NavLink href="/search" label="Search" icon={<Search size={16} />} />
              <NavLink href="/collection" label="Collections" icon={<FolderOpen size={16} />} />
              <NavLink href="/statistics" label="Statistics" icon={<BarChart3 size={16} />} />
              {user.role === 'admin' && (
                <NavLink href="/admin" label="Admin" icon={<ShieldCheck size={16} />} />
              )}
            </ul>
          </nav>
        )}
        
        {/* Right Side Controls */}
        <div className="flex items-center gap-3">
          {/* Theme Toggle - Desktop */}
          <div className="hidden md:block">
            <ThemeToggle />
          </div>
          
          {/* Global search - hide on auth page */}
          {!isAuthPage && user && (
            <div className="hidden md:block">
              <GlobalSearch />
            </div>
          )}
          
          {/* Username as a link to settings and logout button */}
          {user ? (
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2 text-sm rounded-full border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all duration-200 bg-white dark:bg-slate-800 hover:bg-white/90 dark:hover:bg-slate-700/90 px-3 py-2 text-slate-800 dark:text-slate-200"
                onClick={() => {
                  // Always navigate to settings page regardless of screen size
                  setLocation("/settings");
                }}
              >
                <Avatar className="h-7 w-7 border border-slate-200 dark:border-slate-700">
                  {user.avatar ? (
                    <AvatarImage src={user.avatar} alt={user.username} />
                  ) : null}
                  <AvatarFallback className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs">
                    {user.username.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="hidden md:block font-medium">{user.displayName || user.username}</span>
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                className="hidden md:flex text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 dark:border-gray-700"
              >
                {logoutMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    <span>Logging out...</span>
                  </>
                ) : (
                  <>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Logout</span>
                  </>
                )}
              </Button>
            </div>
          ) : (
            !isAuthPage && (
              <>
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={() => setLocation("/auth")}
                  className="hidden md:flex bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 shadow-md text-white dark:text-white"
                >
                  <UserCircle className="h-4 w-4 mr-1.5" /> Sign In
                </Button>
                
                {/* Mobile Sign In Button */}
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={() => setLocation("/auth")}
                  className="md:hidden flex bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 shadow-md text-white dark:text-white"
                >
                  <UserCircle className="h-4 w-4" />
                </Button>
              </>
            )
          )}
          
          {/* Mobile Menu Toggle - Only shown when logged in */}
          {user && (
            <button 
              className="lg:hidden flex items-center justify-center h-9 w-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors" 
              aria-label="Toggle navigation"
              onClick={() => {
                setMobileMenuOpen(true);
              }}
            >
              <Menu size={18} />
            </button>
          )}
        </div>
      </div>
      
      {/* Clean dropdown menu style */}
      {user && (
        <div className={`lg:hidden fixed top-14 right-2 z-[9999] ${
          mobileMenuOpen ? 'block' : 'hidden'
        }`}>
          <div className="bg-background dark:bg-slate-900 shadow-lg rounded-md w-56 overflow-hidden border border-border">
            <div className="py-1.5">
              <div className="px-1">
                <MobileNavLink href="/" label="Home" icon={<Home size={16} />} onClick={() => setMobileMenuOpen(false)} />
                <MobileNavLink href="/search" label="Search" icon={<Search size={16} />} onClick={() => setMobileMenuOpen(false)} />
                <MobileNavLink href="/collection" label="Collections" icon={<FolderOpen size={16} />} onClick={() => setMobileMenuOpen(false)} />
                <MobileNavLink href="/statistics" label="Statistics" icon={<BarChart3 size={16} />} onClick={() => setMobileMenuOpen(false)} />
                {user.role === 'admin' && (
                  <MobileNavLink href="/admin" label="Admin Panel" icon={<ShieldCheck size={16} />} onClick={() => setMobileMenuOpen(false)} />
                )}
              </div>
              
              <div className="border-t border-gray-100 dark:border-gray-700 my-1"></div>
              
              <div className="px-1">
                {/* Theme Toggle for Mobile */}
                <button 
                  className="w-full flex items-center px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-md"
                  onClick={() => {
                    setTheme(theme === 'dark' ? 'light' : 'dark');
                    setMobileMenuOpen(false);
                  }}
                >
                  {theme === 'dark' ? (
                    <div className="flex items-center">
                      <Sun size={16} className="mr-2 text-gray-400 dark:text-gray-500" />
                      <span>Light Mode</span>
                    </div>
                  ) : (
                    <div className="flex items-center">
                      <Moon size={16} className="mr-2 text-gray-400 dark:text-gray-500" />
                      <span>Dark Mode</span>
                    </div>
                  )}
                </button>
                
                <Link 
                  href="/settings"
                  className="flex items-center px-3 py-1.5 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-800 rounded-md"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Settings size={16} className="mr-2 text-gray-400 dark:text-gray-500" />
                  <span>Settings</span>
                </Link>
                
                <button 
                  className="w-full flex items-center px-3 py-1.5 text-sm text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-md mx-1"
                  onClick={() => {
                    logoutMutation.mutate();
                    setMobileMenuOpen(false);
                  }}
                  disabled={logoutMutation.isPending}
                >
                  {logoutMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      <span>Logging out...</span>
                    </>
                  ) : (
                    <>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Logout</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Invisible overlay to detect clicks outside the menu */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-[9998]"
          onClick={() => setMobileMenuOpen(false)}
        ></div>
      )}
    </header>
  );
};

interface NavLinkProps {
  href: string;
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
}

const NavLink: React.FC<NavLinkProps> = ({ href, label, icon, onClick }) => {
  const [location] = useLocation();
  const isActive = location === href || (href !== '/' && location.startsWith(href));
  
  return (
    <li>
      <Link 
        href={href} 
        className={`flex items-center px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
          isActive 
            ? 'bg-white dark:bg-slate-700 text-violet-600 dark:text-violet-400 shadow-sm' 
            : 'text-slate-600 dark:text-slate-300 hover:text-violet-600 dark:hover:text-violet-400 hover:bg-white/70 dark:hover:bg-slate-700/70'
        }`}
        onClick={onClick}
      >
        <span className="mr-1.5">{icon}</span> {label}
      </Link>
    </li>
  );
};

const MobileNavLink: React.FC<NavLinkProps> = ({ href, label, icon, onClick }) => {
  const [location] = useLocation();
  const isActive = location === href || (href !== '/' && location.startsWith(href));
  
  return (
    <Link 
      href={href} 
      className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
        isActive 
          ? 'bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-950/50 dark:to-purple-950/50 text-purple-600 dark:text-purple-400 border-l-2 border-purple-500' 
          : 'text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-purple-600 dark:hover:text-purple-400'
      }`}
      onClick={onClick}
    >
      <span className="mr-3">{icon}</span> {label}
    </Link>
  );
};

export default Header;
