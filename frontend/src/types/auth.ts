export interface Tokens {
  access_token: string;
  id_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

export interface UserInfo {
  sub: string;
  email?: string;
  name?: string;
  email_verified?: boolean;
  given_name?: string;
  family_name?: string;
  picture?: string;
  [key: string]: unknown;
}

export interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  tokens: Tokens | null;
  user: UserInfo | null;
  logout: () => void;
}
