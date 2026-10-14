const runtimeConfig = window.__APP_CONFIG__ || {};
const API_BASE_URL = String(
  runtimeConfig.API_BASE_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api/v1',
).replace(/\/+$/, '');
const TENANT_SLUG = String(
  runtimeConfig.TENANT_SLUG || import.meta.env.VITE_TENANT_SLUG || 'example-campus',
).trim();

const API_V2_BASE_URL = API_BASE_URL.replace(/\/v1\/?$/, '/v2');

const TOKEN_KEY = 'spotfix.web.token';
const REFRESH_TOKEN_KEY = 'spotfix.web.refresh';
const TOKEN_TYPE_KEY = 'spotfix.web.tokenType';
const AUTH_KIND_KEY = 'spotfix.web.authKind';

export type V2ReportStatus =
  | 'submitted'
  | 'assigned'
  | 'accepted_by_cleaner'
  | 'in_progress'
  | 'resolved_by_cleaner'
  | 'endorsed_by_supervisor'
  | 'rejected_by_cleaner'
  | 'rejected_by_supervisor'
  | 'closed'
  | 'cancelled';

export interface V2ReportSummary {
  id: string;
  title: string;
  status: V2ReportStatus;
  location_address?: string;
  version: number;
  updated_at: string;
}

export interface V2MutationResponse {
  report: Record<string, unknown>;
  event: { id: string; type: string };
  sync: { cursor: number };
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getTokenType() {
  return localStorage.getItem(TOKEN_TYPE_KEY) || 'Bearer';
}

export function getAuthKind() {
  return localStorage.getItem(AUTH_KIND_KEY);
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(TOKEN_TYPE_KEY);
  localStorage.removeItem(AUTH_KIND_KEY);
}

function storeSession(envelope, authKind) {
  if (!envelope?.accessToken) return;
  localStorage.setItem(TOKEN_KEY, envelope.accessToken);
  localStorage.setItem(TOKEN_TYPE_KEY, envelope.tokenType || 'Bearer');
  localStorage.setItem(AUTH_KIND_KEY, authKind);
  if (envelope.refreshToken) {
    localStorage.setItem(REFRESH_TOKEN_KEY, envelope.refreshToken);
  } else {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
}

async function parseJson(response) {
  const raw = await response.text();
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return { message: raw };
  }
}

function extractErrorMessage(payload, fallback) {
  if (!payload) return fallback;
  if (typeof payload?.error === 'object' && payload.error?.message) return payload.error.message;
  if (typeof payload?.error === 'string') return payload.error;
  if (typeof payload?.message === 'string') return payload.message;
  return fallback;
}

export async function apiRequest(path, { method = 'GET', body, auth = false, tenant = false } = {}) {
  const headers = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (tenant && TENANT_SLUG) headers['X-Tenant-Slug'] = TENANT_SLUG;
  if (auth) {
    const token = getToken();
    if (!token) throw new Error('Session missing. Please sign in again.');
    headers.Authorization = `${getTokenType()} ${token}`;
  }
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method, headers, body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const payload = await parseJson(response);
  if (!response.ok) {
    if (response.status === 401 && auth) {
      clearSession();
      throw new Error('Session expired. Please sign in again.');
    }
    throw new Error(extractErrorMessage(payload, `Request failed (${response.status})`));
  }
  return payload;
}

async function apiV2Request(path: string, options: { method?: string; body?: unknown } = {}) {
  const token = getToken();
  if (!token) throw new Error('Session missing. Please sign in again.');
  const response = await fetch(`${API_V2_BASE_URL}${path}`, {
    method: options.method || 'GET',
    headers: {
      Accept: 'application/json',
      ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      Authorization: `${getTokenType()} ${token}`,
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  const payload = await parseJson(response);
  if (!response.ok) throw new Error(extractErrorMessage(payload, `Request failed (${response.status})`));
  return payload?.data ?? payload;
}

export async function getSupervisorDashboardV2() {
  return apiV2Request('/supervisor/dashboard') as Promise<{ summary: Record<string, number>; recent_reports: V2ReportSummary[] }>;
}

export async function listSupervisorReportsV2(query: { status?: V2ReportStatus; page?: number; limit?: number } = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => value !== undefined && params.set(key, String(value)));
  return apiV2Request(`/supervisor/reports?${params}`) as Promise<{ reports: V2ReportSummary[] }>;
}

export async function assignSupervisorReportV2(reportId: string, body: { cleaner_user_id: string; expected_completion_at?: string; note?: string }) {
  return apiV2Request(`/supervisor/reports/${encodeURIComponent(reportId)}/assign`, { method: 'PATCH', body }) as Promise<V2MutationResponse>;
}

export async function endorseSupervisorReportV2(reportId: string, note?: string) {
  return apiV2Request(`/supervisor/reports/${encodeURIComponent(reportId)}/endorse`, { method: 'PATCH', body: note ? { note } : {} }) as Promise<V2MutationResponse>;
}

export async function rejectSupervisorReportV2(reportId: string, reason: string) {
  return apiV2Request(`/supervisor/reports/${encodeURIComponent(reportId)}/reject`, { method: 'PATCH', body: { reason } }) as Promise<V2MutationResponse>;
}

export async function listCleanerTasksV2(query: { page?: number; limit?: number } = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => value !== undefined && params.set(key, String(value)));
  return apiV2Request(`/cleaner/tasks?${params}`) as Promise<{ tasks: V2ReportSummary[]; total: number; page: number; limit: number }>;
}

export async function mutateCleanerTaskV2(taskId: string, action: 'accept' | 'reject' | 'start' | 'resolve', body: Record<string, unknown> = {}) {
  return apiV2Request(`/cleaner/tasks/${encodeURIComponent(taskId)}/${action}`, { method: 'PATCH', body }) as Promise<V2MutationResponse>;
}

export async function listAdminUsersV2(query: { search?: string; limit?: number } = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => value !== undefined && params.set(key, String(value)));
  return apiV2Request(`/admin/users?${params}`) as Promise<{ users: Array<{ id: string; name: string; email?: string; id_number: string; status: string; roles: { reporter: boolean; supervisor: boolean; cleaner: boolean; admin: boolean } }> }>;
}

export async function assignAdminRoleV2(userId: string, role: 'supervisor' | 'cleaner') {
  return apiV2Request(`/admin/users/${encodeURIComponent(userId)}/roles`, { method: 'POST', body: { role } });
}

function normalizeUserFromMe(me) {
  return {
    id: me?.profile?._id || me?.auth?.userId || '',
    name: me?.profile?.name || me?.auth?.name || 'Unknown',
    role: me?.auth?.role || me?.profile?.role || 'public',
    email: me?.profile?.email || '',
    idNumber: me?.profile?.idNumber || '',
    phone: me?.profile?.phone || '',
    workLocation: me?.profile?.workLocation || '',
    permissions: Array.isArray(me?.permissions) ? me.permissions : [],
    authType: me?.auth?.authType || localStorage.getItem(AUTH_KIND_KEY) || 'user',
  };
}

export async function bootstrapSession() {
  const token = getToken();
  if (!token) return null;
  const me = await apiRequest('/me', { auth: true });
  return normalizeUserFromMe(me);
}

export async function registerAndLogin({ name, email, idNumber, phone, password }) {
  await apiRequest('/users/register', {
    method: 'POST',
    tenant: true,
    body: { name, email, idNumber, phone, password, role: 'public' },
  });

  return login({
    identifier: email.trim() || idNumber.trim(),
    password,
  });
}

export async function login({ identifier, password }) {
  const trimmed = identifier.trim();
  const auth = await apiRequest('/users/login', {
    method: 'POST',
    tenant: true,
    body: trimmed.includes('@')
      ? { email: trimmed.toLowerCase(), password }
      : { idNumber: trimmed, password },
  });
  storeSession(auth, 'user');
  const me = await apiRequest('/me', { auth: true });
  return normalizeUserFromMe(me);
}

export async function loginWithGoogle(idToken) {
  const auth = await apiRequest('/users/google', {
    method: 'POST',
    tenant: true,
    body: { idToken },
  });
  storeSession(auth, 'user');
  const me = await apiRequest('/me', { auth: true });
  return normalizeUserFromMe(me);
}

export async function loginMaster({ username, password }) {
  const auth = await apiRequest('/master/login', {
    method: 'POST',
    tenant: true,
    body: { username, password },
  });
  storeSession(auth, 'master');
  const me = await apiRequest('/me', { auth: true });
  return normalizeUserFromMe(me);
}

export async function logout() {
  const authKind = localStorage.getItem(AUTH_KIND_KEY);
  try {
    await apiRequest(authKind === 'master' ? '/master/logout' : '/users/logout', {
      method: 'POST',
      auth: true,
    });
  } finally {
    clearSession();
  }
}

export async function getMyReports(userId) {
  const reports = await apiRequest(`/reports/user/${encodeURIComponent(userId)}`, { auth: true });
  return Array.isArray(reports) ? reports : [];
}

export async function listReports() {
  const reports = await apiRequest('/reports', { auth: true });
  return Array.isArray(reports) ? reports : [];
}

export async function getPublicStatusBoard() {
  return apiRequest('/reports/public/status', { tenant: true });
}

export async function getGeoConfig() {
  const response = await fetch(`${API_V2_BASE_URL}/geo/config`, {
    headers: {
      Accept: 'application/json',
      ...(TENANT_SLUG ? { 'X-Tenant-Slug': TENANT_SLUG } : {}),
    },
  });
  const payload = await parseJson(response);
  if (!response.ok) {
    throw new Error(extractErrorMessage(payload, `Geo configuration failed (${response.status})`));
  }
  return payload?.data ?? payload;
}

export async function resolveGeoLocation(lat: number, lng: number) {
  const query = new URLSearchParams({ lat: String(lat), lng: String(lng) });
  const response = await fetch(`${API_V2_BASE_URL}/geo/resolve?${query}`, {
    headers: {
      Accept: 'application/json',
      ...(TENANT_SLUG ? { 'X-Tenant-Slug': TENANT_SLUG } : {}),
    },
  });
  const payload = await parseJson(response);
  if (!response.ok) {
    throw new Error(extractErrorMessage(payload, `Location resolution failed (${response.status})`));
  }
  return payload?.data ?? payload;
}

export async function createReport(payload) {
  return apiRequest('/reports', {
    method: 'POST',
    auth: true,
    body: {
      id: payload.id,
      category: payload.category,
      location: payload.location,
      coordinates: payload.coordinates,
      details: payload.details,
      priority: payload.priority,
      reporterPhone: payload.reporterPhone,
      evidencePhoto: payload.evidencePhoto,
      photos: payload.photos,
      photoTimestamp: payload.photoTimestamp,
      status: 'Reported',
      timestamp: new Date().toISOString(),
    },
  });
}

export async function updateReport(reportId: string, body: Record<string, unknown>) {
  return apiRequest(`/reports/${encodeURIComponent(reportId)}`, {
    method: 'PUT',
    auth: true,
    body,
  });
}

export async function listCleaners(query: Record<string, string> = {}) {
  const params = new URLSearchParams();
  if (query.supervisorId) params.set('supervisorId', query.supervisorId);
  if (query.workLocation) params.set('workLocation', query.workLocation);
  const suffix = params.toString() ? `?${params.toString()}` : '';
  const cleaners = await apiRequest(`/cleaners${suffix}`, { auth: true });
  return Array.isArray(cleaners) ? cleaners : [];
}

export async function createCleaner(body: Record<string, unknown>) {
  return apiRequest('/cleaners', {
    method: 'POST',
    auth: true,
    body,
  });
}

export async function assignCleaner(cleanerId: string, reportId: string) {
  return apiRequest(`/cleaners/${encodeURIComponent(cleanerId)}/assign`, {
    method: 'POST',
    auth: true,
    body: { reportId },
  });
}

export async function listUsers() {
  const users = await apiRequest('/users', { auth: true });
  return Array.isArray(users) ? users : [];
}

export async function provisionUser(payload: Record<string, unknown>) {
  return apiRequest('/users/provision', {
    method: 'POST',
    auth: true,
    body: payload,
  });
}
