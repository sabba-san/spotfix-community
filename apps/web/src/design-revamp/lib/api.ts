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

export interface User {
  id: string;
  name: string;
  role: string;
  email: string;
  idNumber: string;
  phone: string;
  workLocation: string;
  permissions: string[];
  authType: string;
}

function normalizeUserFromMe(me): User {
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

export async function createMasterAccount(payload: { username: string; password: string; name: string }) {
  return apiRequest('/master/create', {
    method: 'POST',
    auth: true,
    body: payload,
  });
}

export interface V1Notification {
  _id?: string;
  id?: string;
  reportPublicId?: string | null;
  reportId?: string | null;
  type: string;
  title: string;
  body: string;
  isCritical?: boolean;
  createdAt?: string;
}

export async function listNotifications(limit = 20): Promise<V1Notification[]> {
  const data = await apiRequest(`/notifications?limit=${encodeURIComponent(String(limit))}`, { auth: true });
  return Array.isArray(data) ? data : [];
}

export async function listSupervisorCleaners(supervisorId: string) {
  const data = await apiRequest(`/supervisors/${encodeURIComponent(supervisorId)}/cleaners`, { auth: true });
  return Array.isArray(data) ? data : [];
}

// ===========================================================================
// V2 workflow API (device-bound sessions via the /v2/auth/exchange bridge)
// ===========================================================================

const V2_ACCESS_KEY = 'spotfix.web.v2.access';
const V2_REFRESH_KEY = 'spotfix.web.v2.refresh';
const V2_DEVICE_KEY = 'spotfix.web.deviceId';
const V2_FP_KEY = 'spotfix.web.deviceFp';

export type V2RoleSet = { reporter: boolean; supervisor: boolean; cleaner: boolean; admin: boolean };

export interface V2ReportSummary {
  id: string;
  title: string;
  status: string;
  location_address?: string | null;
  version: number;
  updated_at: string;
  has_pending_request?: boolean;
}

export interface V2ReportDetail {
  id: string;
  title: string;
  description?: string | null;
  status: string;
  priority: string;
  reporter_user_id: string;
  assigned_supervisor_id?: string | null;
  assigned_cleaner_id?: string | null;
  location_lat?: number | null;
  location_lng?: number | null;
  location_address?: string | null;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface V2Attachment {
  id: string;
  attachment_type: string;
  file_url: string;
  file_mime_type?: string | null;
  file_size?: number | null;
  uploaded_by_user_id: string;
  created_at: string;
}

export interface V2Event {
  id: string;
  seq: number;
  report_id: string;
  event_type: string;
  actor_user_id?: string | null;
  actor_role: string;
  payload?: Record<string, unknown> | null;
  created_at: string;
}

export interface V2VolunteerRequest {
  id: string;
  report_id: string;
  cleaner_user_id: string;
  cleaner_name?: string | null;
  note?: string | null;
  status: string;
  decided_by_user_id?: string | null;
  decided_at?: string | null;
  created_at: string;
  updated_at: string;
  report?: { id: string; title: string; status: string; location_address?: string | null; updated_at: string } | null;
}

export interface V2CleanerEntry {
  user_id: string;
  name: string;
  id_number: string;
  phone?: string | null;
  work_location?: string | null;
  is_busy: boolean;
  active_task_count: number;
}

export interface V2Notification {
  id: string;
  report_id?: string | null;
  event_id?: string | null;
  title: string;
  body: string;
  is_read: boolean;
  created_at: string;
  read_at?: string | null;
}

function getV2Access() {
  return localStorage.getItem(V2_ACCESS_KEY);
}

function getV2Refresh() {
  return localStorage.getItem(V2_REFRESH_KEY);
}

function getDeviceFingerprint() {
  let fp = localStorage.getItem(V2_FP_KEY);
  if (!fp) {
    fp = `web-${(crypto as Crypto).randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`}`;
    localStorage.setItem(V2_FP_KEY, fp);
  }
  return fp;
}

export function clearV2Session() {
  localStorage.removeItem(V2_ACCESS_KEY);
  localStorage.removeItem(V2_REFRESH_KEY);
}

function storeV2Session(session: { access_token: string; refresh_token?: string }) {
  if (!session?.access_token) return;
  localStorage.setItem(V2_ACCESS_KEY, session.access_token);
  if (session.refresh_token) localStorage.setItem(V2_REFRESH_KEY, session.refresh_token);
  else localStorage.removeItem(V2_REFRESH_KEY);
}

async function ensureV2DeviceId(): Promise<string> {
  const cached = localStorage.getItem(V2_DEVICE_KEY);
  if (cached) return cached;
  const response = await fetch(`${API_V2_BASE_URL}/devices/register`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(TENANT_SLUG ? { 'X-Tenant-Slug': TENANT_SLUG } : {}),
    },
    body: JSON.stringify({
      platform: 'web',
      device_name: 'web-browser',
      device_fingerprint: getDeviceFingerprint(),
      app_version: 'web-revamp',
    }),
  });
  const payload = await parseJson(response);
  if (!response.ok) throw new Error(extractErrorMessage(payload, 'Device registration failed'));
  const deviceId = payload?.data?.device?.id;
  if (!deviceId) throw new Error('Device registration failed');
  localStorage.setItem(V2_DEVICE_KEY, deviceId);
  return deviceId;
}

let v2SessionPromise: Promise<string> | null = null;

/** Exchange the v1 user session for a device-bound v2 session (cached). */
export function ensureV2Session(): Promise<string> {
  if (getV2Access()) return Promise.resolve(getV2Access()!);
  if (v2SessionPromise) return v2SessionPromise;
  v2SessionPromise = (async () => {
    try {
      const v1Token = getToken();
      if (!v1Token) throw new Error('Session missing. Please sign in again.');
      if (getAuthKind() === 'master') throw new Error('Master sessions use the v1 API.');
      const deviceId = await ensureV2DeviceId();
      const response = await fetch(`${API_V2_BASE_URL}/auth/exchange`, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `${getTokenType()} ${v1Token}`,
          ...(TENANT_SLUG ? { 'X-Tenant-Slug': TENANT_SLUG } : {}),
        },
        body: JSON.stringify({ device_id: deviceId }),
      });
      const payload = await parseJson(response);
      if (!response.ok) throw new Error(extractErrorMessage(payload, 'Workflow session failed'));
      storeV2Session(payload?.data?.session);
      const access = getV2Access();
      if (!access) throw new Error('Workflow session failed');
      return access;
    } finally {
      v2SessionPromise = null;
    }
  })();
  return v2SessionPromise;
}

async function refreshV2Session(): Promise<string | null> {
  const deviceId = localStorage.getItem(V2_DEVICE_KEY);
  const refreshToken = getV2Refresh();
  if (!deviceId || !refreshToken) return null;
  try {
    const response = await fetch(`${API_V2_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify({ device_id: deviceId, refresh_token: refreshToken }),
    });
    const payload = await parseJson(response);
    if (!response.ok) return null;
    storeV2Session(payload?.data?.session);
    return getV2Access();
  } catch {
    return null;
  }
}

async function apiV2RequestAuthed(path: string, options: { method?: string; body?: unknown } = {}, retried = false): Promise<unknown> {
  const access = await ensureV2Session();
  const response = await fetch(`${API_V2_BASE_URL}${path}`, {
    method: options.method || 'GET',
    headers: {
      Accept: 'application/json',
      ...(options.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      Authorization: `Bearer ${access}`,
      ...(TENANT_SLUG ? { 'X-Tenant-Slug': TENANT_SLUG } : {}),
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });
  if (response.status === 401 && !retried) {
    clearV2Session();
    const refreshed = await refreshV2Session();
    if (refreshed) return apiV2RequestAuthed(path, options, true);
    // Refresh unavailable (e.g. revoked) — re-exchange from the v1 session once.
    const renewed = await ensureV2Session();
    if (renewed !== access) return apiV2RequestAuthed(path, options, true);
  }
  const payload = await parseJson(response);
  if (!response.ok) throw new Error(extractErrorMessage(payload, `Request failed (${response.status})`));
  return payload?.data ?? payload;
}

async function apiV2Request(path: string, options: { method?: string; body?: unknown } = {}) {
  const token = getToken();
  if (!token) throw new Error('Session missing. Please sign in again.');
  return apiV2RequestAuthed(path, options);
}

export async function getV2Me(): Promise<{ id: string; name: string; roles: V2RoleSet } | null> {
  try {
    const data = (await apiV2Request('/me')) as { user?: { id: string; name: string; roles: V2RoleSet } };
    return data?.user ?? null;
  } catch {
    return null;
  }
}

export async function revokeV2Device() {
  const deviceId = localStorage.getItem(V2_DEVICE_KEY);
  const access = getV2Access();
  if (!deviceId || !access) {
    clearV2Session();
    return;
  }
  try {
    await fetch(`${API_V2_BASE_URL}/auth/logout-device`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: `Bearer ${access}`,
        ...(TENANT_SLUG ? { 'X-Tenant-Slug': TENANT_SLUG } : {}),
      },
      body: JSON.stringify({ device_id: deviceId }),
    });
  } finally {
    clearV2Session();
  }
}

// ---- Supervisor (v2) ----

export async function getSupervisorDashboardV2Authed() {
  return apiV2Request('/supervisor/dashboard') as Promise<{ summary: Record<string, number>; recent_reports: V2ReportSummary[] }>;
}

export async function listSupervisorReportsV2Authed(query: { status?: string; page?: number; limit?: number } = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => value !== undefined && params.set(key, String(value)));
  const suffix = params.toString() ? `?${params.toString()}` : '';
  return apiV2Request(`/supervisor/reports${suffix}`) as Promise<{ reports: V2ReportSummary[] }>;
}

export async function assignSupervisorReportV2Authed(reportId: string, body: { cleaner_user_id: string; expected_completion_at?: string; note?: string }) {
  return apiV2Request(`/supervisor/reports/${encodeURIComponent(reportId)}/assign`, { method: 'PATCH', body }) as Promise<V2MutationResponse>;
}

export async function endorseSupervisorReportV2Authed(reportId: string, note?: string) {
  return apiV2Request(`/supervisor/reports/${encodeURIComponent(reportId)}/endorse`, { method: 'PATCH', body: note ? { note } : {} }) as Promise<V2MutationResponse>;
}

export async function rejectSupervisorReportV2Authed(reportId: string, reason: string) {
  return apiV2Request(`/supervisor/reports/${encodeURIComponent(reportId)}/reject`, { method: 'PATCH', body: { reason } }) as Promise<V2MutationResponse>;
}

export async function listSupervisorCleanersV2(search?: string) {
  const params = new URLSearchParams();
  if (search) params.set('search', search);
  const suffix = params.toString() ? `?${params.toString()}` : '';
  const data = (await apiV2Request(`/supervisor/cleaners${suffix}`)) as { cleaners: V2CleanerEntry[] };
  return data?.cleaners ?? [];
}

export async function listVolunteerRequestsV2(status?: string) {
  const params = new URLSearchParams();
  if (status) params.set('status', status);
  const suffix = params.toString() ? `?${params.toString()}` : '';
  const data = (await apiV2Request(`/supervisor/volunteer-requests${suffix}`)) as { volunteer_requests: V2VolunteerRequest[] };
  return data?.volunteer_requests ?? [];
}

export async function rejectVolunteerRequestV2(requestId: string, reason: string) {
  return apiV2Request(`/supervisor/volunteer-requests/${encodeURIComponent(requestId)}/reject`, { method: 'PATCH', body: { reason } });
}

// ---- Cleaner (v2) ----

export async function listCleanerTasksV2Authed(query: { page?: number; limit?: number } = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => value !== undefined && params.set(key, String(value)));
  const suffix = params.toString() ? `?${params.toString()}` : '';
  return apiV2Request(`/cleaner/tasks${suffix}`) as Promise<{ tasks: V2ReportSummary[]; total: number; page: number; limit: number }>;
}

export async function listCleanerHistoryV2() {
  const data = (await apiV2Request('/cleaner/history?limit=100')) as { tasks: V2ReportSummary[]; total: number };
  return { tasks: data?.tasks ?? [], total: data?.total ?? 0 };
}

export async function mutateCleanerTaskV2Authed(taskId: string, action: 'accept' | 'reject' | 'start' | 'resolve', body: Record<string, unknown> = {}) {
  return apiV2Request(`/cleaner/tasks/${encodeURIComponent(taskId)}/${action}`, { method: 'PATCH', body }) as Promise<V2MutationResponse>;
}

export async function listAvailableReportsV2() {
  const data = (await apiV2Request('/cleaner/available')) as { reports: V2ReportSummary[]; total: number };
  return { reports: data?.reports ?? [], total: data?.total ?? 0 };
}

export async function requestVolunteerV2(reportId: string, note?: string) {
  return apiV2Request(`/cleaner/tasks/${encodeURIComponent(reportId)}/volunteer-request`, { method: 'POST', body: note ? { note } : {} });
}

// ---- Reports (v2) ----

export interface V2ReportDetailResponse {
  report: V2ReportDetail;
  attachments: V2Attachment[];
  events: V2Event[];
}

export async function getReportDetailV2(reportId: string): Promise<V2ReportDetailResponse> {
  return apiV2Request(`/reports/${encodeURIComponent(reportId)}`) as Promise<V2ReportDetailResponse>;
}

export async function createReportV2(payload: { title: string; description?: string; location_lat?: number; location_lng?: number; location_address?: string; priority?: string }) {
  return apiV2Request('/reports', { method: 'POST', body: payload }) as Promise<V2MutationResponse>;
}

// ---- Uploads (v2 presigned) ----

export async function presignUploadV2(payload: { report_id: string; kind: 'evidence' | 'resolution' | 'extra'; content_type: string; content_length?: number }) {
  return apiV2Request('/uploads/presign', { method: 'POST', body: payload }) as Promise<{ upload_url: string; method: string; headers?: Record<string, string>; expires_in: number; file_url: string }>;
}

/** Direct browser upload of a photo for a report; resolves to the file URL for mutation bodies. */
export async function uploadReportPhotoV2(reportId: string, kind: 'evidence' | 'resolution' | 'extra', file: Blob): Promise<string> {
  const presigned = await presignUploadV2({ report_id: reportId, kind, content_type: file.type || 'image/jpeg', content_length: file.size });
  const put = await fetch(presigned.upload_url, { method: 'PUT', headers: { 'Content-Type': file.type || 'image/jpeg' }, body: file });
  if (!put.ok) throw new Error(`Photo upload failed (${put.status})`);
  return presigned.file_url;
}

// ---- Admin (v2 roles, when signed in as an admin-capable user) ----

export async function listAdminUsersV2Authed(query: { search?: string; limit?: number } = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => value !== undefined && params.set(key, String(value)));
  const suffix = params.toString() ? `?${params.toString()}` : '';
  return apiV2Request(`/admin/users${suffix}`) as Promise<{ users: Array<{ id: string; name: string; email?: string; id_number: string; status: string; roles: V2RoleSet }> }>;
}

export async function assignAdminRoleV2Authed(userId: string, role: 'supervisor' | 'cleaner') {
  return apiV2Request(`/admin/users/${encodeURIComponent(userId)}/roles`, { method: 'POST', body: { role } });
}

// ---- Notifications (v2) ----

export async function listNotificationsV2(limit = 20): Promise<V2Notification[]> {
  try {
    const data = (await apiV2Request(`/notifications?limit=${encodeURIComponent(String(limit))}`)) as { notifications: V2Notification[] };
    return data?.notifications ?? [];
  } catch {
    return [];
  }
}

export async function markNotificationReadV2(notificationId: string) {
  return apiV2Request(`/notifications/${encodeURIComponent(notificationId)}/read`, { method: 'PATCH', body: {} });
}
