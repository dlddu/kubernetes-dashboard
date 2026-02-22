import { createContext, useContext, useState, useCallback, ReactNode } from 'react';

const FAVORITES_KEY = 'namespace-favorites';

interface FavoritesContextType {
  favorites: string[];
  toggleFavorite: (namespace: string) => void;
  isFavorite: (namespace: string) => boolean;
}

export const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

function loadFavorites(): string[] {
  try {
    const stored = localStorage.getItem(FAVORITES_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

export function FavoritesProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<string[]>(loadFavorites);

  const toggleFavorite = useCallback((namespace: string) => {
    setFavorites(prev => {
      const next = prev.includes(namespace)
        ? prev.filter(n => n !== namespace)
        : [...prev, namespace];
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const isFavorite = useCallback((namespace: string) => {
    return favorites.includes(namespace);
  }, [favorites]);

  return (
    <FavoritesContext.Provider value={{ favorites, toggleFavorite, isFavorite }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}
