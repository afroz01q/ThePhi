import type { ReactNode } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/auth/LoginPage';
import { RegisterPage } from '@/pages/auth/RegisterPage';
import { OnboardingPage } from '@/pages/auth/OnboardingPage';
import { UserDashboard } from '@/pages/dashboard/UserDashboard';
import { ExploreMembersPage } from '@/pages/explore/ExploreMembersPage';
import { SmartMatchesPage } from '@/pages/matches/SmartMatchesPage';
import { MemberProfilePage } from '@/pages/profile/MemberProfilePage';
import { AvailabilityEditorPage } from '@/pages/profile/AvailabilityEditorPage';
import { ConnectionsPage } from '@/pages/connections/ConnectionsPage';
import { ExchangeRequestsPage } from '@/pages/exchanges/ExchangeRequestsPage';
import { SessionsCalendarPage } from '@/pages/sessions/SessionsCalendarPage';
import { ChatPage } from '@/pages/chat/ChatPage';
import { CommunityHubPage } from '@/pages/community/CommunityHubPage';
import { NotificationsCenterPage } from '@/pages/notifications/NotificationsCenterPage';

// Admin
import { AdminLayout } from '@/pages/admin/AdminLayout';
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage';
import { MaintenancePage } from '@/pages/admin/MaintenancePage';
import { LearningProgressPage } from '@/pages/progress/LearningProgressPage';

interface RouteConfig {
  name: string;
  path: string;
  element: ReactNode;
  visible?: boolean;
}

const routes: RouteConfig[] = [
  // Public
  {
    name: 'Home',
    path: '/',
    element: (
      <MainLayout>
        <LandingPage />
      </MainLayout>
    ),
  },
  {
    name: 'Sign In',
    path: '/login',
    element: (
      <MainLayout>
        <LoginPage />
      </MainLayout>
    ),
  },
  {
    name: 'Register',
    path: '/register',
    element: <OnboardingPage />,
  },
  {
    name: 'Onboarding',
    path: '/onboarding',
    element: <OnboardingPage />,
  },

  // Member Portal
  {
    name: 'Dashboard',
    path: '/dashboard',
    element: (
      <MainLayout>
        <UserDashboard />
      </MainLayout>
    ),
  },
  {
    name: 'Explore',
    path: '/explore',
    element: (
      <MainLayout>
        <ExploreMembersPage />
      </MainLayout>
    ),
  },
  {
    name: 'Smart Matches',
    path: '/matches',
    element: (
      <MainLayout>
        <SmartMatchesPage />
      </MainLayout>
    ),
  },
  {
    name: 'Connections',
    path: '/connections',
    element: (
      <MainLayout>
        <ConnectionsPage />
      </MainLayout>
    ),
  },
  {
    name: 'Member Profile',
    path: '/profile/:id',
    element: (
      <MainLayout>
        <MemberProfilePage />
      </MainLayout>
    ),
  },
  {
    name: 'Availability Schedule',
    path: '/availability',
    element: (
      <MainLayout>
        <AvailabilityEditorPage />
      </MainLayout>
    ),
  },
  {
    name: 'Exchanges',
    path: '/exchanges',
    element: (
      <MainLayout>
        <ExchangeRequestsPage />
      </MainLayout>
    ),
  },
  {
    name: 'Learning Progress',
    path: '/progress',
    element: (
      <MainLayout>
        <LearningProgressPage />
      </MainLayout>
    ),
  },
  {
    name: 'Sessions Calendar',
    path: '/sessions',
    element: (
      <MainLayout>
        <SessionsCalendarPage />
      </MainLayout>
    ),
  },
  {
    name: 'Chat',
    path: '/chat',
    element: (
      <MainLayout>
        <ChatPage />
      </MainLayout>
    ),
  },
  {
    name: 'Community Hub',
    path: '/community',
    element: (
      <MainLayout>
        <CommunityHubPage />
      </MainLayout>
    ),
  },
  {
    name: 'Notifications',
    path: '/notifications',
    element: (
      <MainLayout>
        <NotificationsCenterPage />
      </MainLayout>
    ),
  },

  // Admin Portal
  {
    name: 'Admin Console',
    path: '/admin',
    element: (
      <AdminLayout>
        <AdminDashboardPage />
      </AdminLayout>
    ),
  },
  {
    name: 'Admin Overview',
    path: '/admin/overview',
    element: (
      <AdminLayout>
        <AdminDashboardPage />
      </AdminLayout>
    ),
  },
  {
    name: 'Admin Settings',
    path: '/admin/settings',
    element: (
      <AdminLayout>
        <AdminDashboardPage />
      </AdminLayout>
    ),
  },
  {
    name: 'Admin Maintenance',
    path: '/admin/maintenance',
    element: (
      <AdminLayout>
        <MaintenancePage />
      </AdminLayout>
    ),
  },
];

export default routes;
