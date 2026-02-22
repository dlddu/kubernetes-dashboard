import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FavoritesProvider, useFavorites } from './FavoritesContext';
import { ReactNode } from 'react';

const FAVORITES_KEY = 'namespace-favorites';

const wrapper = ({ children }: { children: ReactNode }) => (
  <FavoritesProvider>{children}</FavoritesProvider>
);

describe('FavoritesContext', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
  });

  describe('loadFavorites - localStorage에서 정상 로드', () => {
    it('should load favorites from localStorage on initialization', () => {
      // Arrange
      const stored = ['default', 'kube-system'];
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(stored));

      // Act
      const { result } = renderHook(() => useFavorites(), { wrapper });

      // Assert
      expect(result.current.favorites).toEqual(['default', 'kube-system']);
    });
  });

  describe('loadFavorites - localStorage 비어있을 때 빈 배열', () => {
    it('should return empty array when localStorage has no favorites entry', () => {
      // Arrange
      // localStorage is already empty from beforeEach

      // Act
      const { result } = renderHook(() => useFavorites(), { wrapper });

      // Assert
      expect(result.current.favorites).toEqual([]);
    });
  });

  describe('loadFavorites - JSON 파싱 실패 시 빈 배열', () => {
    it('should return empty array when localStorage contains invalid JSON', () => {
      // Arrange
      localStorage.setItem(FAVORITES_KEY, 'not-valid-json{{{');

      // Act
      const { result } = renderHook(() => useFavorites(), { wrapper });

      // Assert
      expect(result.current.favorites).toEqual([]);
    });
  });

  describe('FavoritesProvider - 초기값 올바르게 로드', () => {
    it('should initialize favorites with values from localStorage', () => {
      // Arrange
      const stored = ['production', 'staging', 'development'];
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(stored));

      // Act
      const { result } = renderHook(() => useFavorites(), { wrapper });

      // Assert
      expect(result.current.favorites).toHaveLength(3);
      expect(result.current.favorites).toEqual(['production', 'staging', 'development']);
    });

    it('should expose toggleFavorite and isFavorite as functions', () => {
      // Act
      const { result } = renderHook(() => useFavorites(), { wrapper });

      // Assert
      expect(typeof result.current.toggleFavorite).toBe('function');
      expect(typeof result.current.isFavorite).toBe('function');
    });
  });

  describe('toggleFavorite - 새 항목 추가', () => {
    it('should add namespace to favorites when it is not already present', () => {
      // Arrange
      const { result } = renderHook(() => useFavorites(), { wrapper });
      expect(result.current.favorites).toEqual([]);

      // Act
      act(() => {
        result.current.toggleFavorite('default');
      });

      // Assert
      expect(result.current.favorites).toContain('default');
      expect(result.current.favorites).toHaveLength(1);
    });

    it('should add multiple distinct namespaces', () => {
      // Arrange
      const { result } = renderHook(() => useFavorites(), { wrapper });

      // Act
      act(() => {
        result.current.toggleFavorite('default');
        result.current.toggleFavorite('kube-system');
      });

      // Assert
      expect(result.current.favorites).toContain('default');
      expect(result.current.favorites).toContain('kube-system');
      expect(result.current.favorites).toHaveLength(2);
    });
  });

  describe('toggleFavorite - 기존 항목 제거', () => {
    it('should remove namespace from favorites when it is already present', () => {
      // Arrange
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(['default', 'kube-system']));
      const { result } = renderHook(() => useFavorites(), { wrapper });
      expect(result.current.favorites).toContain('default');

      // Act
      act(() => {
        result.current.toggleFavorite('default');
      });

      // Assert
      expect(result.current.favorites).not.toContain('default');
      expect(result.current.favorites).toContain('kube-system');
      expect(result.current.favorites).toHaveLength(1);
    });

    it('should result in empty array after removing the only favorite', () => {
      // Arrange
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(['default']));
      const { result } = renderHook(() => useFavorites(), { wrapper });

      // Act
      act(() => {
        result.current.toggleFavorite('default');
      });

      // Assert
      expect(result.current.favorites).toEqual([]);
    });
  });

  describe('toggleFavorite - localStorage 업데이트 확인', () => {
    it('should persist added namespace to localStorage', () => {
      // Arrange
      const { result } = renderHook(() => useFavorites(), { wrapper });

      // Act
      act(() => {
        result.current.toggleFavorite('default');
      });

      // Assert
      const stored = JSON.parse(localStorage.getItem(FAVORITES_KEY) ?? '[]');
      expect(stored).toContain('default');
    });

    it('should persist removal of namespace to localStorage', () => {
      // Arrange
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(['default', 'kube-system']));
      const { result } = renderHook(() => useFavorites(), { wrapper });

      // Act
      act(() => {
        result.current.toggleFavorite('default');
      });

      // Assert
      const stored = JSON.parse(localStorage.getItem(FAVORITES_KEY) ?? '[]');
      expect(stored).not.toContain('default');
      expect(stored).toContain('kube-system');
    });

    it('should keep localStorage in sync after multiple toggles', () => {
      // Arrange
      const { result } = renderHook(() => useFavorites(), { wrapper });

      // Act
      act(() => {
        result.current.toggleFavorite('default');   // add
        result.current.toggleFavorite('kube-system'); // add
        result.current.toggleFavorite('default');   // remove
      });

      // Assert
      const stored = JSON.parse(localStorage.getItem(FAVORITES_KEY) ?? '[]');
      expect(stored).not.toContain('default');
      expect(stored).toContain('kube-system');
    });
  });

  describe('isFavorite - 존재하는 항목에 대해 true', () => {
    it('should return true for a namespace that is in favorites', () => {
      // Arrange
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(['default']));
      const { result } = renderHook(() => useFavorites(), { wrapper });

      // Act
      const result_ = result.current.isFavorite('default');

      // Assert
      expect(result_).toBe(true);
    });

    it('should return true after a namespace is added via toggleFavorite', () => {
      // Arrange
      const { result } = renderHook(() => useFavorites(), { wrapper });

      act(() => {
        result.current.toggleFavorite('production');
      });

      // Act
      const isFav = result.current.isFavorite('production');

      // Assert
      expect(isFav).toBe(true);
    });
  });

  describe('isFavorite - 존재하지 않는 항목에 대해 false', () => {
    it('should return false for a namespace that is not in favorites', () => {
      // Arrange
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(['kube-system']));
      const { result } = renderHook(() => useFavorites(), { wrapper });

      // Act
      const result_ = result.current.isFavorite('default');

      // Assert
      expect(result_).toBe(false);
    });

    it('should return false when favorites list is empty', () => {
      // Arrange
      const { result } = renderHook(() => useFavorites(), { wrapper });

      // Act
      const result_ = result.current.isFavorite('default');

      // Assert
      expect(result_).toBe(false);
    });

    it('should return false after a namespace is removed via toggleFavorite', () => {
      // Arrange
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(['default']));
      const { result } = renderHook(() => useFavorites(), { wrapper });

      act(() => {
        result.current.toggleFavorite('default');
      });

      // Act
      const isFav = result.current.isFavorite('default');

      // Assert
      expect(isFav).toBe(false);
    });
  });

  describe('useFavorites - Provider 외부에서 호출 시 에러', () => {
    it('should throw an error when used outside FavoritesProvider', () => {
      // Act & Assert
      expect(() => {
        renderHook(() => useFavorites());
      }).toThrow('useFavorites must be used within a FavoritesProvider');
    });
  });
});
