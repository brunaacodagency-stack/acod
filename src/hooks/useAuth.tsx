import { useState, useEffect, createContext, useContext } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userProfile: any | null;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any | null>(null);

  const fetchUserProfile = async (userId: string, userEmail?: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      if (data) {
        // Force 'agencia' role for local development/testing
        // TODO: Remove this override when roles are properly set in Supabase
        setUserProfile({ ...data, role: 'agencia' });
      } else {
        // If no profile found, try to create one.
        // We use upsert to be safe against race conditions.
        // We need the email to be present.

        const emailToUse = userEmail || user?.email;

        // If we don't have an email, we might be too early in the auth flow or it's a reload.
        // But we should try anyway if we have the ID.

        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .upsert({
            user_id: userId,
            email: emailToUse,
            role: 'cliente'
          }, { onConflict: 'user_id' })
          .select()
          .maybeSingle();

        if (createError) {
          // If error is 409 conflict, it means it was created in the split second between the select and the insert.
          // We can ignore it and fetch again or just let the next re-render handle it.
          console.log('Profile creation conflict (handled):', createError.message);
          // Optionally fetch again to get the data
          const { data: retryData } = await supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle();
          if (retryData) {
            setUserProfile({ ...retryData, role: 'agencia' });
          }
        } else if (newProfile) {
          setUserProfile({ ...newProfile, role: 'agencia' });
        }
      }
    } catch (error) {
      console.error('Error with profile:', error);
    }
  };

  useEffect(() => {
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          setTimeout(() => {
            fetchUserProfile(session.user.id, session.user.email);
          }, 0);
        } else {
          setUserProfile(null);
        }
        setLoading(false);
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        fetchUserProfile(session.user.id, session.user.email);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, userProfile, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};