import { Session } from '@supabase/supabase-js';
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';

type AuthState = {
  session: Session | null;
  hostelId: string | null;
  role: 'student' | 'admin';
  loading: boolean;
  refreshProfile: () => Promise<void>;
};

const Ctx = createContext<AuthState>({
  session: null,
  hostelId: null,
  role: 'student',
  loading: true,
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [hostelId, setHostelId] = useState<string | null>(null);
  const [role, setRole] = useState<'student' | 'admin'>('student');
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (uid?: string) => {
    if (!uid) {
      setHostelId(null);
      setRole('student');
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from('profiles')
      .select('hostel_id, role')
      .eq('id', uid)
      .maybeSingle();
    setHostelId(data?.hostel_id ?? null);
    setRole((data?.role as 'student' | 'admin') ?? 'student');
    setLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      loadProfile(data.session?.user.id);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((evt, s) => {
      setSession(s);
      if (evt === 'SIGNED_IN' || evt === 'SIGNED_OUT') {
        setLoading(true);
        // defer: don't call supabase inside the auth callback directly
        setTimeout(() => loadProfile(s?.user.id), 0);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [loadProfile]);

  const refreshProfile = useCallback(
    () => loadProfile(session?.user.id),
    [session, loadProfile]
  );

  return (
    <Ctx.Provider value={{ session, hostelId, role, loading, refreshProfile }}>
      {children}
    </Ctx.Provider>
  );
}