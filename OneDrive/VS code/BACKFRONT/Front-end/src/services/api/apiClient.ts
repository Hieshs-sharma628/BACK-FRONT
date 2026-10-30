import { Coordinates, RiskZone, SafeLocation } from '../../types';

const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'
).replace(/\/+$/, '');
const PAGE_SIZE = 100;

interface Page<T> {
  items: T[];
  total: number;
  offset: number;
  limit: number;
}

export interface Village {
  id: string;
  name: string;
  district: string;
  state: string;
  latitude: number | null;
  longitude: number | null;
}

interface FloodZone {
  id: string;
  name: string;
  risk_level: RiskZone['severity'];
  hazard_type: string;
  verification_status: string;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  boundary_geojson: unknown;
  valid_from: string | null;
  valid_until: string | null;
  created_at: string;
}

interface Shelter {
  id: string;
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  capacity: number;
  current_occupancy: number | null;
  status: string;
  contact_phone: string | null;
}

interface AssistancePoint {
  id: string;
  name: string;
  category: string;
  latitude: number | string;
  longitude: number | string;
  address: string;
  contact_phone: string | null;
  operational_status: string;
  verification_status: string;
}

export interface WeatherObservation {
  observed_at: string;
  rainfall_mm: number | string | null;
  temperature_c: number | string | null;
  humidity_percent: number | string | null;
  source: string | null;
}

export interface RiverObservation {
  observed_at: string;
  water_level_m: number | string;
  source: string | null;
}

export interface PublicAlert {
  id: string;
  severity: string;
  title: string;
  description: string;
  created_at: string;
  expires_at: string | null;
}

export interface MonitoringData {
  weather: WeatherObservation | null;
  river: RiverObservation | null;
  alerts: PublicAlert[];
}

export interface SOSRequest {
  village_id: string;
  emergency_type: 'flood' | 'medical' | 'trapped' | 'other';
  latitude: number;
  longitude: number;
  description?: string;
}

export interface SOSReceipt {
  id: string;
  status: string;
  created_at: string;
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const payload = (await response.json()) as { detail?: unknown };
    const message =
      typeof payload.detail === 'string'
        ? payload.detail
        : `Request failed with status ${response.status}.`;
    throw new Error(message);
  }

  return (await response.json()) as T;
}

async function listAll<T>(path: string): Promise<T[]> {
  const items: T[] = [];
  let offset = 0;
  let total = 0;

  do {
    const separator = path.includes('?') ? '&' : '?';
    const page = await request<Page<T>>(
      `${path}${separator}offset=${offset}&limit=${PAGE_SIZE}`
    );
    items.push(...page.items);
    total = page.total;
    offset += page.items.length;
    if (page.items.length === 0) break;
  } while (offset < total);

  return items;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function polygonCoordinates(value: unknown): [number, number][] | undefined {
  if (!isRecord(value)) return undefined;
  const geometry =
    value.type === 'Feature' && isRecord(value.geometry)
      ? value.geometry
      : value;
  if (!Array.isArray(geometry.coordinates)) return undefined;

  let ring: unknown;
  if (geometry.type === 'Polygon') {
    const [outerRing] = geometry.coordinates;
    ring = outerRing;
  } else if (geometry.type === 'MultiPolygon') {
    const [polygon] = geometry.coordinates;
    ring = Array.isArray(polygon) ? polygon[0] : undefined;
  } else {
    return undefined;
  }

  if (!Array.isArray(ring)) return undefined;
  const points = ring.flatMap((position): [number, number][] => {
    if (
      !Array.isArray(position) ||
      typeof position[0] !== 'number' ||
      typeof position[1] !== 'number'
    ) {
      return [];
    }
    return [[position[1], position[0]]];
  });
  return points.length >= 3 ? points : undefined;
}

function mapFloodZone(zone: FloodZone): RiskZone | null {
  if (zone.verification_status === 'rejected') return null;
  const coordinates = polygonCoordinates(zone.boundary_geojson);
  const point =
    zone.latitude !== null && zone.longitude !== null
      ? ([zone.latitude, zone.longitude] as [number, number])
      : undefined;
  if (!point && !coordinates) return null;

  const center: [number, number] =
    point ??
    (coordinates
      ? [
          coordinates.reduce((sum, position) => sum + position[0], 0) /
            coordinates.length,
          coordinates.reduce((sum, position) => sum + position[1], 0) /
            coordinates.length,
        ]
      : [0, 0]);
  const activeStatus =
    zone.valid_until && Date.parse(zone.valid_until) < Date.now()
      ? 'resolved'
      : 'active';

  return {
    id: zone.id,
    title: zone.name,
    titleHi: zone.name,
    titlePa: zone.name,
    category: 'environmental',
    severity: zone.risk_level,
    center,
    radiusMeters: 0,
    coordinates,
    description: zone.description ?? 'No description provided.',
    descriptionHi: zone.description ?? 'No description provided.',
    descriptionPa: zone.description ?? 'No description provided.',
    reportedTime: zone.valid_from ?? zone.created_at,
    activeStatus,
  };
}

function distanceKm(origin: Coordinates, latitude: number, longitude: number): number {
  const radians = (degrees: number) => (degrees * Math.PI) / 180;
  const latitudeDelta = radians(latitude - origin.lat);
  const longitudeDelta = radians(longitude - origin.lng);
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(radians(origin.lat)) *
      Math.cos(radians(latitude)) *
      Math.sin(longitudeDelta / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export const apiClient = {
  async getFloodZones(origin: Coordinates): Promise<RiskZone[]> {
    const zones = await listAll<FloodZone>('/flood-zones');
    return zones.flatMap((zone) => {
      const adapted = mapFloodZone(zone);
      if (!adapted || distanceKm(origin, adapted.center[0], adapted.center[1]) > 50) {
        return [];
      }
      return [adapted];
    });
  },

  async getSafeLocations(origin: Coordinates): Promise<SafeLocation[]> {
    const [shelters, points] = await Promise.all([
      listAll<Shelter>('/shelters'),
      listAll<AssistancePoint>('/assistance-points'),
    ]);

    const shelterLocations = shelters.flatMap((shelter): SafeLocation[] => {
      if (
        shelter.status !== 'available' ||
        shelter.latitude === null ||
        shelter.longitude === null ||
        (shelter.current_occupancy !== null &&
          shelter.current_occupancy >= shelter.capacity)
      ) {
        return [];
      }
      const distance = distanceKm(origin, shelter.latitude, shelter.longitude);
      if (distance > 50) return [];
      return [{
        id: shelter.id,
        name: shelter.name,
        nameHi: shelter.name,
        namePa: shelter.name,
        category: 'safe_shelter',
        lat: shelter.latitude,
        lng: shelter.longitude,
        address: shelter.address,
        phone: shelter.contact_phone ?? undefined,
        distanceKm: distance,
      }];
    });

    const assistanceLocations = points.flatMap((point): SafeLocation[] => {
      const latitude = Number(point.latitude);
      const longitude = Number(point.longitude);
      if (
        !['operational', 'limited'].includes(point.operational_status) ||
        point.verification_status !== 'verified' ||
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude)
      ) {
        return [];
      }
      const distance = distanceKm(origin, latitude, longitude);
      if (distance > 50) return [];
      return [{
        id: point.id,
        name: point.name,
        nameHi: point.name,
        namePa: point.name,
        category: point.category === 'medical_center' ? 'hospital' : 'safe_shelter',
        lat: latitude,
        lng: longitude,
        address: point.address,
        phone: point.contact_phone ?? undefined,
        verified: true,
        distanceKm: distance,
      }];
    });

    return [...shelterLocations, ...assistanceLocations].sort(
      (left, right) => (left.distanceKm ?? Infinity) - (right.distanceKm ?? Infinity)
    );
  },

  async getVillages(): Promise<Village[]> {
    return listAll<Village>('/villages');
  },

  async getMonitoringData(villageId: string): Promise<MonitoringData> {
    const village = encodeURIComponent(villageId);
    const [weather, river, alerts] = await Promise.all([
      request<Page<WeatherObservation>>(`/weather?village_id=${village}&limit=20`),
      request<Page<RiverObservation>>(`/river-observations?village_id=${village}&limit=20`),
      request<Page<PublicAlert>>(`/alerts?village_id=${village}&limit=20`),
    ]);
    return {
      weather: weather.items[0] ?? null,
      river: river.items[0] ?? null,
      alerts: alerts.items,
    };
  },

  async submitSOS(payload: SOSRequest): Promise<SOSReceipt> {
    return request<SOSReceipt>('/emergency/sos', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },
};
