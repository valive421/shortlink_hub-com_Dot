import {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';
import api, {
  bootstrapAuth,
  setAccessToken,
  clearAccessToken,
} from '../lib/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    bootstrapAuth()
      .then((data) => {
        setUser(data?.user || null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const login = async (payload) => {
    const response = await api.post('/auth/login', payload);
    setAccessToken(response.data.accessToken);
    setUser(response.data.user);
    return response.data;
  };

  const signup = async (payload) => {
    const response = await api.post('/auth/signup', payload);
    setAccessToken(response.data.accessToken);
    setUser(response.data.user);
    return response.data;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      clearAccessToken();
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
