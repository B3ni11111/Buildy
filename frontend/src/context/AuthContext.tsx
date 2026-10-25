import { createContext, useCallback, useContext, useState, useEffect, ReactNode } from 'react';
import Callback from '../components/Callback';
import { AuthContextType, Tokens, UserInfo } from '../types/auth';
import {
  getStoredTokens,
  isTokenValid,
  clearTokens,
  decodeIdToken,
  getTokenExpiry,
  getLogoutUrl,
  refreshTokens,
  saveTokens,
} from '../utils/cognito';
import { clearOnboardingData } from '../utils/onboarding';
import { isDevToken } from '../utils/devLogin';
import { Box, CircularProgress } from '@mui/material';

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tokens, setTokens] = useState<Tokens | null>(null);
  const [user, setUser] = useState<UserInfo | null>(null);

  const signIn = useCallback((next: Tokens) => {
    setTokens(next);
    setIsAuthenticated(true);
    try {
      setUser(decodeIdToken(next.id_token));
    } catch (err) {
      console.error('Failed to decode ID token:', err);
    }
  }, []);

  /** Forget this account on the device (tokens + per-account choices). */
  const clearSession = useCallback(() => {
    clearTokens();
    clearOnboardingData();
    for (const key of ['buildy_current_building', 'buildy_view_as', 'buildy_view_as_resident']) {
      try {
        localStorage.removeItem(key);
      } catch {
        // nothing stored
      }
    }
    setTokens(null);
    setUser(null);
    setIsAuthenticated(false);
  }, []);

  /** Sign out for real: also ends the Cognito session, so the next sign-in can pick another account. */
  const logout = useCallback(() => {
    // A dev "sign in as" session has no Cognito session to end.
    const dev = isDevToken(getStoredTokens()?.id_token);
    clearSession();
    window.location.assign(dev ? '/' : getLogoutUrl());
  }, [clearSession]);

  /** Swap the refresh token for new id/access tokens; false if the session can't be renewed. */
  const renew = useCallback(
    async (refreshToken: string) => {
      try {
        const next = await refreshTokens(refreshToken);
        saveTokens(next);
        signIn(next);
        return true;
      } catch (err) {
        console.warn('Session refresh failed:', err);
        return false;
      }
    },
    [signIn],
  );

  // On load: use stored tokens if still valid, otherwise try to renew them silently.
  useEffect(() => {
    const restore = async () => {
      const stored = getStoredTokens();
      if (stored && isTokenValid()) {
        signIn(stored);
      } else if (stored?.refresh_token) {
        if (!(await renew(stored.refresh_token))) clearTokens();
      }
      setIsLoading(false);
    };
    restore();
  }, [signIn, renew]);

  // While the app is open, renew ~2 minutes before the id token expires (Cognito's default is 1 hour).
  useEffect(() => {
    const refreshToken = tokens?.refresh_token;
    const expiry = getTokenExpiry();
    if (!refreshToken || !expiry) return;
    const delay = Math.max(expiry - Date.now() - 2 * 60 * 1000, 0);
    const timer = setTimeout(async () => {
      if (!(await renew(refreshToken))) clearSession();
    }, delay);
    return () => clearTimeout(timer);
  }, [tokens, renew, clearSession]);

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
