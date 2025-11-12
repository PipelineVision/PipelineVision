import { useQuery, UseQueryOptions } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";
import { usePreference } from "@/app/contexts/PreferenceContext";

export interface Repository {
  id: number;
  name: string;
  full_name: string;
  owner: string;
}

export interface Runner {
  id: number;
  name: string;
  runner_id: string;
  labels?: string[];
}

export interface Job {
  id: number;
  job_id: string;
  job_name: string;
  workflow_name?: string;
  repository?: Repository;
  runner?: Runner;
  status: string;
  conclusion?: string | null;
  started_at?: string | null;
  completed_at?: string | null;
  url: string;
  created_at: string;
  updated_at: string;
}

export interface JobsResponse {
  jobs: Job[];
  total: number;
  offset: number;
  limit: number;
}

export interface JobsFilters {
  status?: string;
  workflow_name?: string;
  repository_name?: string;
  repository_full_name?: string;
  started_after?: string;
  started_before?: string;
  completed_after?: string;
  completed_before?: string;
  offset?: number;
  limit?: number;
}

async function fetchJobs(filters: JobsFilters = {}): Promise<JobsResponse> {
  const searchParams = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      searchParams.append(key, value.toString());
    }
  });

  const response = await fetch(`/api/jobs?${searchParams.toString()}`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `HTTP ${response.status}: ${response.statusText}`
    );
  }

  const jobs = await response.json();

  const offset = filters.offset || 0;
  const limit = filters.limit || 50;
  const total = jobs.length;
  const paginatedJobs = jobs.slice(offset, offset + limit);

  return {
    jobs: paginatedJobs,
    total,
    offset,
    limit,
  };
}

export function useJobs(
  filters: JobsFilters = {},
  options?: Partial<UseQueryOptions<JobsResponse, Error>>
) {
  const { preference } = usePreference();

  return useQuery({
    queryKey: ["jobs", preference?.organization_id, filters],
    queryFn: () => fetchJobs(filters),
    enabled: !!preference?.organization_id,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // 1 minute
    ...options,
  });
}

export function useJobsWithPagination(initialFilters: JobsFilters = {}) {
  const { preference } = usePreference();
  const [filters, setFilters] = useState<JobsFilters>({
    offset: 0,
    limit: 50,
    ...initialFilters,
  });

  const query = useJobs(filters);

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

  const updateFilters = (newFilters: Partial<JobsFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters, offset: 0 }));
  };

  const updateSearchFilters = (newFilters: Partial<JobsFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
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
    updateSearchFilters,
    clearFilters,
  };
}

async function fetchJobDetail(id: string): Promise<Job> {
  const response = await fetch(`/api/jobs/${id}`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(
      errorData.error || `HTTP ${response.status}: ${response.statusText}`
    );
  }

  return response.json();
}

export function useJobDetail(
  id: string,
  options?: Partial<UseQueryOptions<Job, Error>>
) {
  const { preference } = usePreference();

  return useQuery({
    queryKey: ["job", id, preference?.organization_id],
    queryFn: () => fetchJobDetail(id),
    enabled: !!id && !!preference?.organization_id,
    staleTime: 30 * 1000, // 30 seconds
    ...options,
  });
}
