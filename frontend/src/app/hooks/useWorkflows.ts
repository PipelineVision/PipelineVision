import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import { usePreference } from "@/app/contexts/PreferenceContext";

export interface Repository {
  id: number;
  name: string;
  full_name: string;
  owner: string;
}

export interface WorkflowStats {
  total_runs: number;
  successful_runs: number;
  failed_runs: number;
  success_rate: number;
  last_run_at?: string;
}

export interface Workflow {
  id: number;
  workflow_id: string;
  name: string;
  path: string;
  state: string;
  created_at: string;
  updated_at: string;
  repository?: Repository;
  stats: WorkflowStats;
  content?: string;
  description?: string;
  badge_url?: string;
}

export interface WorkflowsResponse {
  workflows: Workflow[];
  total: number;
  offset: number;
  limit: number;
}

export interface WorkflowsFilters {
  repository_name?: string;
  state?: string;
  offset?: number;
  limit?: number;
}

async function fetchWorkflows(
  filters: WorkflowsFilters = {}
): Promise<WorkflowsResponse> {
  const searchParams = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.append(key, value.toString());
    }
  });

  const response = await fetch(`/api/workflows?${searchParams.toString()}`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `HTTP ${response.status}: ${response.statusText}`
    );
  }

  return response.json();
}

export function useWorkflows(
  filters: WorkflowsFilters = {},
  options?: Partial<UseQueryOptions<WorkflowsResponse, Error>>
) {
  const { preference } = usePreference();

  return useQuery({
    queryKey: ["workflows", preference?.organization_id, filters],
    queryFn: () => fetchWorkflows(filters),
    enabled: !!preference?.organization_id,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // 1 minute
    ...options,
  });
}

export function useWorkflowsWithPagination(
  initialFilters: WorkflowsFilters = {}
) {
  const { preference } = usePreference();
  const [filters, setFilters] = useState<WorkflowsFilters>({
    offset: 0,
    limit: 50,
    ...initialFilters,
  });

  const query = useWorkflows(filters);

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

  const updateFilters = (newFilters: Partial<WorkflowsFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters, offset: 0 }));
  };

  const clearFilters = () => {
    setFilters({
      offset: 0,
      limit: 50,
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
    updateFilters,
    clearFilters,
  };
}

async function fetchWorkflowDetail(id: string): Promise<Workflow> {
  const response = await fetch(`/api/workflows/${id}`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `HTTP ${response.status}: ${response.statusText}`
    );
  }

  return response.json();
}

export function useWorkflowDetail(
  id: string,
  options?: Partial<UseQueryOptions<Workflow, Error>>
) {
  const { preference } = usePreference();

  return useQuery({
    queryKey: ["workflow", id, preference?.organization_id],
    queryFn: () => fetchWorkflowDetail(id),
    enabled: !!id && !!preference?.organization_id,
    staleTime: 30 * 1000, // 30 seconds
    ...options,
  });
}
