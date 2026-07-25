"use client";

import "@/lib/firebase";

import { getAuth, onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from "@/lib/api/auth";
import { profileApi } from "@/lib/api/profile";
import type { UserProfile, ProfileData } from "@/lib/types/profile";


interface AuthState {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  needsProfileSetup: boolean;
}


interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<{ needsProfileSetup: boolean }>;
  signup: (email: string, password: string) => Promise<{ needsProfileSetup: boolean }>;
  logout: () => Promise<void>;
  completeProfile: (profileData: ProfileData) => Promise<void>;
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
    needsProfileSetup: false,
  });

  const auth = React.useMemo(() => getAuth(), []);

  // Listen to Firebase auth state changes (handles persistence)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        const uid = firebaseUser.uid;
        try {
          const profile = await profileApi.getProfile() ;
          const needsSetup = !profile.profileComplete;
          
          setState({
            user: { 
              uid, 
              email: profile.email,
              displayName: profile.displayName || profile.Name,
              role: profile.role,
              location: profile.location,
              productiveTime: profile.productiveTime,
              topMotivation: profile.topMotivation,
              aiTone: profile.aiTone,
              profileComplete: profile.profileComplete
            },
            isAuthenticated: true,
            isLoading: false,
            error: null,
            needsProfileSetup: needsSetup,
          });
        } catch (error) {
          console.error('Failed to fetch profile:', error);
          setState(prev => ({ ...prev, error: 'Failed to load profile', isLoading: false }));
        }
      } else {
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
          needsProfileSetup: false,
        });
      }
    });
    return unsubscribe;
  }, [auth]);

  const login = async (email: string, password: string): Promise<{ needsProfileSetup: boolean }> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await authApi.login(email, password);
      return { needsProfileSetup: !response.profile_complete };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Login failed';
      setState(prev => ({ ...prev, isLoading: false, error: errMsg }));
      throw error;
    }
  };

  const signup = async (email: string, password: string): Promise<{ needsProfileSetup: boolean }> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      const response = await authApi.signup(email, password);
      return { needsProfileSetup: !response.profile_complete };
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Signup failed';
      setState(prev => ({ ...prev, isLoading: false, error: errMsg }));
      throw error;
    }
  };

  const completeProfile = async (profileData: ProfileData) => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    try {
      await authApi.completeProfile(profileData);
      // Refresh profile data
      const profile = await profileApi.getProfile();
      setState(prev => ({
        ...prev,
        user: prev.user ? {
          ...prev.user,
          displayName: profile.displayName || profile.Name,
          role: profile.role,
          location: profile.location,
          productiveTime: profile.productiveTime,
          topMotivation: profile.topMotivation,
          aiTone: profile.aiTone,
          profileComplete: profile.profileComplete
        } : null,
        needsProfileSetup: false,
        isLoading: false,
      }));
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Profile completion failed';
      setState(prev => ({ ...prev, isLoading: false, error: errMsg }));
      throw error;
    }
  };

  const logout = async () => {
    try {
      await authApi.logout(); 
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const clearError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  return (
    <AuthContext.Provider value={{ ...state, login, signup, logout, completeProfile, clearError }}>
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