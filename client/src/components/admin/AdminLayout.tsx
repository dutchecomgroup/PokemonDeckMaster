import React, { ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { 
  LayoutDashboard, 
  Users, 
  FileStack, 
  Database, 
  Settings, 
  LogOut,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title }) => {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();

  const navItems = [
    { label: 'Dashboard', icon: <LayoutDashboard size={20} />, href: '/admin' },
    { label: 'Gebruikers', icon: <Users size={20} />, href: '/admin/users' },
    { label: 'Collecties', icon: <FileStack size={20} />, href: '/admin/collections' },
    { label: 'Kaarten', icon: <Database size={20} />, href: '/admin/cards' },
    { label: 'Instellingen', icon: <Settings size={20} />, href: '/admin/settings' },
  ];

  const isActive = (path: string) => location === path;

  return (
    <div className="flex min-h-screen bg-muted/20">
      {/* Sidebar */}
      <div className="hidden md:flex flex-col w-64 bg-card border-r border-border shadow-sm">
        <div className="p-4 bg-primary text-primary-foreground">
          <h2 className="text-xl font-bold">Admin Panel</h2>
          <p className="text-xs opacity-70">TCG DeckMaster</p>
        </div>
        
        <div className="flex-1 overflow-y-auto py-4">
          <nav className="px-2 space-y-1">
            {navItems.map((item, index) => (
              <Link 
                key={index} 
                href={item.href}
                className={`flex items-center px-4 py-2 text-sm rounded-md ${
                  isActive(item.href) 
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-foreground hover:bg-muted transition-colors'
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        
        <div className="p-4 border-t border-border">
          <div className="flex items-center mb-4">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary mr-2">
              {user?.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium">{user?.username}</p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full flex items-center"
            onClick={() => logoutMutation.mutate()}
          >
            <LogOut size={16} className="mr-2" /> 
            Uitloggen
          </Button>
        </div>
      </div>
      
      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <header className="bg-card border-b border-border shadow-sm">
          <div className="flex items-center justify-between px-4 py-3">
            <div>
              <h1 className="text-2xl font-bold">{title}</h1>
              <div className="flex items-center text-sm text-muted-foreground">
                <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
                <ChevronRight size={14} className="mx-1" />
                <Link href="/admin" className="hover:text-foreground transition-colors">Admin</Link>
                {title !== 'Admin Dashboard' && (
                  <>
                    <ChevronRight size={14} className="mx-1" />
                    <span className="text-foreground">{title}</span>
                  </>
                )}
              </div>
            </div>
            <div className="md:hidden">
              {/* Mobile menu button would go here */}
            </div>
          </div>
        </header>
        
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;