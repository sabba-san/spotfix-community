import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  assignSupervisorReportV2Authed,
  endorseSupervisorReportV2Authed,
  getReportDetailV2,
  getSupervisorDashboardV2Authed,
  listAdminUsersV2Authed,
  assignAdminRoleV2Authed,
  listAvailableReportsV2,
  listCleanerHistoryV2,
  listCleanerTasksV2Authed,
  listNotificationsV2,
  listSupervisorCleanersV2,
  listSupervisorReportsV2Authed,
  listVolunteerRequestsV2,
  markNotificationReadV2,
  mutateCleanerTaskV2Authed,
  rejectSupervisorReportV2Authed,
  rejectVolunteerRequestV2,
  requestVolunteerV2,
  updateProfileMe,
  type UpdateProfileMeBody,
} from '@/design-revamp/lib/api';

// ---- Supervisor ----

export function useSupervisorDashboardV2(enabled = true) {
  return useQuery({
    queryKey: ['v2', 'supervisor', 'dashboard'],
    queryFn: getSupervisorDashboardV2Authed,
    enabled,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

export function useSupervisorReportsV2(status?: string, enabled = true) {
  return useQuery({
    queryKey: ['v2', 'supervisor', 'reports', status ?? 'all'],
    queryFn: () => listSupervisorReportsV2Authed(status ? { status, limit: 50 } : { limit: 50 }),
    enabled,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

export function useSupervisorCleanersV2(search?: string, enabled = true) {
  return useQuery({
    queryKey: ['v2', 'supervisor', 'cleaners', search ?? ''],
    queryFn: () => listSupervisorCleanersV2(search),
    enabled,
    staleTime: 30_000,
  });
}

function invalidateSupervisor(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['v2', 'supervisor'] });
  queryClient.invalidateQueries({ queryKey: ['v2', 'cleaner'] });
  queryClient.invalidateQueries({ queryKey: ['v2', 'report'] });
  queryClient.invalidateQueries({ queryKey: ['reports'] });
  queryClient.invalidateQueries({ queryKey: ['myReports'] });
  queryClient.invalidateQueries({ queryKey: ['publicStatusBoard'] });
}

export function useAssignReportV2() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ reportId, body }: { reportId: string; body: { cleaner_user_id: string; expected_completion_at?: string; note?: string } }) =>
      assignSupervisorReportV2Authed(reportId, body),
    onSuccess: () => invalidateSupervisor(queryClient),
  });
}

export function useEndorseReportV2() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ reportId, note }: { reportId: string; note?: string }) =>
      endorseSupervisorReportV2Authed(reportId, note),
    onSuccess: () => invalidateSupervisor(queryClient),
  });
}

export function useRejectReportV2() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ reportId, reason }: { reportId: string; reason: string }) =>
      rejectSupervisorReportV2Authed(reportId, reason),
    onSuccess: () => invalidateSupervisor(queryClient),
  });
}

export function useVolunteerRequestsV2(status?: string, enabled = true) {
  return useQuery({
    queryKey: ['v2', 'supervisor', 'volunteer-requests', status ?? 'all'],
    queryFn: () => listVolunteerRequestsV2(status),
    enabled,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

export function useRejectVolunteerV2() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, reason }: { requestId: string; reason: string }) =>
      rejectVolunteerRequestV2(requestId, reason),
    onSuccess: () => invalidateSupervisor(queryClient),
  });
}

// ---- Reports ----

export function useReportDetailV2(reportId: string | null, enabled = true) {
  return useQuery({
    queryKey: ['v2', 'report', reportId],
    queryFn: () => getReportDetailV2(reportId!),
    enabled: enabled && !!reportId,
    staleTime: 10_000,
  });
}

// ---- Cleaner ----

export function useCleanerTasksV2(enabled = true) {
  return useQuery({
    queryKey: ['v2', 'cleaner', 'tasks'],
    queryFn: () => listCleanerTasksV2Authed({ limit: 100 }),
    enabled,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

export function useAvailableReportsV2(enabled = true) {
  return useQuery({
    queryKey: ['v2', 'cleaner', 'available'],
    queryFn: listAvailableReportsV2,
    enabled,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

export function useCleanerHistoryV2(enabled = true) {
  return useQuery({
    queryKey: ['v2', 'cleaner', 'history'],
    queryFn: listCleanerHistoryV2,
    enabled,
    staleTime: 15_000,
    refetchInterval: 30_000,
  });
}

function invalidateCleaner(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['v2', 'cleaner'] });
  queryClient.invalidateQueries({ queryKey: ['v2', 'report'] });
}

export function useCleanerTaskActionV2() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, action, body }: { taskId: string; action: 'accept' | 'reject' | 'start' | 'resolve'; body?: Record<string, unknown> }) =>
      mutateCleanerTaskV2Authed(taskId, action, body ?? {}),
    onSuccess: () => invalidateCleaner(queryClient),
  });
}

export function useRequestVolunteerV2() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ reportId, note }: { reportId: string; note?: string }) =>
      requestVolunteerV2(reportId, note),
    onSuccess: () => invalidateCleaner(queryClient),
  });
}

// ---- Admin (v2 role endpoints; only when signed in as admin-capable user) ----

export function useAdminUsersV2(search?: string, enabled = true) {
  return useQuery({
    queryKey: ['v2', 'admin', 'users', search ?? ''],
    queryFn: () => listAdminUsersV2Authed(search ? { search } : {}),
    enabled,
    staleTime: 15_000,
    retry: false,
  });
}

export function useAssignRoleV2() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: 'supervisor' | 'cleaner' }) =>
      assignAdminRoleV2Authed(userId, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['v2', 'admin'] }),
  });
}

// ---- Profile (v1 self-service) ----

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateProfileMeBody) => updateProfileMe(body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['v2', 'notifications'] });
    },
  });
}

// ---- Notifications ----

export function useNotificationsV2(limit = 20, enabled = true) {
  return useQuery({
    queryKey: ['v2', 'notifications', limit],
    queryFn: () => listNotificationsV2(limit),
    enabled,
    staleTime: 15_000,
    refetchInterval: 30_000,
    retry: false,
  });
}

export function useMarkNotificationReadV2() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (notificationId: string) => markNotificationReadV2(notificationId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['v2', 'notifications'] }),
  });
}
