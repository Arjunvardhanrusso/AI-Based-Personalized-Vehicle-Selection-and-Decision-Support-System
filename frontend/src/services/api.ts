import type {
  UserProfile,
  RecommendationResponse,
  Vehicle,
  VehicleVariant,
  LocationData,
  AdvancedFilterQuery,
  AdvancedSearchResponse,
  VehicleImageResponse,
  User,
  AuthResponse,
  SavedVehicle,
  Review,
  Lead,
  AdminStats
} from '../types';

const API_BASE = '/api';

export async function fetchQuestions() {
  const res = await fetch(`${API_BASE}/questions`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch questions');
  return res.json();
}

export async function fetchVehicles(): Promise<Vehicle[]> {
  const res = await fetch(`${API_BASE}/vehicles`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch vehicles');
  return res.json();
}

export async function fetchVariants(state?: string, city?: string): Promise<VehicleVariant[]> {
  const params = new URLSearchParams();
  if (state) params.append('state', state);
  if (city) params.append('city', city);
  const url = `${API_BASE}/variants${params.toString() ? `?${params.toString()}` : ''}`;
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch variants');
  return res.json();
}

export async function fetchLocations(): Promise<LocationData> {
  const res = await fetch(`${API_BASE}/locations`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch locations');
  return res.json();
}

export async function fetchFilterOptions() {
  const res = await fetch(`${API_BASE}/filter-options`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch filter options');
  return res.json();
}

export async function fetchSearchSuggestions(q: string) {
  if (!q.trim()) return [];
  const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(q)}`, { credentials: 'include' });
  if (!res.ok) return [];
  return res.json();
}

export async function executeAdvancedSearch(query: AdvancedFilterQuery): Promise<AdvancedSearchResponse> {
  const res = await fetch(`${API_BASE}/recommend/advanced`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
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
    credentials: 'include',
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
  const res = await fetch(`${API_BASE}/price-estimate?${params.toString()}`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch price estimate');
  return res.json();
}

export async function fetchRules() {
  const res = await fetch(`${API_BASE}/rules`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch rules');
  return res.json();
}

export async function fetchFuzzySets() {
  const res = await fetch(`${API_BASE}/fuzzy-sets`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch fuzzy sets');
  return res.json();
}

export async function fetchBayesianPriors() {
  const res = await fetch(`${API_BASE}/bayesian-priors`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch bayesian priors');
  return res.json();
}

export async function fetchKnowledgeBaseSummary() {
  const res = await fetch(`${API_BASE}/knowledge-base`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch knowledge base summary');
  return res.json();
}

export async function getRecommendation(profile: UserProfile): Promise<RecommendationResponse> {
  const res = await fetch(`${API_BASE}/recommend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
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
    credentials: 'include',
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
  const res = await fetch(`${API_BASE}/vehicles/${encodeURIComponent(vehicleId)}/image${qStr}`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to resolve vehicle image');
  return res.json();
}

// -------------------------------------------------------------
// Authentication API
// -------------------------------------------------------------

export async function apiLogin(email: string, password: string):Promise<AuthResponse> {
  const formData = new URLSearchParams();
  formData.append('username', email);
  formData.append('password', password);

  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    credentials: 'include',
    body: formData.toString()
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Authentication failed' }));
    throw new Error(err.detail || 'Login failed');
  }
  return res.json();
}

export async function apiRegister(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Registration failed' }));
    throw new Error(err.detail || 'Registration failed');
  }
  return res.json();
}

export async function apiGetMe(): Promise<User> {
  const res = await fetch(`${API_BASE}/auth/me`, { credentials: 'include' });
  if (!res.ok) throw new Error('Not authenticated');
  return res.json();
}

export async function apiLogout(): Promise<void> {
  await fetch(`${API_BASE}/auth/logout`, {
    method: 'POST',
    credentials: 'include'
  });
}

// -------------------------------------------------------------
// Garage API
// -------------------------------------------------------------

export async function apiGetGarage(): Promise<SavedVehicle[]> {
  const res = await fetch(`${API_BASE}/garage/`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch saved vehicles');
  return res.json();
}

export async function apiAddToGarage(variantId: string): Promise<SavedVehicle> {
  const res = await fetch(`${API_BASE}/garage/add/${encodeURIComponent(variantId)}`, {
    method: 'POST',
    credentials: 'include'
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to add to garage' }));
    throw new Error(err.detail || 'Failed to save vehicle');
  }
  return res.json();
}

export async function apiRemoveFromGarage(variantId: string): Promise<void> {
  const res = await fetch(`${API_BASE}/garage/remove/${encodeURIComponent(variantId)}`, {
    method: 'DELETE',
    credentials: 'include'
  });
  if (!res.ok && res.status !== 204) {
    throw new Error('Failed to remove vehicle from garage');
  }
}

// -------------------------------------------------------------
// Reviews API
// -------------------------------------------------------------

export async function apiGetReviews(variantId: string): Promise<Review[]> {
  const res = await fetch(`${API_BASE}/reviews/${encodeURIComponent(variantId)}`, { credentials: 'include' });
  if (!res.ok) return [];
  return res.json();
}

export async function apiPostReview(variantId: string, rating: number, reviewText?: string): Promise<Review> {
  const res = await fetch(`${API_BASE}/reviews/${encodeURIComponent(variantId)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ rating, review_text: reviewText })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to submit review' }));
    throw new Error(err.detail || 'Failed to post review');
  }
  return res.json();
}

// -------------------------------------------------------------
// Leads API
// -------------------------------------------------------------

export async function apiCreateLead(data: {
  vehicle_variant_id: string;
  name: string;
  phone: string;
  message?: string;
}): Promise<Lead> {
  const res = await fetch(`${API_BASE}/leads/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Failed to submit lead request' }));
    throw new Error(err.detail || 'Failed to submit lead');
  }
  return res.json();
}

export async function apiGetLeads(): Promise<Lead[]> {
  const res = await fetch(`${API_BASE}/leads/`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch leads');
  return res.json();
}

// -------------------------------------------------------------
// Admin API
// -------------------------------------------------------------

export async function apiGetAdminStats(): Promise<AdminStats> {
  const res = await fetch(`${API_BASE}/admin/stats`, { credentials: 'include' });
  if (!res.ok) throw new Error('Failed to fetch admin stats');
  return res.json();
}

export async function apiTriggerScraper(): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/admin/trigger-scraper`, {
    method: 'POST',
    credentials: 'include'
  });
  if (!res.ok) throw new Error('Failed to trigger scraper job');
  return res.json();
}
