import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface RouteGuardProps {
  children: React.ReactNode;
}

// Please add the pages that can be accessed without logging in to PUBLIC_ROUTES.
const PUBLIC_ROUTES = ['/login', '/register', '/onboarding', '/403', '/404', '/'];

function matchPublicRoute(path: string, patterns: string[]) {
  return patterns.some(pattern => {
    if (pattern.includes('*')) {
      const regex = new RegExp('^' + pattern.replace('*', '.*') + '$');
      return regex.test(path);
    }
    return path === pattern;
  });
}

export function RouteGuard({ children }: RouteGuardProps) {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (loading) return;

    const isPublic = matchPublicRoute(location.pathname, PUBLIC_ROUTES);

    // If not logged in and accessing protected route
    if (!user && !isPublic) {
      navigate('/login', { state: { from: location.pathname }, replace: true });
      return;
    }

    // If logged in, check onboarding status
    if (user && profile) {
      const isIncomplete = profile.onboarding_status !== 'completed';
      
      // If incomplete and trying to access app pages (other than /onboarding or /login)
      if (isIncomplete && location.pathname !== '/onboarding' && location.pathname !== '/login' && location.pathname !== '/') {
        navigate('/onboarding', { replace: true });
      } else if (!isIncomplete && location.pathname === '/onboarding') {
        // If already completed and trying to visit onboarding, redirect to dashboard
        navigate('/dashboard', { replace: true });
      }
    }
  }, [user, profile, loading, location.pathname, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return <>{children}</>;
}