import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeftRight,
  Compass,
  Sparkles,
  Repeat,
  Calendar,
  MessageSquare,
  Users,
  Bell,
  User,
  Shield,
  LogOut,
  Menu,
  LayoutDashboard,
  Clock,
  LogIn,
  UserCheck,
  Camera,
  TrendingUp,
} from 'lucide-react';
import { fetchNotifications } from '@/api/skillxchange';
import { AvatarUploadDialog } from '@/components/profile/AvatarUploadDialog';

export function Navbar() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchNotifications(user.id)
        .then((items) => {
          setUnreadCount(items.filter((i) => !i.is_read).length);
        })
        .catch(() => {});
    }
  }, [user?.id, location.pathname]);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const navLinks = [
    { label: 'Explore', href: '/explore', icon: Compass },
    { label: 'Connections', href: '/connections', icon: UserCheck, auth: true },
    { label: 'Smart Matches', href: '/matches', icon: Sparkles, auth: true },
    { label: 'Exchanges', href: '/exchanges', icon: Repeat, auth: true },
    { label: 'Progress', href: '/progress', icon: TrendingUp, auth: true },
    { label: 'Sessions', href: '/sessions', icon: Calendar, auth: true },
    { label: 'Chat', href: '/chat', icon: MessageSquare, auth: true },
    { label: 'Community', href: '/community', icon: Users },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-background/95 backdrop-blur border-b border-border/80">
      {/* Top Editorial Ticker Bar */}
      <div className="border-b border-border/60 bg-muted/40 py-1 px-4 hidden md:block">
        <div className="container mx-auto flex items-center justify-between text-[11px] font-mono uppercase tracking-widest text-muted-foreground">
          <div className="flex items-center gap-3">
            <span className="font-bold text-foreground">SKILLXCHANGE EDITORIAL</span>
            <span className="text-border">|</span>
            <span>Non-Monetary Peer-to-Peer Learning & Skill Matching</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-accent font-semibold tracking-wider">● 100% RECIPROCAL</span>
            <span className="text-border">|</span>
            <span>GLOBAL DISCOVERY DISPATCH</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-9 h-9 rounded-md bg-foreground text-background flex items-center justify-center font-serif font-black text-lg transition-transform group-hover:scale-105 shadow-sm">
            X
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-2xl font-black tracking-tight text-foreground leading-none">
              Skill<span className="text-accent italic font-normal">X</span>Change
            </span>
            <span className="text-[10px] tracking-widest uppercase font-mono text-muted-foreground leading-none mt-0.5">
              Knowledge Exchange
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            if (link.auth && !user) return null;
            const Icon = link.icon;
            const isActive = location.pathname === link.href;
            return (
              <Link key={link.href} to={link.href}>
                <Button
                  variant="ghost"
                  size="sm"
                  className={`text-xs font-medium uppercase tracking-wider gap-1.5 h-8 px-3 rounded-md transition-all ${
                    isActive
                      ? 'bg-foreground text-background font-semibold shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {link.label}
                </Button>
              </Link>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              {/* Notification bell */}
              <Link to="/notifications">
                <Button variant="ghost" size="icon" className="relative h-9 w-9 text-muted-foreground hover:text-foreground">
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
                  )}
                  <span className="sr-only">Notifications</span>
                </Button>
              </Link>

              {/* User Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 gap-2 pl-2 pr-3 rounded-full hover:bg-muted">
                    <img
                      src={profile?.avatar_url || 'https://miaoda-site-img.s3cdn.medo.dev/images/KLing_660e9ae4-2f78-4f2b-8de1-1547d1387ee9.jpg'}
                      alt={profile?.full_name || 'User'}
                      className="w-6 h-6 rounded-full object-cover border border-border"
                    />
                    <span className="text-sm font-medium max-w-[100px] truncate hidden md:inline-block">
                      {profile?.full_name || profile?.username || 'Member'}
                    </span>
                    {profile?.role === 'admin' && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-primary text-primary hidden lg:inline-flex">
                        Admin
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-semibold leading-none">{profile?.full_name || profile?.username}</p>
                      <p className="text-xs leading-none text-muted-foreground">{profile?.email}</p>
                      <div className="flex items-center gap-1.5 pt-1 text-xs text-primary font-medium">
                        <span>Trust Score: {profile?.reputation_score ?? 50}/100</span>
                      </div>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    <span>User Dashboard</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate(`/profile/${user.id}`)}>
                    <User className="mr-2 h-4 w-4" />
                    <span>My Profile & Skills</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setAvatarDialogOpen(true)}>
                    <Camera className="mr-2 h-4 w-4 text-primary" />
                    <span>Change Profile Picture</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/availability')}>
                    <Clock className="mr-2 h-4 w-4" />
                    <span>Availability Schedule</span>
                  </DropdownMenuItem>
                  {profile?.role === 'admin' && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => navigate('/admin')}>
                        <Shield className="mr-2 h-4 w-4 text-primary" />
                        <span className="font-medium text-primary">Admin Console</span>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sign Out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <Button variant="ghost" size="sm" className="gap-1.5 h-9">
                  <LogIn className="h-4 w-4" />
                  <span className="hidden sm:inline">Sign In</span>
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm" className="gap-1.5 h-9 bg-primary text-primary-foreground font-semibold">
                  Get Started
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile hamburger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden h-9 w-9">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle navigation</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[300px] sm:w-[350px]">
              <SheetHeader className="text-left border-b border-border pb-4">
                <SheetTitle className="flex items-center gap-2 text-lg">
                  <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground">
                    <ArrowLeftRight className="h-4 w-4" />
                  </div>
                  SkillXChange
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-2 py-4">
                {navLinks.map((link) => {
                  if (link.auth && !user) return null;
                  const Icon = link.icon;
                  const isActive = location.pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      to={link.href}
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                        isActive ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-foreground'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {link.label}
                    </Link>
                  );
                })}

                {user && (
                  <>
                    <div className="my-2 border-t border-border" />
                    <Link
                      to="/dashboard"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-muted"
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Dashboard
                    </Link>
                    <Link
                      to={`/profile/${user.id}`}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-muted"
                    >
                      <User className="h-4 w-4" />
                      My Profile
                    </Link>
                    <button
                      type="button"
                      onClick={() => {
                        setMobileOpen(false);
                        setAvatarDialogOpen(true);
                      }}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-muted text-left w-full"
                    >
                      <Camera className="h-4 w-4 text-primary" />
                      Change Profile Picture
                    </button>
                    <Link
                      to="/availability"
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-muted"
                    >
                      <Clock className="h-4 w-4" />
                      Availability
                    </Link>
                    {profile?.role === 'admin' && (
                      <Link
                        to="/admin"
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-primary hover:bg-muted"
                      >
                        <Shield className="h-4 w-4" />
                        Admin Console
                      </Link>
                    )}
                  </>
                )}

                {user && (
                  <Button
                    variant="ghost"
                    className="mt-4 justify-start text-destructive hover:text-destructive gap-2"
                    onClick={() => {
                      handleLogout();
                      setMobileOpen(false);
                    }}
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </Button>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      {user && (
        <AvatarUploadDialog
          open={avatarDialogOpen}
          onOpenChange={setAvatarDialogOpen}
          userId={user.id}
          currentAvatarUrl={profile?.avatar_url}
          onAvatarUpdated={() => {
            window.location.reload();
          }}
        />
      )}
    </header>
  );
}
