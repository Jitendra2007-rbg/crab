import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabase';
import { User } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signupEmail: (email: string, pass: string, agentName: string) => Promise<void>;
  loginEmail: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initSession = async () => {
        try {
            // Race condition: If Supabase takes > 3 seconds, assume offline/error and load app
            const sessionPromise = supabase.auth.getSession();
            const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject("Timeout"), 3000));

            const result: any = await Promise.race([sessionPromise, timeoutPromise]);
            
            if (mounted) {
                if (result && result.data) {
                    setUser(result.data.session?.user ?? null);
                }
                setLoading(false);
            }
        } catch (err) {
            console.error("Auth Init Error (or Timeout):", err);
            if (mounted) setLoading(false);
        }
    };

    initSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) setUser(session?.user ?? null);
    });

    return () => {
        mounted = false;
        subscription.unsubscribe();
    };
  }, []);

  const signInWithGoogle = async () => {
    try {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            // CRITICAL: Redirect back to the exact current page origin
            redirectTo: window.location.origin, 
            queryParams: {
              // CRITICAL: Forces the account picker to appear every time
              prompt: 'select_account',
              access_type: 'offline'
            },
          },
        });
        if (error) throw error;
    } catch (err) {
        console.error("Google Sign In Error:", err);
        throw err;
    }
  };

  const signupEmail = async (email: string, pass: string, agentName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: {
        data: {
            full_name: agentName
        }
      }
    });
    if (error) throw error;

    if (data.user) {
        await supabase.from('user_settings').upsert({
            user_id: data.user.id,
            agent_name: agentName,
            wakeword: `Hey ${agentName}`,
            voice_id: 'Cosmic',
            name_change_count: 0
        });
    }
  };

  const loginEmail = async (email: string, pass: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });
    if (error) throw error;
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signupEmail, loginEmail, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);