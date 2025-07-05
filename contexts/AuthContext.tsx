// ✅ Fichier : contexts/AuthContext.tsx (mis à jour avec système de token Bearer)
import React, { createContext, useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import ApiService, { isApiAvailable, ApiError, UserProfile } from '@/services/apiService';

const secureStorage = {
  async getItem(key: string) {
    if (Platform.OS === 'web') return localStorage.getItem(key);
    return await SecureStore.getItemAsync(key);
  },
  async setItem(key: string, value: string) {
    if (Platform.OS === 'web') localStorage.setItem(key, value);
    else await SecureStore.setItemAsync(key, value);
  },
  async removeItem(key: string) {
    if (Platform.OS === 'web') localStorage.removeItem(key);
    else await SecureStore.deleteItemAsync(key);
  }
};

export type User = {
  id: string;
  name: string;
  email: string;
  phone: string;
  ville?: string;
  codePostal?: string;
  skills: string[];
  zones: string[];
  is_approved?: boolean;
  role?: string;
  technician?: {
    id: number;
    status: string;
    is_approved: boolean;
    license_number?: string;
    insurance_number?: string;
    insurance_expiry?: string;
    zones: Array<{ id: number; name: string }>;
    sectors: Array<{ id: number; name: string }>;
  };
};

export type AuthContextType = {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    phone: string,
    ville: string,
    codePostal: string,
    skills: string[],
    zones: string[],
    verificationMethod: 'sms' | 'whatsapp'
  ) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
  error: string | null;
  verificationPending: boolean;
  startVerification: (email: string) => void;
  verifyCode: (code: string) => Promise<boolean>;
};

export const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  isLoading: true,
  user: null,
  token: null,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
  updateProfile: async () => {},
  refreshUser: async () => {},
  error: null,
  verificationPending: false,
  startVerification: () => {},
  verifyCode: async () => false,
});

let demoUsers: any[] = [];
let mockVerificationCode = '123456';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [verificationPending, setVerificationPending] = useState(false);
  const [pendingUserData, setPendingUserData] = useState<any>(null);
  const [apiAvailable, setApiAvailable] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // Vérifier la disponibilité de l'API
        const available = await isApiAvailable();
        setApiAvailable(available);

        const storedToken = await secureStorage.getItem('auth_token');
        const storedUser = await secureStorage.getItem('user');
        
        if (storedToken && storedUser) {
          setToken(storedToken);
          
          if (available) {
            // Récupérer les données utilisateur à jour depuis l'API avec le token Bearer
            try {
              const response = await ApiService.getCurrentUser(storedToken);
              if (response.success && response.data) {
                const apiUser = transformApiUserToLocal(response.data);
                setUser(apiUser);
                await secureStorage.setItem('user', JSON.stringify(apiUser));
              } else {
                // Token invalide, utiliser les données stockées
                setUser(JSON.parse(storedUser));
              }
            } catch (apiError) {
              console.warn('Erreur lors de la récupération du profil:', apiError);
              // Utiliser les données stockées en cas d'erreur API
              setUser(JSON.parse(storedUser));
            }
          } else {
            setUser(JSON.parse(storedUser));
          }
          
          setIsAuthenticated(true);
        }
      } catch (err) {
        console.error('Auth check error:', err);
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, []);

  // Transformer les données utilisateur de l'API vers le format local
  const transformApiUserToLocal = (apiUser: UserProfile): User => {
    return {
      id: apiUser.id.toString(),
      name: apiUser.name,
      email: apiUser.email,
      phone: apiUser.phone,
      role: apiUser.role,
      is_approved: apiUser.technician?.is_approved,
      specialties: apiUser.specialties?.label || [],
      zones: apiUser.zones?.code || [],
    };
  };

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    setError(null);
    console.log(apiAvailable);
    try {
      if (apiAvailable) {
        // Tentative de connexion via API avec récupération du token Bearer
        try {
          const response = await ApiService.login({ email, password });
          console.log(response);
          if (response.success && response.data) {
            const { token: authToken, user: userData } = response.data;
            console.log(authToken);
            // Récupérer le profil complet avec le token Bearer
            const profileResponse = await ApiService.getCurrentUser(authToken);
            console.log(profileResponse);
            if (profileResponse.success && profileResponse.data) {
              const fullUser = transformApiUserToLocal(profileResponse.data);
              console.log('fullUser', fullUser);
              await secureStorage.setItem('auth_token', authToken);
              await secureStorage.setItem('user', JSON.stringify(fullUser));
              
              setToken(authToken);
              setUser(fullUser);
              setIsAuthenticated(true);
              return;
            } else {
              // Si on ne peut pas récupérer le profil, utiliser les données de base
              const basicUser: User = {
                id: userData.id.toString(),
                name: userData.name,
                email: userData.email,
                phone: userData.phone || '',
                skills: [],
                zones: [],
                role: userData.role,
                is_approved: userData.is_approved,
              };
              
              await secureStorage.setItem('auth_token', authToken);
              await secureStorage.setItem('user', JSON.stringify(basicUser));
              
              setToken(authToken);
              setUser(basicUser);
              setIsAuthenticated(true);
              return;
            }
          }
        } catch (apiError) {
          console.error('API login error:', apiError);
          if (apiError instanceof ApiError) {
            throw apiError;
          }
          // Fallback vers le système mock pour les autres erreurs
        }
      }

      // Système mock (fallback ou si API non disponible)
      await new Promise(resolve => setTimeout(resolve, 1000));
      const foundUser = demoUsers.find(u => u.email === email && u.password === password);
      
      if (!foundUser) {
        throw new Error('Email ou mot de passe invalide');
      }
      
      const demoToken = `demo_token_${Date.now()}`;
      const { password: _, ...userWithoutPass } = foundUser;
      
      await secureStorage.setItem('auth_token', demoToken);
      await secureStorage.setItem('user', JSON.stringify(userWithoutPass));
      
      setToken(demoToken);
      setUser(userWithoutPass);
      setIsAuthenticated(true);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de connexion');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [apiAvailable]);

  const register = useCallback(async (name, email, password, phone, ville, codePostal, skills, zones, verificationMethod) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Le register via API est géré directement dans le composant register.tsx
      // Ici on garde seulement le système mock pour le fallback
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (demoUsers.some(u => u.email === email)) {
        throw new Error('Email déjà utilisé');
      }

      const newUser = { 
        id: `${Date.now()}`, 
        name, 
        email, 
        password, 
        phone, 
        ville, 
        codePostal, 
        skills, 
        zones, 
        verificationMethod 
      };
      
      setPendingUserData(newUser);
      setVerificationPending(true);
      console.log(`Sending verification code (${mockVerificationCode}) via ${verificationMethod} to ${phone}`);
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'inscription');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (data: Partial<User>) => {
    if (!token || !user) {
      throw new Error('Non authentifié');
    }

    setIsLoading(true);
    setError(null);

    try {
      if (apiAvailable && user.technician?.id) {
        // Mise à jour via API avec token Bearer
        try {
          const updateData = {
            phone: data.phone,
            skills: data.skills,
            zones: data.zones,
            // Ajouter d'autres champs selon les besoins
          };

          const response = await ApiService.updateTechnician(
            token,
            user.technician.id.toString(),
            updateData
          );

          if (response.success && response.data) {
            const updatedUser = transformApiUserToLocal({
              ...user,
              phone: data.phone || user.phone,
              technician: response.data,
            } as UserProfile);

            setUser(updatedUser);
            await secureStorage.setItem('user', JSON.stringify(updatedUser));
            return;
          }
        } catch (apiError) {
          console.error('API update error:', apiError);
          if (apiError instanceof ApiError) {
            throw apiError;
          }
          // Fallback vers le système mock
        }
      }

      // Système mock (fallback)
      await new Promise(resolve => setTimeout(resolve, 500));
      const updatedUser = { ...user, ...data };
      setUser(updatedUser);
      await secureStorage.setItem('user', JSON.stringify(updatedUser));

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la mise à jour');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [apiAvailable, token, user]);

  const refreshUser = useCallback(async () => {
    if (!token) return;

    try {
      if (apiAvailable) {
        const response = await ApiService.getCurrentUser(token);
        if (response.success && response.data) {
          const updatedUser = transformApiUserToLocal(response.data);
          setUser(updatedUser);
          await secureStorage.setItem('user', JSON.stringify(updatedUser));
        }
      }
    } catch (err) {
      console.error('Error refreshing user:', err);
    }
  }, [apiAvailable, token]);

  const startVerification = (email: string) => {
    const found = demoUsers.find(u => u.email === email);
    if (found) {
      setPendingUserData(found);
      setVerificationPending(true);
    }
  };

  const verifyCode = async (code: string) => {
    if (apiAvailable) {
      // Vérification via API
      try {
        if (pendingUserData?.email) {
          const response = await ApiService.verifyCode(pendingUserData.email, code);
          if (response.success) {
            setVerificationPending(false);
            setPendingUserData(null);
            return true;
          }
        }
      } catch (error) {
        console.error('API verification error:', error);
        // Fallback vers le système mock
      }
    }

    // Système mock
    if (code === mockVerificationCode && pendingUserData) {
      const { password: _, ...userWithoutPass } = pendingUserData;
      demoUsers.push(pendingUserData);
      
      const demoToken = `demo_token_${Date.now()}`;
      await secureStorage.setItem('auth_token', demoToken);
      await secureStorage.setItem('user', JSON.stringify(userWithoutPass));
      
      setToken(demoToken);
      setUser(userWithoutPass);
      setIsAuthenticated(true);
      setVerificationPending(false);
      setPendingUserData(null);
      return true;
    }
    return false;
  };

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      // Déconnexion via API si disponible avec token Bearer
      if (token) {
        try {
          await ApiService.logout(token);
        } catch (error) {
          console.error('API logout error:', error);
        }
      }

      // Nettoyage local
      await secureStorage.removeItem('auth_token');
      await secureStorage.removeItem('user');
      
      setToken(null);
      setUser(null);
      setIsAuthenticated(false);
    } catch (err) {
      console.error('Erreur de déconnexion:', err);
    } finally {
      setIsLoading(false);
    }
  }, [apiAvailable, token]);

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      isLoading,
      user,
      token,
      login,
      register,
      logout,
      updateProfile,
      refreshUser,
      error,
      verificationPending,
      startVerification,
      verifyCode,
    }}>
      {children}
    </AuthContext.Provider>
  );
};