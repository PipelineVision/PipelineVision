"use client";

import React, { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  Search,
  RefreshCw,
  Terminal,
  Github,
  Clock,
  Calendar,
  Activity,
  GitBranch,
  CheckCircle,
  XCircle,
  Play,
} from "lucide-react";
import Link from "next/link";

import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useJobsWithPagination, Job } from "@/app/hooks/useJobs";

function getStatusIcon(
  status: string,
  conclusion?: string | null,
  className?: string
) {
  if (status === "in_progress") {
    return <Play className={`${className || "h-4 w-4"} text-blue-500`} />;
  }
  if (status === "queued") {
    return <Clock className={`${className || "h-4 w-4"} text-yellow-500`} />;
  }
  if (status === "completed") {
    if (conclusion === "success") {
      return (
        <CheckCircle className={`${className || "h-4 w-4"} text-green-500`} />
      );
    }
    if (conclusion === "failure") {
      return <XCircle className={`${className || "h-4 w-4"} text-red-500`} />;
    }
    if (conclusion === "cancelled") {
      return <XCircle className={`${className || "h-4 w-4"} text-gray-500`} />;
    }
  }
  return <Activity className={`${className || "h-4 w-4"} text-gray-500`} />;
}

function getStatusBadge(status: string, conclusion?: string | null) {
  if (status === "in_progress") {
    return (
      <Badge className="bg-blue-500/10 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400">
        In Progress
      </Badge>
    );
  }
  if (status === "queued") {
    return (
      <Badge className="bg-yellow-500/10 text-yellow-600 dark:bg-yellow-900/20 dark:text-yellow-400">
        Queued
      </Badge>
    );
  }
  if (status === "completed") {
    if (conclusion === "success") {
      return (
        <Badge className="bg-green-500/10 text-green-600 dark:bg-green-900/20 dark:text-green-400">
          Success
        </Badge>
      );
    }
    if (conclusion === "failure") {
      return (
        <Badge className="bg-red-500/10 text-red-600 dark:bg-red-900/20 dark:text-red-400">
          Failed
        </Badge>
      );
    }
    if (conclusion === "cancelled") {
      return (
        <Badge className="bg-gray-500/10 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400">
          Cancelled
        </Badge>
      );
    }
  }
  return <Badge variant="outline">{status}</Badge>;
}

function formatDuration(startTime?: string, endTime?: string) {
  if (!startTime || !endTime) return "—";

  const start = new Date(startTime);
  const end = new Date(endTime);
  const diff = end.getTime() - start.getTime();

  const minutes = Math.floor(diff / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

interface VirtualizedTableProps {
  jobs: Job[];
}

function VirtualizedTable({ jobs }: VirtualizedTableProps) {
  const parentRef = React.useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: jobs.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
    overscan: 5,
  });

  return (
    <div className="relative">
      <div className="sticky top-0 bg-background z-10 border-b">
        <div className="grid grid-cols-8 gap-4 px-4 py-3 text-sm font-medium text-muted-foreground">
          <div>Job</div>
          <div>Workflow</div>
          <div>Repository</div>
          <div>Status</div>
          <div>Duration</div>
          <div>Started</div>
          <div>Runner</div>
          <div className="w-[100px]"></div>
        </div>
      </div>

      <div
        ref={parentRef}
        className="h-[600px] overflow-auto"
        style={{
          contain: "strict",
        }}
      >
        <div
          style={{
            height: `${virtualizer.getTotalSize()}px`,
            width: "100%",
            position: "relative",
          }}
        >
          {virtualizer.getVirtualItems().map((virtualItem) => {
            const job = jobs[virtualItem.index];
            return (
              <div
                key={virtualItem.key}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
                className="border-b hover:bg-muted/30 cursor-pointer"
              >
                <div className="grid grid-cols-8 gap-4 px-4 py-3 items-center">
                  <div className="font-medium">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(job.status, job.conclusion, "h-4 w-4")}
                      <div>
                        <div className="font-medium">{job.job_name}</div>
                        <div className="text-xs text-muted-foreground">
                          #{job.job_id}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="font-mono text-sm">
                      {job.workflow_name || "—"}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <GitBranch className="h-4 w-4 text-muted-foreground" />
                      <div className="font-mono text-sm">
                        {job.repository?.full_name || "—"}
                      </div>
                    </div>
                  </div>

                  <div>{getStatusBadge(job.status, job.conclusion)}</div>

                  <div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">
                        {formatDuration(
                          job.started_at || undefined,
                          job.completed_at || undefined
                        )}
                      </span>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      <span className="text-sm">
                        {job.started_at
                          ? formatDistanceToNow(new Date(job.started_at), {
                              addSuffix: true,
                            })
                          : "—"}
                      </span>
                    </div>
                  </div>

                  <div>
                    {job.runner?.name ? (
                      <Badge variant="outline" className="text-xs">
                        {job.runner.name}
                      </Badge>
                    ) : (
                      "—"
                    )}
                  </div>

                  <div>
                    <div className="flex items-center gap-1">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/jobs/${job.id}/logs`}>
                          <Terminal className="h-4 w-4" />
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(job.url, "_blank");
                        }}
                      >
                        <Github className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function JobsTable({ className }: { className?: string }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [repositoryFilter, setRepositoryFilter] = useState<string>("");

  const {
    data,
    isLoading,
    error,
    refetch,
    filters,
    currentPage,
    totalPages,
    setPage,
    setPageSize,
    updateSearchFilters,
    clearFilters,
  } = useJobsWithPagination();

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updateSearchFilters({
        status: statusFilter || undefined,
        repository_name: repositoryFilter || undefined,
        workflow_name: searchTerm || undefined,
      });
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, statusFilter, repositoryFilter, updateSearchFilters]);

  const jobs = data?.jobs || [];

  const handleStatusChange = (value: string) => {
    setStatusFilter(value === "all" ? "" : value);
  };

  const handleRepositoryChange = (value: string) => {
    setRepositoryFilter(value === "all" ? "" : value);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setRepositoryFilter("");
    clearFilters();
  };

  if (error) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <p className="text-destructive mb-2">Failed to load jobs</p>
          <p className="text-sm text-muted-foreground mb-4">{error.message}</p>
          <Button onClick={() => refetch()}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search jobs, workflows, or repositories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Select
            value={statusFilter || "all"}
            onValueChange={handleStatusChange}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="queued">Queued</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={repositoryFilter || "all"}
            onValueChange={handleRepositoryChange}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Repository" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Repositories</SelectItem>
              {/* TODO: Add dynamic repository list */}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button onClick={handleClearFilters} variant="outline" size="sm">
            Clear
          </Button>
          <Button onClick={() => refetch()} variant="outline" size="sm">
            <RefreshCw
              className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
          </Button>
        </div>
      </div>

      <div className="border rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-4">
            {Array.from({ length: 10 }).map((_, index) => (
              <div
                key={index}
                className="h-4 bg-muted animate-pulse rounded mb-2"
              />
            ))}
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-8">
            <div className="flex flex-col items-center gap-2">
              <Terminal className="h-12 w-12 text-muted-foreground/50" />
              <p className="text-muted-foreground">No jobs found</p>
            </div>
          </div>
        ) : (
          <VirtualizedTable jobs={jobs} />
        )}
      </div>

      {data && data.total > 0 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">
            Showing {(filters.offset || 0) + 1} to{" "}
            {Math.min(
              (filters.offset || 0) + (filters.limit || 50),
              data.total
            )}{" "}
            of {data.total} jobs
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Select
                value={filters.limit?.toString() || "50"}
                onValueChange={(value) => setPageSize(Number(value))}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(currentPage - 1)}
                disabled={currentPage === 0}
              >
                Previous
              </Button>

              <span className="text-sm">
                Page {currentPage + 1} of {totalPages}
              </span>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(currentPage + 1)}
                disabled={currentPage >= totalPages - 1}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function JobsPage() {
  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Jobs</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Jobs</h1>
            <p className="text-muted-foreground">
              View and monitor all workflow jobs and their execution logs
            </p>
          </div>

          <JobsTable />
        </div>
      </div>
    </SidebarInset>
  );
}
