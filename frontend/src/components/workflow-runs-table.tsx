"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  RefreshCw,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  PlayCircle,
  Github,
  Zap,
  Activity,
  CheckCircle,
  GitBranch,
  Server,
  Timer,
  Clock,
} from "lucide-react";
import { formatDuration, formatRelativeTime } from "@/lib/date-utils";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  useWorkflowRunsWithPagination,
  WorkflowRunsFilters,
} from "@/app/hooks/useWorkflowRuns";
import { WorkflowRunDetails } from "@/components/workflow-run-details";

const STATUS_COLORS = {
  queued: "secondary",
  in_progress: "default",
  completed: "outline",
} as const;

const CONCLUSION_COLORS = {
  success: "default",
  failure: "destructive",
  cancelled: "secondary",
  skipped: "secondary",
  neutral: "outline",
  timed_out: "destructive",
} as const;

function getStatusBadge(status: string) {
  const variant =
    STATUS_COLORS[status as keyof typeof STATUS_COLORS] || "outline";
  return <Badge variant={variant}>{status.replace("_", " ")}</Badge>;
}

function getConclusionBadge(conclusion?: string) {
  if (!conclusion) return null;
  const variant =
    CONCLUSION_COLORS[conclusion as keyof typeof CONCLUSION_COLORS] ||
    "outline";
  return <Badge variant={variant}>{conclusion}</Badge>;
}

interface WorkflowRunsTableProps {
  className?: string;
  initialFilters?: WorkflowRunsFilters;
}

export function WorkflowRunsTable({
  className,
  initialFilters = {},
}: WorkflowRunsTableProps) {
  const [searchTerm, setSearchTerm] = useState(
    initialFilters.workflow_name || ""
  );
  const [statusFilter, setStatusFilter] = useState<string>(
    initialFilters.status || ""
  );
  const [conclusionFilter, setConclusionFilter] = useState<string>(
    initialFilters.conclusion || ""
  );
  const [eventFilter, setEventFilter] = useState<string>(
    initialFilters.event || ""
  );
  const [selectedRun, setSelectedRun] = useState<{
    runId: string;
    attempt: number;
  } | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

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
    updateFilters,
    clearFilters,
  } = useWorkflowRunsWithPagination(initialFilters);

  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
    setConclusionFilter("");
    setEventFilter("");
    clearFilters();
  };

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updateFilters({
        workflow_name: searchTerm || undefined,
        status: statusFilter || undefined,
        conclusion: conclusionFilter || undefined,
        event: eventFilter || undefined,
      });
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchTerm, statusFilter, conclusionFilter, eventFilter, updateFilters]);

  // Handle filter changes (useEffect will apply them with debounce)
  const handleStatusChange = (value: string) => {
    const newStatus = value === "all" ? "" : value;
    setStatusFilter(newStatus);
  };

  const handleConclusionChange = (value: string) => {
    const newConclusion = value === "all" ? "" : value;
    setConclusionFilter(newConclusion);
  };

  const handleEventChange = (value: string) => {
    const newEvent = value === "all" ? "" : value;
    setEventFilter(newEvent);
  };

  const handleRunClick = (runId: string, attempt: number) => {
    setSelectedRun({ runId, attempt });
    setDetailsOpen(true);
  };

  const handleCloseDetails = () => {
    setDetailsOpen(false);
    setSelectedRun(null);
  };

  if (error) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <p className="text-destructive mb-2">Failed to load workflow runs</p>
          <p className="text-sm text-muted-foreground mb-4">{error.message}</p>
          <Button onClick={() => refetch()}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Enhanced Filters */}
      <div className="relative p-6 mb-6 bg-gradient-to-br from-card via-card to-muted/5 rounded-xl border border-border/50 shadow-sm">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.01] via-transparent to-secondary/[0.01] pointer-events-none rounded-xl" />
        <div className="relative flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors duration-200" />
              <Input
                placeholder="Search workflows..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-background/50 border-border/50 focus:border-primary/50 focus:bg-background transition-all duration-200"
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Select
              value={statusFilter || "all"}
              onValueChange={handleStatusChange}
            >
              <SelectTrigger className="w-[130px] bg-background/50 border-border/50 hover:border-primary/50 transition-colors duration-200">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="queued">Queued</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={conclusionFilter || "all"}
              onValueChange={handleConclusionChange}
            >
              <SelectTrigger className="w-[130px] bg-background/50 border-border/50 hover:border-primary/50 transition-colors duration-200">
                <SelectValue placeholder="Result" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Results</SelectItem>
                <SelectItem value="success">Success</SelectItem>
                <SelectItem value="failure">Failure</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="skipped">Skipped</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={eventFilter || "all"}
              onValueChange={handleEventChange}
            >
              <SelectTrigger className="w-[130px] bg-background/50 border-border/50 hover:border-primary/50 transition-colors duration-200">
                <SelectValue placeholder="Event" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                <SelectItem value="push">Push</SelectItem>
                <SelectItem value="pull_request">Pull Request</SelectItem>
                <SelectItem value="schedule">Schedule</SelectItem>
                <SelectItem value="workflow_dispatch">Manual</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleClearFilters}
              variant="outline"
              size="sm"
              className="bg-background/50 border-border/50 hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-all duration-200"
            >
              Clear
            </Button>
            <Button
              onClick={() => refetch()}
              variant="outline"
              size="sm"
              className="bg-background/50 border-border/50 hover:bg-primary/10 hover:border-primary/30 hover:text-primary transition-all duration-200"
            >
              <RefreshCw
                className={`h-4 w-4 transition-transform duration-200 ${
                  isLoading ? "animate-spin" : ""
                }`}
              />
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <div
          className="overflow-y-auto"
          style={{
            height: "clamp(400px, calc(100vh - 350px), 800px)",
            minWidth: "1200px",
          }}
        >
          <Table
            className="w-full"
            style={{ tableLayout: "fixed", minWidth: "1200px" }}
          >
            <TableHeader className="sticky top-0 z-10">
              <TableRow className="bg-muted/50 border-b">
                <TableHead className="font-semibold py-4 min-w-[200px] w-1/5">
                  <div className="flex items-center gap-2">
                    <PlayCircle className="h-4 w-4 text-muted-foreground" />
                    Workflow
                  </div>
                </TableHead>
                <TableHead className="font-semibold py-4 min-w-[150px] w-[15%]">
                  <div className="flex items-center gap-2">
                    <Github className="h-4 w-4 text-muted-foreground" />
                    Repository
                  </div>
                </TableHead>
                <TableHead className="font-semibold py-4 min-w-[100px] w-[10%]">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-muted-foreground" />
                    Event
                  </div>
                </TableHead>
                <TableHead className="font-semibold py-4 min-w-[80px] w-[8%]">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-muted-foreground" />
                    Status
                  </div>
                </TableHead>
                <TableHead className="font-semibold py-4 min-w-[80px] w-[8%]">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    Result
                  </div>
                </TableHead>
                <TableHead className="font-semibold py-4 min-w-[120px] w-[12%]">
                  <div className="flex items-center gap-2">
                    <GitBranch className="h-4 w-4 text-muted-foreground" />
                    Branch
                  </div>
                </TableHead>
                <TableHead className="font-semibold py-4 min-w-[150px] w-[15%]">
                  <div className="flex items-center gap-2">
                    <Server className="h-4 w-4 text-muted-foreground" />
                    Jobs
                  </div>
                </TableHead>
                <TableHead className="font-semibold py-4 min-w-[80px] w-[8%]">
                  <div className="flex items-center gap-2">
                    <Timer className="h-4 w-4 text-muted-foreground" />
                    Duration
                  </div>
                </TableHead>
                <TableHead className="font-semibold py-4 min-w-[100px] w-[10%]">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    Started
                  </div>
                </TableHead>
                <TableHead className="w-[60px] min-w-[60px] py-4"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 10 }).map((_, index) => (
                  <TableRow key={`loading-${index}`} className="animate-pulse">
                    <TableCell className="py-4">
                      <div className="space-y-2">
                        <div className="h-4 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-lg animate-pulse" />
                        <div
                          className="h-3 bg-gradient-to-r from-muted/70 via-muted/30 to-muted/70 rounded-md animate-pulse"
                          style={{ animationDelay: "0.1s" }}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="space-y-2">
                        <div
                          className="h-4 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-lg animate-pulse"
                          style={{ animationDelay: "0.2s" }}
                        />
                        <div
                          className="h-3 bg-gradient-to-r from-muted/70 via-muted/30 to-muted/70 rounded-md animate-pulse"
                          style={{ animationDelay: "0.3s" }}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div
                        className="h-6 w-16 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-full animate-pulse"
                        style={{ animationDelay: "0.4s" }}
                      />
                    </TableCell>
                    <TableCell className="py-4">
                      <div
                        className="h-6 w-20 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-full animate-pulse"
                        style={{ animationDelay: "0.5s" }}
                      />
                    </TableCell>
                    <TableCell className="py-4">
                      <div
                        className="h-6 w-18 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-full animate-pulse"
                        style={{ animationDelay: "0.6s" }}
                      />
                    </TableCell>
                    <TableCell className="py-4">
                      <div
                        className="h-4 w-24 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-lg animate-pulse"
                        style={{ animationDelay: "0.7s" }}
                      />
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex gap-1">
                        {Array.from({ length: 3 }).map((_, jobIndex) => (
                          <div
                            key={jobIndex}
                            className="h-5 w-12 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-full animate-pulse"
                            style={{
                              animationDelay: `${0.8 + jobIndex * 0.1}s`,
                            }}
                          />
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div
                        className="h-4 w-16 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-lg animate-pulse"
                        style={{ animationDelay: "1.1s" }}
                      />
                    </TableCell>
                    <TableCell className="py-4">
                      <div
                        className="h-3 w-20 bg-gradient-to-r from-muted via-muted/50 to-muted rounded-md animate-pulse"
                        style={{ animationDelay: "1.2s" }}
                      />
                    </TableCell>
                    <TableCell className="py-4">
                      <div
                        className="h-6 w-6 bg-gradient-to-r from-muted via-muted/50 to-muted rounded animate-pulse"
                        style={{ animationDelay: "1.3s" }}
                      />
                    </TableCell>
                  </TableRow>
                ))
              ) : data?.workflow_runs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-8">
                    <p className="text-muted-foreground">
                      No workflow runs found
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                data?.workflow_runs.map((run) => (
                  <TableRow
                    key={`${run.run_id}-${run.run_attempt}`}
                    className="group cursor-pointer hover:bg-muted/30 transition-colors duration-200"
                    onClick={() => handleRunClick(run.run_id, run.run_attempt)}
                  >
                    <TableCell className="py-4">
                      <div className="flex flex-col gap-2">
                        <span className="font-semibold text-foreground group-hover:text-primary transition-colors duration-200">
                          {run.workflow_name}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-muted-foreground bg-muted/50 px-2 py-1 rounded">
                            #{run.run_number}
                          </span>
                          {run.run_attempt > 1 && (
                            <Badge
                              variant="secondary"
                              className="h-5 text-xs px-2"
                            >
                              <Timer className="h-3 w-3 mr-1" />
                              Attempt {run.run_attempt}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <Github className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-sm">
                            {run.repository?.name || "—"}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground font-mono">
                          {run.repository?.owner}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge variant="secondary" className="text-xs">
                        <Zap className="h-3 w-3 mr-1" />
                        {run.event.replace("_", " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4">
                      {getStatusBadge(run.status)}
                    </TableCell>
                    <TableCell className="py-4">
                      {getConclusionBadge(run.conclusion)}
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-2">
                        <GitBranch className="h-4 w-4 text-muted-foreground" />
                        <code className="text-sm font-mono bg-muted/50 px-2 py-1 rounded">
                          {run.head_branch || "—"}
                        </code>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex gap-1 flex-wrap max-w-xs">
                        {run.jobs.slice(0, 3).map((job) => (
                          <Badge
                            key={job.id}
                            variant={
                              job.status === "completed"
                                ? job.conclusion === "success"
                                  ? "default"
                                  : "destructive"
                                : "secondary"
                            }
                            className="text-xs"
                          >
                            <Server className="h-3 w-3 mr-1" />
                            {job.job_name.length > 8
                              ? job.job_name.substring(0, 8) + "..."
                              : job.job_name}
                          </Badge>
                        ))}
                        {run.jobs.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{run.jobs.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-2">
                        <Timer className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-mono">
                          {formatDuration(run.started_at, run.completed_at)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{formatRelativeTime(run.started_at)}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(run.url, "_blank");
                        }}
                        className="h-8 w-8 p-0"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Pagination */}
      {data && data.total > 0 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">
            Showing {data.offset + 1} to{" "}
            {Math.min(data.offset + data.limit, data.total)} of {data.total}{" "}
            workflow runs
          </div>

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
              <ChevronLeft className="h-4 w-4" />
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
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Workflow Run Details Sheet */}
      <WorkflowRunDetails
        runId={selectedRun?.runId || null}
        runAttempt={selectedRun?.attempt}
        open={detailsOpen}
        onClose={handleCloseDetails}
      />
    </div>
  );
}
