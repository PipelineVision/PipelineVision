"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthenticatedFetch } from "@/hooks/use-authenticated-fetch";

export interface JobLog {
  id: number;
  job_id: number;
  step_number: number | null;
  line_number: number;
  timestamp: string;
  content: string;
  created_at: string;
}

export interface JobLogStreamResponse {
  logs: JobLog[];
  total_lines: number;
  from_line: number;
  is_complete: boolean;
  job_status: string;
}

export interface JobLogRawResponse {
  content: string;
  total_lines: number;
  job_name: string;
  job_status: string;
}

export interface JobStep {
  id: number;
  step_number: number;
  job_id: number;
  name: string;
  status: string;
  conclusion?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface JobLogsFilters {
  step_number?: number;
  line_start?: number;
  line_end?: number;
  limit?: number;
}

export function useJobLogs(jobId: string, filters?: JobLogsFilters) {
  const { authenticatedFetch, isAuthenticated } = useAuthenticatedFetch();

  return useQuery({
    queryKey: ["job-logs", jobId, filters],
    queryFn: async (): Promise<JobLog[]> => {
      const params = new URLSearchParams();
      if (filters?.step_number !== undefined) {
        params.set("step_number", filters.step_number.toString());
      }
      if (filters?.line_start !== undefined) {
        params.set("line_start", filters.line_start.toString());
      }
      if (filters?.line_end !== undefined) {
        params.set("line_end", filters.line_end.toString());
      }
      if (filters?.limit !== undefined) {
        params.set("limit", filters.limit.toString());
      }

      const queryString = params.toString();
      const url = `/api/logs/jobs/${jobId}${
        queryString ? `?${queryString}` : ""
      }`;

      const response = await authenticatedFetch(url);
      const data = await response.json();

      return data;
    },
    enabled: isAuthenticated && !!jobId,
    staleTime: 15 * 1000, // 15 seconds
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message === "Session expired") {
        return false;
      }
      return failureCount < 3;
    },
  });
}

// TODO: Needs to be reworked. Stream gets messed up sometiems with SSE connection issues. Might be relatd to the redis issue
export function useJobLogsStream(jobId: string, fromLine: number = 0) {
  const { authenticatedFetch, isAuthenticated } = useAuthenticatedFetch();

  return useQuery({
    queryKey: ["job-logs-stream", jobId, fromLine],
    queryFn: async (): Promise<JobLogStreamResponse> => {
      const response = await authenticatedFetch(
        `/api/logs/jobs/${jobId}/stream?from_line=${fromLine}`
      );
      return response.json();
    },
    enabled: isAuthenticated && !!jobId,
    refetchInterval: (data) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data as any)?.data?.is_complete === false ? 2000 : false;
    },
    staleTime: 1000,
    retry: false,
  });
}

export function useJobLogsRaw(jobId: string) {
  const { authenticatedFetch, isAuthenticated } = useAuthenticatedFetch();

  return useQuery({
    queryKey: ["job-logs-raw", jobId],
    queryFn: async (): Promise<JobLogRawResponse> => {
      const response = await authenticatedFetch(`/api/logs/jobs/${jobId}/raw`);
      return response.json();
    },
    enabled: isAuthenticated && !!jobId,
    staleTime: 60 * 1000, // 1 minute
  });
}

export function useRefreshJobLogs() {
  const { authenticatedFetch } = useAuthenticatedFetch();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jobId: string) => {
      const response = await authenticatedFetch(
        `/api/logs/jobs/${jobId}/refresh`,
        {
          method: "POST",
        }
      );
      return response.json();
    },
    onSuccess: (jobId) => {
      queryClient.invalidateQueries({ queryKey: ["job-logs", jobId] });
      queryClient.invalidateQueries({ queryKey: ["job-logs-stream", jobId] });
      queryClient.invalidateQueries({ queryKey: ["job-logs-raw", jobId] });
    },
  });
}

export function useJobSteps(jobId: string) {
  const { authenticatedFetch, isAuthenticated } = useAuthenticatedFetch();

  return useQuery({
    queryKey: ["job-steps", jobId],
    queryFn: async (): Promise<JobStep[]> => {
      const response = await authenticatedFetch(`/api/jobs/${jobId}/steps`);
      return response.json();
    },
    enabled: isAuthenticated && !!jobId,
    staleTime: 60 * 1000, // 1 minute
  });
}
