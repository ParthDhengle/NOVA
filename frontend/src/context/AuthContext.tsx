// frontend/src/context/AuthContext.tsx
import { getAuth, signInWithCustomToken, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { apiClient, authManager } from '@/api/client'; // Keep authManager for UID if needed, but minimize

interface User {
  uid: string;
  email?: string;
  displayName?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
    error: null,
  });

  const auth = getAuth();

  // Listen to Firebase auth state changes (handles persistence)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const uid = firebaseUser.uid;
        try {
          const profile = await apiClient.getProfile(); // Fetch profile (will use fresh token in apiClient)
          setState({
            user: { uid, ...profile },
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
          authManager.setAuth('', uid); // Optional: Store UID only if needed elsewhere
        } catch (error) {
          console.error('Failed to fetch profile:', error);
          setState(prev => ({ ...prev, error: 'Failed to load profile' }));
        }
      } else {
        authManager.clearAuth();
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      }
    });

    return unsubscribe;
  }, []);

  const login = async (email: string, password: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await apiClient.login(email, password); // Gets custom_token
      await signInWithCustomToken(auth, response.custom_token); // Exchange; auth state will update via listener
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Login failed';
      setState(prev => ({ ...prev, isLoading: false, error: errMsg }));
      throw error;
    }
  };

  const signup = async (email: string, password: string) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await apiClient.signup(email, password);
      await signInWithCustomToken(auth, response.custom_token); // Same as login
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Signup failed';
      setState(prev => ({ ...prev, isLoading: false, error: errMsg }));
      throw error;
    }
  };

  const logout = async () => {
    try {
      await auth.signOut();
      apiClient.logout(); // Clear any backend sessions if needed
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const clearError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  return (
    <AuthContext.Provider value={{ ...state, login, signup, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}