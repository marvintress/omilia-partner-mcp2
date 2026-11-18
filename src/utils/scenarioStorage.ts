import {
  ApiReadiness,
  ByollmStackTier,
  CompetitorArchetype,
  DealMetadata,
  PartnerMotion,
  PovConfig,
  SovereigntyTier,
  UseCase,
  VerticalKey,
} from '../data/verticalPresets';
import { RoiInputs } from './calculations';

export interface ScenarioPayload {
  v: 1;
  vertical: VerticalKey;
  inputs: RoiInputs;
  useCases: UseCase[];
  partnerMotion: PartnerMotion;
  sovereignty: SovereigntyTier;
  apiReadiness: ApiReadiness;
  competitorArchetype?: CompetitorArchetype;
  byollmStackTier?: ByollmStackTier;
  povConfig?: PovConfig;
  psDayRate: number;
  dealMeta: DealMetadata;
}

export interface SavedDealProfile {
  id: string;
  name: string;
  savedAt: string;
  payload: ScenarioPayload;
}

const STORAGE_KEY = 'omilia_workbench_deals_v1';

export function encodeScenarioToUrl(payload: ScenarioPayload): string {
  const json = JSON.stringify(payload);
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const url = new URL(window.location.href);
  url.searchParams.set('s', base64);
  return url.toString();
}

export function decodeScenarioFromUrl(): ScenarioPayload | null {
  try {
    const params = new URLSearchParams(window.location.search);
    const raw = params.get('s');
    if (!raw) return null;
    const padded = raw.replace(/-/g, '+').replace(/_/g, '/') + '==='.slice((raw.length + 3) % 4);
    const binary = atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const json = new TextDecoder().decode(bytes);
    const parsed = JSON.parse(json) as ScenarioPayload;
    if (!parsed || parsed.v !== 1 || !parsed.vertical || !parsed.inputs) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearScenarioUrlParam(): void {
  const url = new URL(window.location.href);
  if (url.searchParams.has('s')) {
    url.searchParams.delete('s');
    window.history.replaceState({}, '', url.toString());
  }
}

export function loadSavedDeals(): SavedDealProfile[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveDealProfile(name: string, payload: ScenarioPayload): SavedDealProfile[] {
  const existing = loadSavedDeals();
  const next: SavedDealProfile[] = [
    {
      id: `deal-${Date.now()}`,
      name: name.trim() || 'Untitled Deal',
      savedAt: new Date().toISOString(),
      payload,
    },
    ...existing,
  ].slice(0, 20);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}

export function deleteDealProfile(id: string): SavedDealProfile[] {
  const existing = loadSavedDeals();
  const next = existing.filter((d) => d.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  return next;
}
