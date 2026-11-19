import { Session } from '@supabase/supabase-js';
import { createContext, ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { supabase } from './supabase';

type AuthState = {
  session: Session | null;
  hostelId: string | null;
  hostelName: string | null;
  email: string | null;
  role: 'student' | 'admin';
  loading: boolean;
  refreshProfile: () => Promise<void>;
};

const Ctx = createContext<AuthState>({
  session: null,
  hostelId: null,
  hostelName: null,
  email: null,
  role: 'student',
  loading: true,
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [hostelId, setHostelId] = useState<string | null>(null);
  const [hostelName, setHostelName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [role, setRole] = useState<'student' | 'admin'>('student');
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async (uid?: string, userEmail?: string) => {
    if (!uid) {
      setHostelId(null);
      setHostelName(null);
      setEmail(null);
      setRole('student');
      setLoading(false);
      return;
    }
    setEmail(userEmail || null);

    let foundHostelName = false;

    // Try RPC first
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_my_profile');
    if (!rpcError && rpcData && rpcData.length > 0) {
      const p = rpcData[0];
      if (p.hostel_name) {
        setHostelName(p.hostel_name);
        foundHostelName = true;
      }
      setRole((p.role as 'student' | 'admin') ?? 'student');
      if (p.email) setEmail(p.email);
    }

    const { data } = await supabase
      .from('profiles')
      .select('hostel_id, role')
      .eq('id', uid)
      .maybeSingle();

    setHostelId(data?.hostel_id ?? null);
    if (data?.role) {
      setRole((data.role as 'student' | 'admin') ?? 'student');
    }

    if (data?.hostel_id && !foundHostelName) {
      const { data: hData } = await supabase
        .from('hostels')
        .select('name')
        .eq('id', data.hostel_id)
        .maybeSingle();
      setHostelName(hData?.name || 'Demo Hostel A');
    } else if (!foundHostelName) {
      setHostelName('Demo Hostel A');
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      loadProfile(data.session?.user.id, data.session?.user.email);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((evt, s) => {
      setSession(s);
      if (evt === 'SIGNED_IN' || evt === 'SIGNED_OUT') {
        setLoading(true);
        // defer: don't call supabase inside the auth callback directly
        setTimeout(() => loadProfile(s?.user.id, s?.user.email), 0);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [loadProfile]);

  const refreshProfile = useCallback(
    () => loadProfile(session?.user.id, session?.user.email),
    [session, loadProfile]
  );

  return (
    <Ctx.Provider value={{ session, hostelId, hostelName, email, role, loading, refreshProfile }}>
      {children}
    </Ctx.Provider>
  );
}