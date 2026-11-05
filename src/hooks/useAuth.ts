import { useState, useEffect, useCallback } from 'react';
import { firebaseService } from '@/lib/firebase/services';
import { localAuthService } from '@/lib/auth/localAuth';
import type { User } from '@/types';

// Check if Firebase is properly configured
const isFirebaseConfigured = () => {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  return apiKey && apiKey !== 'demo-key' && apiKey.length > 10;
};

const useFirebase = isFirebaseConfigured();

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (useFirebase) {
      const unsubscribe = firebaseService.onAuthStateChanged((currentUser) => {
        setUser(currentUser);
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      // Use local auth
      const currentUser = localAuthService.getCurrentUser();
      setUser(currentUser);
      setLoading(false);

      const unsubscribe = localAuthService.onAuthStateChanged((u) => {
        setUser(u);
      });
      return unsubscribe;
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, displayName: string) => {
    setLoading(true);
    try {
      if (useFirebase) {
        // For Firebase, we'll use Google sign-in as "sign up"
        const user = await firebaseService.signInWithGoogle();
        setUser(user);
        return user;
      } else {
        const user = localAuthService.signUp(email, password, displayName);
        setUser(user);
        return user;
      }
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setLoading(true);
    try {
      if (useFirebase) {
        // For Firebase, we'll use Google sign-in
        const user = await firebaseService.signInWithGoogle();
        setUser(user);
        return user;
      } else {
        const user = localAuthService.signIn(email, password);
        setUser(user);
        return user;
      }
    } catch (error) {
      console.error('Sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    setLoading(true);
    try {
      if (useFirebase) {
        const user = await firebaseService.signInWithGoogle();
        setUser(user);
        return user;
      } else {
        // Fallback to anonymous for local mode
        const user = localAuthService.signInAnonymously();
        setUser(user);
        return user;
      }
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const signInAnonymously = useCallback(async () => {
    setLoading(true);
    try {
      if (useFirebase) {
        const user = await firebaseService.signInAnonymously();
        return user;
      } else {
        const user = localAuthService.signInAnonymously();
        return user;
      }
    } catch (error) {
      console.error('Anonymous sign in error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setLoading(true);
    try {
      if (useFirebase) {
        await firebaseService.logout();
        // Firebase's onAuthStateChanged will automatically set user to null
        setUser(null);
      } else {
        localAuthService.signOut();
        // Set user to null after logout
        setUser(null);
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    user,
    loading,
    signUp,
    signIn,
    signInWithGoogle,
    signInAnonymously,
    logout,
    isAuthenticated: !!user,
    useFirebase,
  };
}
