import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Callback from '../components/Callback';
import { AuthContextType, Tokens, UserInfo } from '../types/auth';
import { getStoredTokens, isTokenValid, clearTokens, decodeIdToken } from '../utils/cognito';
import { clearOnboardingData } from '../utils/onboarding';
import { Box, CircularProgress } from '@mui/material';

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tokens, setTokens] = useState<Tokens | null>(null);
  const [user, setUser] = useState<UserInfo | null>(null);

  useEffect(() => {
    const storedTokens = getStoredTokens();
    if (storedTokens && isTokenValid()) {
      setTokens(storedTokens);
      setIsAuthenticated(true);
      try {
        const userInfo = decodeIdToken(storedTokens.id_token);
        setUser(userInfo);
      } catch (err) {
        console.error('Failed to decode ID token:', err);
      }
    }
    setIsLoading(false);
  }, []);

  const logout = () => {
    clearTokens();
    clearOnboardingData();
    setTokens(null);
    setUser(null);
    setIsAuthenticated(false);
  };

  const value: AuthContextType = {
    isAuthenticated,
    isLoading,
    error,
    tokens,
    user,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      <AuthContextRouter isLoading={isLoading}>
        {children}
      </AuthContextRouter>
    </AuthContext.Provider>
  );
}

function AuthContextRouter({
  children,
  isLoading,
}: {
  children: ReactNode;
  isLoading: boolean;
}) {
  const isCallback = window.location.pathname === '/callback';

  if (isCallback) {
    return <Callback />;
  }

  if (isLoading) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          bgcolor: 'background.default',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  return <>{children}</>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
