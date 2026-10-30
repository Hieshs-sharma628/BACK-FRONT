/**
 * SAJAG - Types & Interfaces Definition
 * Modern High-Clarity Corporate Navigation & Safety
 */

export type NavigationMode =
  | 'smart-navigation'
  | 'safe-journey'
  | 'risk-awareness'
  | 'live-monitoring'
  | 'emergency';

export type Language = 'en' | 'hi' | 'pa';

export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical' | 'unknown';

export type RiskCategory =
  | 'environmental'
  | 'infrastructure'
  | 'security'
  | 'accident_blackspot';

export interface Coordinates {
  lat: number;
  lng: number;
  name?: string;
  address?: string;
}

export interface RouteStep {
  instruction: string;
  distance: string;
  duration: string;
  safetyNote?: string;
  isCaution?: boolean;
}

export interface RouteOption {
  id: string;
  name: string;
  nameHi: string;
  namePa: string;
  type: 'safest' | 'fastest' | 'balanced';
  distanceKm: number;
  durationMinutes: number;
  safetyScore?: number; // 0 - 100
  lightingPercent?: number; // 0 - 100
  policeCheckpoints?: number;
  cctvCoveragePercent?: number;
  highRiskZonesPassed?: number;
  summary: string;
  path: [number, number][]; // lat, lng pairs
  steps: RouteStep[];
  isRecommended?: boolean;
}

export interface SafeLocation {
  id: string;
  name: string;
  nameHi: string;
  namePa: string;
  category: 'police' | 'hospital' | 'women_desk' | 'fuel_station' | 'safe_shelter';
  lat: number;
  lng: number;
  address: string;
  phone?: string;
  open24x7?: boolean;
  distanceKm?: number;
  verified?: boolean;
}

export interface RiskZone {
  id: string;
  title: string;
  titleHi: string;
  titlePa: string;
  category: RiskCategory;
  severity: RiskLevel;
  center: [number, number];
  radiusMeters?: number;
  coordinates?: [number, number][]; // polygon if applicable
  description: string;
  descriptionHi: string;
  descriptionPa: string;
  reportedTime: string;
  activeStatus: 'active' | 'clearing' | 'resolved';
}

export interface TelemetryData {
  trafficCongestionIndex: number; // 0 - 100
  streetLightingStatus: 'operational' | 'partial' | 'outage';
  weatherVisibilityKm: number;
  roadSurfaceCondition: 'dry' | 'wet' | 'rough' | 'waterlogged';
  patrolDensity: 'high' | 'moderate' | 'low';
  lastUpdated: string;
  dataSource: 'live' | 'simulated' | 'unavailable';
}

export interface EmergencyContact {
  id: string;
  name: string;
  phone: string;
  relationship: string;
  notifyOnSos: boolean;
}

export interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  phone: string;
  emergencyContacts: EmergencyContact[];
  preferredMode: NavigationMode;
  autoAlertOnStall: boolean;
  highRiskAlertsEnabled: boolean;
}

export interface SavedJourney {
  id: string;
  title: string;
  origin: Coordinates;
  destination: Coordinates;
  selectedRouteId: string;
  date: string;
  safetyScore: number;
}
