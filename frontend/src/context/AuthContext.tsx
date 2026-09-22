import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, SavedVehicle } from '../types';
import {
  apiLogin,
  apiRegister,
  apiLogout,
  apiGetMe,
  apiGetGarage,
  apiAddToGarage,
  apiRemoveFromGarage
} from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  savedVariantIds: Set<string>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  toggleSaveVehicle: (variantId: string) => Promise<boolean>;
  isVehicleSaved: (variantId: string) => boolean;
  refreshGarage: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [savedVariantIds, setSavedVariantIds] = useState<Set<string>>(new Set());

  const refreshGarage = useCallback(async () => {
    try {
      const items: SavedVehicle[] = await apiGetGarage();
      setSavedVariantIds(new Set(items.map((item) => item.vehicle_variant_id)));
    } catch {
      setSavedVariantIds(new Set());
    }
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      setLoading(true);
      const currentUser = await apiGetMe();
      setUser(currentUser);
      await refreshGarage();
    } catch {
      setUser(null);
      setSavedVariantIds(new Set());
    } finally {
      setLoading(false);
    }
  }, [refreshGarage]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (email: string, password: string) => {
    const res = await apiLogin(email, password);
    setUser(res.user);
    await refreshGarage();
  };

  const register = async (email: string, password: string) => {
    const res = await apiRegister(email, password);
    setUser(res.user);
    await refreshGarage();
  };

  const logout = async () => {
    await apiLogout();
    setUser(null);
    setSavedVariantIds(new Set());
  };

  const toggleSaveVehicle = async (variantId: string): Promise<boolean> => {
    if (!user) {
      throw new Error('Please login to save vehicles to your garage.');
    }

    const isSaved = savedVariantIds.has(variantId);
    if (isSaved) {
      await apiRemoveFromGarage(variantId);
      setSavedVariantIds((prev) => {
        const next = new Set(prev);
        next.delete(variantId);
        return next;
      });
      return false;
    } else {
      await apiAddToGarage(variantId);
      setSavedVariantIds((prev) => {
        const next = new Set(prev);
        next.add(variantId);
        return next;
      });
      return true;
    }
  };

  const isVehicleSaved = (variantId: string): boolean => {
    return savedVariantIds.has(variantId);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        savedVariantIds,
        login,
        register,
        logout,
        toggleSaveVehicle,
        isVehicleSaved,
        refreshGarage,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
