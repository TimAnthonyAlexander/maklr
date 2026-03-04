import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import { getMe, postLogin, postSignup, postLogout } from "../api/client";
import { ApiError } from "../api/http";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  language: string;
  office_id: string | null;
  phone: string | null;
  avatar_url: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  needsOnboarding: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: AuthUser) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMe()
      .then((res) => {
        const data = res as unknown as { user: AuthUser };
        setUser(data.user);
      })
      .catch(() => {
        setUser(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await postLogin({ email, password });
    const userData = res as unknown as AuthUser;
    setUser(userData);
  }, []);

  const signup = useCallback(
    async (name: string, email: string, password: string) => {
      const res = await postSignup({ name, email, password });
      const userData = res as unknown as AuthUser;
      setUser(userData);
    },
    [],
  );

  const logout = useCallback(async () => {
    await postLogout();
    setUser(null);
  }, []);

  const updateUser = useCallback((updatedUser: AuthUser) => {
    setUser(updatedUser);
  }, []);

  const needsOnboarding = user !== null && user.office_id === null;

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        needsOnboarding,
        login,
        signup,
        logout,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export { ApiError };
