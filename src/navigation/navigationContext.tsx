import React, { createContext, useContext, useState, useCallback } from 'react';
import { ScreenName, NavigationRoute, NavigationProp, RouteProp } from './types';
import { useAuthStore } from '../store/authStore';

interface NavigationContextType {
  currentRoute: NavigationRoute;
  history: NavigationRoute[];
  navigate: (screen: ScreenName, params?: Record<string, any>) => void;
  goBack: () => void;
  replace: (screen: ScreenName, params?: Record<string, any>) => void;
  reset: (screen: ScreenName, params?: Record<string, any>) => void;
}

const NavigationContext = createContext<NavigationContextType | null>(null);

export interface NavigationProviderProps {
  children: React.ReactNode;
  initialRoute?: NavigationRoute;
}

export const NavigationProvider: React.FC<NavigationProviderProps> = ({
  children,
  initialRoute = { name: 'Login' },
}) => {
  const [history, setHistory] = useState<NavigationRoute[]>([initialRoute]);

  const currentRoute = history[history.length - 1] || initialRoute;

  const navigate = useCallback((name: ScreenName, params: Record<string, any> = {}) => {
    setHistory((prev) => [...prev, { name, params }]);
  }, []);

  const goBack = useCallback(() => {
    setHistory((prev) => {
      if (prev.length > 1) {
        return prev.slice(0, -1);
      }
      const u = useAuthStore.getState().currentUser;
      const fallback = u?.role === 'SUPER_ADMIN' ? 'SuperAdminDashboard' : 'UnifiedDashboard';
      return [{ name: fallback as ScreenName }];
    });
  }, []);

  const replace = useCallback((name: ScreenName, params: Record<string, any> = {}) => {
    setHistory((prev) => {
      const copy = [...prev];
      copy[copy.length - 1] = { name, params };
      return copy;
    });
  }, []);

  const reset = useCallback((name: ScreenName, params: Record<string, any> = {}) => {
    setHistory([{ name, params }]);
  }, []);

  return (
    <NavigationContext.Provider
      value={{
        currentRoute,
        history,
        navigate,
        goBack,
        replace,
        reset,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
};

export const useNavigation = (): NavigationProp => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within a NavigationProvider');
  }
  return {
    navigate: context.navigate,
    goBack: context.goBack,
    replace: context.replace,
    reset: context.reset,
  };
};

export const useRoute = (): RouteProp => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useRoute must be used within a NavigationProvider');
  }
  return {
    name: context.currentRoute.name,
    params: context.currentRoute.params || {},
  };
};

export const useNavigationState = () => {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigationState must be used within a NavigationProvider');
  }
  return {
    currentRoute: context.currentRoute,
    history: context.history,
  };
};
