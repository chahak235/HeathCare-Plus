import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

// ============================================================================
// Types & Interfaces
// ============================================================================

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'patient' | 'doctor' | 'admin' | 'hospital';
  avatar?: string;
  location?: string;
  age?: number;
  healthConditions?: string[];
  isVerified: boolean;
  medicalHistory?: string;
  hospitalId?: string;
}

export interface SignupData {
  name: string;
  email: string;
  phone: string;
  password: string;
  role?: 'patient' | 'doctor' | 'hospital';

  // role === 'doctor'
  claimDoctorId?: number;
  specialty?: string;

  // role === 'hospital'
  hospitalName?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  hospitalType?: 'government' | 'private' | 'trust';
  totalBeds?: number;
  icuBeds?: number;
  operationTheatres?: number;
  ambulancesTotal?: number;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (userData: SignupData) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => void;
  isLoading: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const API_URL = import.meta.env.VITE_API_URL || 'https://healthcare-backend-tylz.onrender.com/api';
const STORAGE_KEYS = {
  TOKEN: 'auth_token',
  USER: 'auth_user',
} as const;

// ============================================================================
// Context
// ============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ============================================================================
// Provider Component
// ============================================================================

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // State initialization with safe JSON parsing
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    const token = localStorage.getItem(STORAGE_KEYS.TOKEN);
    return !!token;
  });

  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem(STORAGE_KEYS.USER);
    if (savedUser && savedUser !== 'undefined') {
      try {
        return JSON.parse(savedUser);
      } catch (error) {
        console.error('Failed to parse user from localStorage:', error);
        localStorage.removeItem(STORAGE_KEYS.USER);
        return null;
      }
    }
    return null;
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEYS.TOKEN);
  });

  const [isLoading, setIsLoading] = useState(false);

  // ============================================================================
  // Effects
  // ============================================================================

  // Check token validity on mount
  useEffect(() => {
    const checkAuth = async () => {
      const storedToken = localStorage.getItem(STORAGE_KEYS.TOKEN);
      if (!storedToken) return;

      try {
        const response = await fetch(`${API_URL}/auth/me`, {
          headers: {
            'Authorization': `Bearer ${storedToken}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          if (data.user) {
            setUser(data.user);
            setIsAuthenticated(true);
            // Update localStorage with fresh user data
            localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(data.user));
          }
          // A 200 with no user is treated as "leave existing session alone"
          // below, same as any other non-definitive response.
        } else if (response.status === 401) {
          // The server explicitly says this token is invalid/expired —
          // this is the only case that should actually log someone out.
          clearAuthData();
        }
        // Anything else (429 rate-limited, 500, Render free-tier cold start
        // returning a bad gateway, etc.) is a server/network hiccup, not
        // proof the session is invalid — keep the user logged in with
        // whatever was already in localStorage and let the next successful
        // check (or an individual API call's own 401) sort it out.
      } catch (error) {
        // Network error / request never reached the server — same reasoning:
        // don't punish the user for a flaky connection or a sleeping backend.
        console.warn('Auth check failed (keeping existing session):', error);
      }
    };

    checkAuth();
  }, []);

  // ============================================================================
  // Helper Functions
  // ============================================================================

  const clearAuthData = () => {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    setIsAuthenticated(false);
    setUser(null);
    setToken(null);
  };

  const saveAuthData = (authToken: string, userData: User) => {
    try {
      localStorage.setItem(STORAGE_KEYS.TOKEN, authToken);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userData));
      setToken(authToken);
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Failed to save auth data:', error);
    }
  };

  // ============================================================================
  // Auth Methods
  // ============================================================================

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.success && data.token && data.user) {
        saveAuthData(data.token, data.user);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (userData: SignupData): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (response.ok && data.success && data.token && data.user) {
        // Auto-login after signup
        saveAuthData(data.token, data.user);
        return { success: true };
      }

      return { success: false, error: data.error || 'Unable to create account.' };
    } catch (error) {
      console.error('Signup error:', error);
      return { success: false, error: 'Unable to connect to the server. Please try again.' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    clearAuthData();
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      const updatedUser = { ...user, ...userData };
      setUser(updatedUser);
      try {
        localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));
      } catch (error) {
        console.error('Failed to update user in localStorage:', error);
      }
    }
  };

  // ============================================================================
  // Context Value
  // ============================================================================

  const value: AuthContextType = {
    isAuthenticated,
    user,
    token,
    login,
    signup,
    logout,
    updateUser,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// ============================================================================
// Hook
// ============================================================================

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};