import { useQuery } from "@tanstack/react-query";
import { useAuthenticatedFetch } from "@/hooks/use-authenticated-fetch";
import { usePreference } from "../contexts/PreferenceContext";

export interface RunnerLabel {
  id: string;
  name: string;
  type: string;
}

export interface Runner {
  id: number;
  installation_id: number;
  runner_id: number;
  name: string;
  os?: string;
  busy: boolean;
  ephemeral?: boolean;
  status: string;
  labels: RunnerLabel[];
  architecture?: string;
  last_seen: string;
  created_at: string;
  updated_at: string;
  last_check: string;
}

export interface RunnersResponse {
  total_runners: number;
  runners: Runner[];
  online: number;
  offline: number;
  busy: number;
}

export function useRunners() {
  const { authenticatedFetch, isAuthenticated } = useAuthenticatedFetch();
  const { preference } = usePreference();

  return useQuery({
    queryKey: ["runners", preference?.organization_id],
    queryFn: async (): Promise<RunnersResponse> => {
      const response = await authenticatedFetch("/api/orgs/runners");
      if (!response.ok) {
        throw new Error(`Failed to fetch runners: ${response.statusText}`);
      }
      return response.json();
    },
    enabled: isAuthenticated && !!preference?.organization_id,
    refetchInterval: 30 * 1000, // 30 seconds
    staleTime: 15 * 1000, // 15 seconds
    retry: (failureCount, error) => {
      if (error instanceof Error && error.message === "Session expired") {
        return false;
      }
      return failureCount < 3;
    },
  });
}

export function useRunnerStats() {
  return useRunners();
}
