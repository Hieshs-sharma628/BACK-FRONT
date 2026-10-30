/**
 * SAJAG - Journey Persistence Service
 * Prepares Firestore collection: `users/{userId}/savedJourneys`
 */

import { SavedJourney } from '../../types';
import { isFirebaseConfigured } from './firebaseConfig';

const SAVED_JOURNEYS_KEY = 'sajag_saved_journeys';

export const journeyService = {
  getSavedJourneys: async (userId: string): Promise<SavedJourney[]> => {
    if (isFirebaseConfigured()) {
      // Future Firestore query implementation:
      // return (await getDocs(collection(db, `users/${userId}/savedJourneys`))).docs.map(...)
    }

    try {
      const stored = localStorage.getItem(SAVED_JOURNEYS_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }

    return [
      {
        id: 'journey-default-1',
        title: 'Daily Commute: Connaught Place to Cyber Hub',
        origin: { lat: 28.6315, lng: 77.2167, name: 'Connaught Place' },
        destination: { lat: 28.4986, lng: 77.0898, name: 'Cyber Hub' },
        selectedRouteId: 'route-safest',
        date: '2026-10-28',
        safetyScore: 96,
      },
    ];
  },

  saveJourney: async (userId: string, journey: SavedJourney): Promise<void> => {
    try {
      const existing = await journeyService.getSavedJourneys(userId);
      const updated = [journey, ...existing.filter((j) => j.id !== journey.id)];
      localStorage.setItem(SAVED_JOURNEYS_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  },

  deleteJourney: async (userId: string, journeyId: string): Promise<void> => {
    try {
      const existing = await journeyService.getSavedJourneys(userId);
      const filtered = existing.filter((j) => j.id !== journeyId);
      localStorage.setItem(SAVED_JOURNEYS_KEY, JSON.stringify(filtered));
    } catch {
      // ignore
    }
  },
};
