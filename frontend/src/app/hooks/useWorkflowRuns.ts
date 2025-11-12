import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import { usePreference } from "@/app/contexts/PreferenceContext";
import { useServerSentEvents } from "@/hooks/useServerSentEvents";

export interface Repository {
  id: number;
  name: string;
  full_name: string;
  owner: string;
}

export interface JobStep {
  id: number;
  step_number: number;
  name: string;
  status: string;
  conclusion?: string;
  started_at?: string;
  completed_at?: string;
}

export interface Job {
  id: number;
  job_id: string;
  job_name: string;
  status: string;
  conclusion?: string;
  started_at?: string;
  completed_at?: string;
  url: string;
  steps: JobStep[];
}

export interface WorkflowRun {
  id: number;
  run_id: string;
  run_attempt: number;
  run_number: number;
  workflow_name: string;
  event: string;
  status: string;
  conclusion?: string;
  head_branch?: string;
  head_sha: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
  url: string;
  repository?: Repository;
  jobs: Job[];
}

export interface WorkflowRunsResponse {
  workflow_runs: WorkflowRun[];
  total: number;
  offset: number;
  limit: number;
}

export interface WorkflowRunsFilters {
  status?: string;
  conclusion?: string;
  event?: string;
  workflow_name?: string;
  repository_name?: string;
  repository_full_name?: string;
  head_branch?: string;
  created_after?: string;
  created_before?: string;
  started_after?: string;
  started_before?: string;
  completed_after?: string;
  completed_before?: string;
  offset?: number;
  limit?: number;
  sort_by?: string;
  order?: string;
}

async function fetchWorkflowRuns(
  filters: WorkflowRunsFilters = {}
): Promise<WorkflowRunsResponse> {
  const searchParams = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.append(key, value.toString());
    }
  });

  const response = await fetch(`/api/workflow-runs?${searchParams.toString()}`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `HTTP ${response.status}: ${response.statusText}`
    );
  }

  return response.json();
}

async function fetchWorkflowRun(
  id: string,
  attempt?: number
): Promise<WorkflowRun> {
  const url =
    attempt !== undefined
      ? `/api/workflow-runs/${id}?run_attempt=${attempt}`
      : `/api/workflow-runs/${id}`;

  const response = await fetch(url);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `HTTP ${response.status}: ${response.statusText}`
    );
  }

  return response.json();
}

export function useWorkflowRuns(
  filters: WorkflowRunsFilters = {},
  options?: Partial<UseQueryOptions<WorkflowRunsResponse, Error>>
) {
  const { preference } = usePreference();
  const { isConnected, fallbackMode } = useServerSentEvents();

  const getRefetchInterval = () => {
    if (!fallbackMode && isConnected) {
      return 5 * 60 * 1000; // 5 minutes as backup
    }

    if (fallbackMode) {
      return 15 * 1000; // 15 seconds
    }

    return 60 * 1000; // 1 minute
  };

  return useQuery({
    queryKey: ["workflow-runs", preference?.organization_id, filters],
    queryFn: () => fetchWorkflowRuns(filters),
    enabled: !!preference?.organization_id,
    staleTime: isConnected ? 5 * 60 * 1000 : 30 * 1000,
    refetchInterval: getRefetchInterval(),
    refetchIntervalInBackground: fallbackMode,
    ...options,
  });
}

export function useWorkflowRun(
  id: string,
  attempt?: number,
  options?: Partial<UseQueryOptions<WorkflowRun, Error>>
) {
  const { preference } = usePreference();

  return useQuery({
    queryKey: ["workflow-run", preference?.organization_id, id, attempt],
    queryFn: () => fetchWorkflowRun(id, attempt),
    enabled: !!id && !!preference?.organization_id,
    staleTime: 30 * 1000,
    ...options,
  });
}

export function useWorkflowRunsWithPagination(
  initialFilters: WorkflowRunsFilters = {}
) {
  const { preference } = usePreference();
  const [filters, setFilters] = useState<WorkflowRunsFilters>({
    offset: 0,
    limit: 50,
    sort_by: "created_at",
    order: "desc",
    ...initialFilters,
  });

  const query = useWorkflowRuns(filters);

  const previousOrgId = useRef(preference?.organization_id);
  useEffect(() => {
    if (
      previousOrgId.current &&
      previousOrgId.current !== preference?.organization_id
    ) {
      setFilters((prev) => ({ ...prev, offset: 0 }));
    }
    previousOrgId.current = preference?.organization_id;
  }, [preference?.organization_id]);

  const setPage = (page: number) => {
    const limit = filters.limit || 50;
    setFilters((prev) => ({ ...prev, offset: page * limit }));
  };

  const setPageSize = (size: number) => {
    setFilters((prev) => ({ ...prev, limit: size, offset: 0 }));
  };

  const setSort = (sortBy: string, order: "asc" | "desc" = "desc") => {
    setFilters((prev) => ({ ...prev, sort_by: sortBy, order, offset: 0 }));
  };

  const updateFilters = (newFilters: Partial<WorkflowRunsFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters, offset: 0 }));
  };

  const clearFilters = () => {
    setFilters({
      offset: 0,
      limit: 50,
      sort_by: "created_at",
      order: "desc",
    });
  };

  const currentPage = Math.floor((filters.offset || 0) / (filters.limit || 50));
  const totalPages = Math.ceil(
    (query.data?.total || 0) / (filters.limit || 50)
  );

  return {
    ...query,
    filters,
    currentPage,
    totalPages,
    setPage,
    setPageSize,
    setSort,
    updateFilters,
    clearFilters,
  };
}
