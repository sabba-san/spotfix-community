import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getPublicStatusBoard,
  getMyReports,
  createReport,
  updateReport,
  listReports,
  listCleaners,
  assignCleaner,
  listUsers,
} from '@/design-revamp/lib/api';

export function usePublicStatusBoard() {
  return useQuery({
    queryKey: ['publicStatusBoard'],
    queryFn: getPublicStatusBoard,
    staleTime: 30_000,
  });
}

export function useMyReports(userId: string | undefined) {
  return useQuery({
    queryKey: ['myReports', userId],
    queryFn: () => getMyReports(userId!),
    enabled: !!userId,
    staleTime: 15_000,
  });
}

export function useReports() {
  return useQuery({
    queryKey: ['reports'],
    queryFn: listReports,
    staleTime: 15_000,
  });
}

export function useSubmitReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createReport,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myReports'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['publicStatusBoard'] });
    },
  });
}

export function useUpdateReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ reportId, body }: { reportId: string; body: Record<string, unknown> }) =>
      updateReport(reportId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myReports'] });
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['publicStatusBoard'] });
    },
  });
}

export function useReportStatusMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ reportId, status, resolutionPhoto }: {
      reportId: string;
      status: string;
      resolutionPhoto?: string;
    }) => updateReport(reportId, { status, resolutionPhoto }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['myReports'] });
      queryClient.invalidateQueries({ queryKey: ['publicStatusBoard'] });
    },
  });
}

export function useCleaners(query: Record<string, string> = {}) {
  return useQuery({
    queryKey: ['cleaners', query],
    queryFn: () => listCleaners(query),
    staleTime: 15_000,
  });
}

export function useAssignCleaner() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ cleanerId, reportId }: { cleanerId: string; reportId: string }) =>
      assignCleaner(cleanerId, reportId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reports'] });
      queryClient.invalidateQueries({ queryKey: ['cleaners'] });
      queryClient.invalidateQueries({ queryKey: ['publicStatusBoard'] });
    },
  });
}

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: listUsers,
    staleTime: 30_000,
  });
}
