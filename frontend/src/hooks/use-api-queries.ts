"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthenticatedFetch } from "./use-authenticated-fetch";

// Types for your API responses
interface Runner {
  id: string;
  name: string;
  status: "online" | "offline" | "busy";
  labels: string[];
  os: string;
  // Add other properties as needed
}

// React Query hook for fetching runners
export function useRunners() {
  const { authenticatedFetch, isAuthenticated } = useAuthenticatedFetch();

  return useQuery({
    queryKey: ["runners"],
    queryFn: async (): Promise<Runner[]> => {
      const response = await authenticatedFetch("/api/runner");
      return response.json();
    },
    enabled: isAuthenticated, // Only run when user is authenticated
    staleTime: 30 * 1000, // 30 seconds
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error instanceof Error && error.message === "Session expired") {
        return false;
      }
      return failureCount < 3;
    },
  });
}

// React Query hook for fetching a specific runner
export function useRunner(runnerId: string) {
  const { authenticatedFetch, isAuthenticated } = useAuthenticatedFetch();

  return useQuery({
    queryKey: ["runner", runnerId],
    queryFn: async (): Promise<Runner> => {
      const response = await authenticatedFetch(`/api/runner/${runnerId}`);
      return response.json();
    },
    enabled: isAuthenticated && !!runnerId,
  });
}

// Types for job responses
interface Job {
  id: number;
  job_id: string;
  job_name: string;
  workflow_name?: string;
  repository?: {
    id: number;
    name: string;
    full_name: string;
    owner: string;
  };
  runner?: {
    id: number;
    name: string;
    runner_id: string;
    labels?: string[];
  };
  status: string;
  conclusion?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  url: string;
  created_at: string;
  updated_at: string;
}

// React Query hook for fetching jobs
export function useJobs() {
  const { authenticatedFetch, isAuthenticated } = useAuthenticatedFetch();

  return useQuery({
    queryKey: ["jobs"],
    queryFn: async (): Promise<Job[]> => {
      const response = await authenticatedFetch("/api/jobs");
      return response.json();
    },
    enabled: isAuthenticated,
    staleTime: 30 * 1000, // 30 seconds
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error instanceof Error && error.message === "Session expired") {
        return false;
      }
      return failureCount < 3;
    },
  });
}

// React Query mutation for updating runner
export function useUpdateRunner() {
  const { authenticatedFetch } = useAuthenticatedFetch();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      runnerId,
      data,
    }: {
      runnerId: string;
      data: Partial<Runner>;
    }) => {
      const response = await authenticatedFetch(`/api/runner/${runnerId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      return response.json();
    },
    onSuccess: (data, { runnerId }) => {
      // Invalidate and refetch runners list
      queryClient.invalidateQueries({ queryKey: ["runners"] });
      // Update the specific runner cache
      queryClient.setQueryData(["runner", runnerId], data);
    },
    onError: (error: Error) => {
      console.error("Failed to update runner:", error);
    },
  });
}

// React Query hook for account/user info
export function useAccount() {
  const { authenticatedFetch, isAuthenticated, user } = useAuthenticatedFetch();

  return useQuery({
    queryKey: ["account", user?.id],
    queryFn: async () => {
      const response = await authenticatedFetch("/api/account");
      return response.json();
    },
    enabled: isAuthenticated,
    staleTime: 5 * 60 * 1000, // 5 minutes - user data doesn't change often
  });
}

// TODO: Do we need the stale time?
export function useOrganizationMemberships() {
  const { authenticatedFetch, isAuthenticated, user } = useAuthenticatedFetch();

  return useQuery({
    queryKey: ["org-memberships", user?.id],
    queryFn: async () => {
      const response = await authenticatedFetch("/api/account/memberships");
      return response.json();
    },
    enabled: isAuthenticated,
  });
}
