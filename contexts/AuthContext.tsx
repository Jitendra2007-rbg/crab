
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
    // Check active session safely
    supabase.auth.getSession()
        .then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            setLoading(false);
        })
        .catch(err => {
            console.error("Auth Session Error:", err);
            // Even if it fails, stop loading so user can try to login again
            setLoading(false);
        });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
    });
    if (error) throw error;
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

    // Create initial settings if user was created
    if (data.user) {
        // Use upsert to avoid error if row already exists
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
