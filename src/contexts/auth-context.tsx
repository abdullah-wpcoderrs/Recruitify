"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { forceSignOut } from "@/lib/auth-validation";
import { logger } from "@/lib/logger";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session - simplified version
    const getInitialSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user || null);
      } catch (error) {
        console.error('Error getting session:', error);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes - simplified version
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        logger.authStateChange(event, !!session?.user);
        setUser(session?.user || null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await forceSignOut();
  };

  // Periodic user validation (temporarily disabled for debugging)
  // useEffect(() => {
  //   if (!user) return;

  //   const validateInterval = setInterval(async () => {
  //     const userExists = await validateUserExists(user.id);
      
  //     if (!userExists) {
  //       toast.error('Your session has expired. Please sign in again.');
  //       await forceSignOut();
  //       setUser(null);
  //     }
  //   }, 5 * 60 * 1000); // 5 minutes

  //   return () => clearInterval(validateInterval);
  // }, [user]);

  const value = {
    user,
    loading,
    signOut: handleSignOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}