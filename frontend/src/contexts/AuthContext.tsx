import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, authService } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';

interface AuthContextType {
  user: User | null;
  profile: any;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const isAuthenticated = !!user && authService.isAuthenticated();

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const storedUser = authService.getStoredUser();
        if (storedUser && authService.isAuthenticated()) {
          // Verify token is still valid by fetching current user
          const response = await authService.getCurrentUser();
          setUser(response.user);
          setProfile(response.profile);
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
        // Clear invalid tokens
        await authService.logout();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      const response = await authService.login({ email, password });
      setUser(response.user);
      
      // Fetch full profile data
      const profileResponse = await authService.getCurrentUser();
      setProfile(profileResponse.profile);
      
      toast({
        title: "Login successful",
        description: `Welcome back, ${response.user.first_name}!`,
      });
    } catch (error: any) {
      console.error('Login failed:', error);
      console.error('Login error:', error.response?.data || error.message);
      
      let errorMessage = "Invalid credentials";
      if (error.response?.data) {
        if (typeof error.response.data === 'string') {
          errorMessage = error.response.data;
        } else if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        } else if (error.response.data.error) {
          errorMessage = error.response.data.error;
        } else if (error.response.data.non_field_errors) {
          errorMessage = error.response.data.non_field_errors[0];
        }
      }
      
      toast({
        title: "Login failed",
        description: errorMessage,
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await authService.logout();
      setUser(null);
      setProfile(null);
      
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    } catch (error: any) {
      console.error('Logout failed:', error);
      // Clear state even if logout API fails
      setUser(null);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProfile = async (): Promise<void> => {
    try {
      if (isAuthenticated) {
        const response = await authService.getCurrentUser();
        setUser(response.user);
        setProfile(response.profile);
      }
    } catch (error: any) {
      console.error('Failed to refresh profile:', error);
      // If refresh fails, user might need to login again
      if (error.status === 401) {
        await logout();
      }
    }
  };

  const contextValue: AuthContextType = {
    user,
    profile,
    isLoading,
    isAuthenticated,
    login,
    logout,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Higher-order component for protecting routes
interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: string;
  fallback?: ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole, 
  fallback 
}) => {
  const { isAuthenticated, user, isLoading, logout } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    // Redirect to login
    window.location.href = '/auth';
    return null;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return fallback ? <>{fallback}</> : (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h2 className="text-xl font-bold">Access Denied</h2>
          <p>You don't have permission to access this page.</p>
          <button 
            onClick={() => logout()}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Logout
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};