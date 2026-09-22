import type {
  UserProfile,
  RecommendationResponse,
  Vehicle,
  VehicleVariant,
  LocationData,
  AdvancedFilterQuery,
  AdvancedSearchResponse,
  VehicleImageResponse
} from '../types';

const API_BASE = '/api';

export async function fetchQuestions() {
  const res = await fetch(`${API_BASE}/questions`);
  if (!res.ok) throw new Error('Failed to fetch questions');
  return res.json();
}

export async function fetchVehicles(): Promise<Vehicle[]> {
  const res = await fetch(`${API_BASE}/vehicles`);
  if (!res.ok) throw new Error('Failed to fetch vehicles');
  return res.json();
}

export async function fetchVariants(state?: string, city?: string): Promise<VehicleVariant[]> {
  const params = new URLSearchParams();
  if (state) params.append('state', state);
  if (city) params.append('city', city);
  const url = `${API_BASE}/variants${params.toString() ? `?${params.toString()}` : ''}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch variants');
  return res.json();
}

export async function fetchLocations(): Promise<LocationData> {
  const res = await fetch(`${API_BASE}/locations`);
  if (!res.ok) throw new Error('Failed to fetch locations');
  return res.json();
}

export async function fetchFilterOptions() {
  const res = await fetch(`${API_BASE}/filter-options`);
  if (!res.ok) throw new Error('Failed to fetch filter options');
  return res.json();
}

export async function fetchSearchSuggestions(q: string) {
  if (!q.trim()) return [];
  const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(q)}`);
  if (!res.ok) return [];
  return res.json();
}

export async function executeAdvancedSearch(query: AdvancedFilterQuery): Promise<AdvancedSearchResponse> {
  const res = await fetch(`${API_BASE}/recommend/advanced`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(query),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Search API Error' }));
    throw new Error(err.detail || 'Failed to execute advanced search');
  }
  return res.json();
}

export async function compareVariants(variant_ids: string[], state?: string, city?: string) {
  const res = await fetch(`${API_BASE}/compare`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ variant_ids, state, city }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Compare API Error' }));
    throw new Error(err.detail || 'Failed to compare vehicles');
  }
  return res.json();
}

export async function fetchPriceEstimate(exShowroom: number, fuelType: string, state: string) {
  const params = new URLSearchParams({
    ex_showroom: exShowroom.toString(),
    fuel_type: fuelType,
    state: state,
    is_ev: fuelType.toLowerCase() === 'ev' ? 'true' : 'false'
  });
  const res = await fetch(`${API_BASE}/price-estimate?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch price estimate');
  return res.json();
}

export async function fetchRules() {
  const res = await fetch(`${API_BASE}/rules`);
  if (!res.ok) throw new Error('Failed to fetch rules');
  return res.json();
}

export async function fetchFuzzySets() {
  const res = await fetch(`${API_BASE}/fuzzy-sets`);
  if (!res.ok) throw new Error('Failed to fetch fuzzy sets');
  return res.json();
}

export async function fetchBayesianPriors() {
  const res = await fetch(`${API_BASE}/bayesian-priors`);
  if (!res.ok) throw new Error('Failed to fetch bayesian priors');
  return res.json();
}

export async function fetchKnowledgeBaseSummary() {
  const res = await fetch(`${API_BASE}/knowledge-base`);
  if (!res.ok) throw new Error('Failed to fetch knowledge base summary');
  return res.json();
}

export async function getRecommendation(profile: UserProfile): Promise<RecommendationResponse> {
  const res = await fetch(`${API_BASE}/recommend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(profile),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'API Error' }));
    throw new Error(err.detail || 'Failed to generate recommendation');
  }
  return res.json();
}

export async function negotiateVehicle(params: {
  vehicle_id?: string;
  listed_price: number;
  year_of_manufacture?: number;
  odometer_km?: number;
  condition_grade?: string;
  ownership_count?: number;
  service_history?: string;
  accident_history?: string;
  user_initial_offer?: number;
}) {
  const res = await fetch(`${API_BASE}/negotiate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Negotiation Engine Error' }));
    throw new Error(err.detail || 'Failed to run negotiation engine');
  }
  return res.json();
}

export async function fetchVehicleImage(
  vehicleId: string,
  options?: { brand?: string; model?: string; variant?: string; bodyType?: string }
): Promise<VehicleImageResponse> {
  const params = new URLSearchParams();
  if (options?.brand) params.append('brand', options.brand);
  if (options?.model) params.append('model', options.model);
  if (options?.variant) params.append('variant', options.variant);
  if (options?.bodyType) params.append('body_type', options.bodyType);
  const qStr = params.toString() ? `?${params.toString()}` : '';
  const res = await fetch(`${API_BASE}/vehicles/${encodeURIComponent(vehicleId)}/image${qStr}`);
  if (!res.ok) throw new Error('Failed to resolve vehicle image');
  return res.json();
}

