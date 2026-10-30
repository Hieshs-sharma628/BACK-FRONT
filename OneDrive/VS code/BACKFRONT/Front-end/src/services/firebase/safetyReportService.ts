/**
 * SAJAG - Safety Reports & Hazard Alerts Service
 * Prepares Firestore collection: `safetyReports` and `activeAlerts`
 */

import { RiskZone } from '../../types';
import { MOCK_RISK_ZONES } from '../../data/mockData';

const HAZARD_REPORTS_KEY = 'sajag_community_reports';

export const safetyReportService = {
  getCommunityReports: async (): Promise<RiskZone[]> => {
    try {
      const stored = localStorage.getItem(HAZARD_REPORTS_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return MOCK_RISK_ZONES;
  },

  submitHazardReport: async (report: RiskZone): Promise<RiskZone> => {
    try {
      const existing = await safetyReportService.getCommunityReports();
      const updated = [report, ...existing];
      localStorage.setItem(HAZARD_REPORTS_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
    return report;
  },
};
