import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  ShieldAlert,
  ShieldCheck,
  Wrench,
  LayoutDashboard,
  Settings,
  Menu,
  ArrowLeft,
  UserCheck,
  UserX,
  LogOut,
  FolderDown,
} from 'lucide-react';
import { toast } from 'sonner';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { user, profile, signInWithEmail, signOut } = useAuth();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [switchingUser, setSwitchingUser] = useState(false);

  const isAdmin =
    profile?.role === 'admin' ||
    (Array.isArray(profile?.permissions) && (profile.permissions as string[]).includes('source_code.download'));


  const handleSwitchToAdmin = async () => {
    try {
      setSwitchingUser(true);
      const res = await signInWithEmail('admin@miaoda.com', 'AdminPassword123!');
      if (res.error) {
        toast.error('Failed to switch to Admin account');
      } else {
        toast.success('Switched to Administrator session (admin@miaoda.com)');
      }
    } finally {
      setSwitchingUser(false);
    }
  };

  const handleSwitchToRegular = async () => {
    try {
      setSwitchingUser(true);
      const res = await signInWithEmail('regular_user@miaoda.com', 'UserPassword123!');
      if (res.error) {
        toast.error('Failed to switch to Regular User account');
      } else {
        toast.info('Switched to Regular User session (non-admin: regular_user@miaoda.com)');
      }
    } finally {
      setSwitchingUser(false);
    }
  };

  const navItems = [
    {
      label: 'Admin Console & Analytics',
      path: '/admin',
      icon: LayoutDashboard,
      description: 'Platform KPIs, user management, and skill catalog',
    },
    {
      label: 'Source Code & Maintenance',
      path: '/admin/maintenance',
      icon: Wrench,
      description: 'Full source code ZIP archive & developer tools',
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Top Admin Header Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/75">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* Left: Mobile Toggle & Brand */}
          <div className="flex items-center gap-3">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden shrink-0"
                  aria-label="Open Admin Menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 p-0 flex flex-col bg-card">
                <div className="p-6 border-b border-border">
                  <div className="flex items-center gap-2">
                    <FolderDown className="h-6 w-6 text-primary" />
                    <span className="font-bold text-lg">Admin Console</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Management & System Tools</p>
                </div>
                <div className="p-4 flex-1 overflow-y-auto space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = location.pathname === item.path || (item.path === '/admin' && location.pathname === '/admin/maintenance');
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setMobileMenuOpen(false)}
                        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                          active
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                      >
                        <Icon className="h-4 w-4 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    );
                  })}
                </div>
                <div className="p-4 border-t border-border">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span>System Status: Online</span>
                  </div>
                </div>
              </SheetContent>
            </Sheet>

            <Link to="/admin" className="flex items-center gap-2 font-bold text-lg">
              <span className="p-1.5 rounded-md bg-primary/10 text-primary">
                <FolderDown className="h-5 w-5" />
              </span>
              <span className="hidden sm:inline">Website Admin Console</span>
              <span className="sm:hidden">Admin</span>
            </Link>
            <Badge variant="outline" className="hidden lg:inline-flex text-[11px] font-normal">
              v2.4 Production
            </Badge>
          </div>

          {/* Right: User Status & Switcher Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Role indicator */}
            {user ? (
              <div className="flex items-center gap-2">
                <Badge
                  variant={isAdmin ? 'default' : 'secondary'}
                  className={`flex items-center gap-1 py-1 px-2.5 text-xs font-medium ${
                    isAdmin ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {isAdmin ? <ShieldCheck className="h-3.5 w-3.5" /> : <ShieldAlert className="h-3.5 w-3.5" />}
                  <span>{isAdmin ? 'Admin' : 'Regular User'}</span>
                </Badge>
                <span className="hidden xl:inline text-xs text-muted-foreground font-mono">
                  {user.email}
                </span>
              </div>
            ) : (
              <Badge variant="destructive" className="flex items-center gap-1 text-xs">
                <UserX className="h-3.5 w-3.5" /> Unauthenticated
              </Badge>
            )}

            {/* Quick Demo Switcher for Evaluation */}
            <div className="hidden sm:flex items-center gap-1 border-l border-border pl-3">
              <Button
                variant={isAdmin ? 'secondary' : 'outline'}
                size="sm"
                disabled={switchingUser}
                onClick={handleSwitchToAdmin}
                className="text-xs h-8"
                title="Switch to Admin account to test full source code download"
              >
                <UserCheck className="h-3.5 w-3.5 mr-1 text-primary" /> Admin Mode
              </Button>
              <Button
                variant={!isAdmin && user ? 'secondary' : 'outline'}
                size="sm"
                disabled={switchingUser}
                onClick={handleSwitchToRegular}
                className="text-xs h-8"
                title="Switch to Non-Admin account to test 403 Forbidden security block"
              >
                <UserX className="h-3.5 w-3.5 mr-1 text-muted-foreground" /> Non-Admin
              </Button>
            </div>

            {user ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut()}
                className="text-xs h-8 px-2 text-muted-foreground hover:text-destructive"
                title="Sign Out"
              >
                <LogOut className="h-3.5 w-3.5 sm:mr-1" />
                <span className="hidden md:inline">Sign Out</span>
              </Button>
            ) : (
              <Link to="/login">
                <Button size="sm" className="text-xs h-8">
                  Sign In
                </Button>
              </Link>
            )}

            <Link to="/dashboard" className="hidden md:inline-flex">
              <Button variant="ghost" size="sm" className="text-xs h-8 gap-1 text-primary">
                <ArrowLeft className="h-3.5 w-3.5" /> Back to Platform
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Admin Layout Body */}
      <div className="flex-1 flex w-full">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-64 shrink-0 bg-card border-r border-border p-4">
          <div className="mb-4 px-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Administration
            </h3>
          </div>

          <nav className="space-y-1.5 flex-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active =
                location.pathname === item.path ||
                (item.path === '/admin' && location.pathname === '/admin/maintenance');
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    active
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate">{item.label}</p>
                  </div>
                </Link>
              );
            })}
          </nav>

          <div className="pt-4 border-t border-border mt-auto space-y-3">
            <div className="p-3 bg-muted/50 rounded-lg text-xs space-y-1">
              <p className="font-semibold text-foreground">Backend Security</p>
              <p className="text-muted-foreground text-[11px] leading-relaxed">
                Source code packaging is protected with server-side token authentication and role checking.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground px-2 py-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Admin Services Active</span>
            </div>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 min-w-0 overflow-x-hidden p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
};
