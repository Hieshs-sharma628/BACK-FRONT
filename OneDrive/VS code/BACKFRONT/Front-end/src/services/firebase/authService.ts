/**
 * SAJAG - Authentication Service
 * Prepares Firebase Authentication integration with local offline session fallback.
 */

import { UserProfile, EmergencyContact } from '../../types';
import { isFirebaseConfigured } from './firebaseConfig';
import { DEFAULT_EMERGENCY_CONTACTS } from '../../data/mockData';

const USER_SESSION_KEY = 'sajag_active_user_session';

const DEFAULT_USER: UserProfile = {
  id: 'usr_guest_demo',
  displayName: 'Pooja Kashyap',
  email: 'pooja.k@example.com',
  phone: '+91 98765 00000',
  emergencyContacts: DEFAULT_EMERGENCY_CONTACTS,
  preferredMode: 'smart-navigation',
  autoAlertOnStall: true,
  highRiskAlertsEnabled: true,
};

export const authService = {
  getCurrentUser: (): UserProfile => {
    try {
      const stored = localStorage.getItem(USER_SESSION_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return DEFAULT_USER;
  },

  updateProfile: async (updated: Partial<UserProfile>): Promise<UserProfile> => {
    const current = authService.getCurrentUser();
    const merged: UserProfile = { ...current, ...updated };
    localStorage.setItem(USER_SESSION_KEY, JSON.stringify(merged));
    return merged;
  },

  signInGuest: async (): Promise<UserProfile> => {
    return DEFAULT_USER;
  },

  signOut: async (): Promise<void> => {
    localStorage.removeItem(USER_SESSION_KEY);
  },

  isCloudSyncActive: (): boolean => {
    return isFirebaseConfigured();
  },
};
