/**
 * SAJAG - User Safe Locations & POI Service
 * Prepares Firestore collection: `users/{userId}/favoriteLocations`
 */

import { SafeLocation } from '../../types';
import { MOCK_SAFE_LOCATIONS } from '../../data/mockData';

const USER_FAVORITES_KEY = 'sajag_favorite_locations';

export const locationsService = {
  getFavoriteLocations: async (userId: string): Promise<SafeLocation[]> => {
    try {
      const stored = localStorage.getItem(USER_FAVORITES_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return MOCK_SAFE_LOCATIONS.slice(0, 3);
  },

  addFavoriteLocation: async (userId: string, location: SafeLocation): Promise<void> => {
    try {
      const existing = await locationsService.getFavoriteLocations(userId);
      const updated = [location, ...existing.filter((l) => l.id !== location.id)];
      localStorage.setItem(USER_FAVORITES_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  },
};
