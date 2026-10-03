import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/db/supabase';
import type { User, Session } from '@supabase/supabase-js';
import type { Profile } from '@/types/types';

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.error('Failed to get profile:', error);
    return null;
  }
  return data;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signInWithUsername: (username: string, password: string) => Promise<{ error: Error | null }>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUpWithUsername: (username: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, metadata?: { full_name?: string; username?: string; location?: string }) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = async () => {
    if (!user) {
      setProfile(null);
      return;
    }

    const profileData = await getProfile(user.id);
    setProfile(profileData);
  };

  const getAccessToken = async () => {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session ?? null);
      setUser(session?.user ?? null);
      if (session?.user) {
        getProfile(session.user.id).then(setProfile);
      }
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session ?? null);
      setUser(session?.user ?? null);
      if (session?.user) {
        getProfile(session.user.id).then(setProfile);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithUsername = async (username: string, password: string) => {
    try {
      const email = `${username}@miaoda.com`;
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signInWithEmail = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUpWithUsername = async (username: string, password: string) => {
    try {
      const email = `${username}@miaoda.com`;
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const signUp = async (email: string, password: string, metadata?: { full_name?: string; username?: string; location?: string }) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata || {},
        },
      });

      if (error) throw error;

      if (data.user) {
        await supabase.from('profiles').upsert({
          id: data.user.id,
          email,
          username: metadata?.username || email.split('@')[0],
          full_name: metadata?.full_name || email.split('@')[0],
          location: metadata?.location || 'Global',
          role: 'user',
          reputation_score: 50,
          status: 'active',
          onboarding_status: 'not_started',
          onboarding_step: 1,
        });
      }

      return { error: null, user: data.user };
    } catch (error) {
      return { error: error as Error, user: null };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        signInWithUsername,
        signInWithEmail,
        signUpWithUsername,
        signUp,
        signOut,
        refreshProfile,
        getAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

