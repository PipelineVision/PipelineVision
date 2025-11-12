"use client";

import React from "react";
import {
  formatDuration,
  formatRelativeTime,
  formatToLocalTime,
} from "@/lib/date-utils";
import {
  Calendar,
  Clock,
  ExternalLink,
  GitBranch,
  Hash,
  Play,
  CheckCircle,
  XCircle,
  AlertCircle,
  Circle,
  ChevronDown,
  ChevronRight,
  Timer,
  Activity,
  GitCommit,
  Zap,
  Loader2,
  Terminal,
} from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

// Simple collapsible implementation
interface CollapsibleProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

function Collapsible({ children }: CollapsibleProps) {
  return <div>{children}</div>;
}

interface CollapsibleTriggerProps {
  asChild?: boolean;
  children: React.ReactElement;
  onClick?: () => void;
}

function CollapsibleTrigger({
  asChild,
  children,
  onClick,
}: CollapsibleTriggerProps) {
  if (asChild && React.isValidElement(children)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return React.cloneElement(children as React.ReactElement<any>, { onClick });
  }
  return <div onClick={onClick}>{children}</div>;
}

interface CollapsibleContentProps {
  children: React.ReactNode;
  open: boolean;
}

function CollapsibleContent({ children, open }: CollapsibleContentProps) {
  if (!open) return null;
  return <div>{children}</div>;
}

import {
  useWorkflowRun,
  type Job,
  type JobStep,
} from "@/app/hooks/useWorkflowRuns";

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

function getStatusIcon(
  status: string,
  conclusion?: string,
  className = "h-5 w-5"
) {
  if (status === "completed") {
    switch (conclusion) {
      case "success":
        return <CheckCircle className={`${className} text-green-500`} />;
      case "failure":
        return <XCircle className={`${className} text-red-500`} />;
      case "cancelled":
        return <AlertCircle className={`${className} text-yellow-500`} />;
      case "skipped":
        return <Circle className={`${className} text-gray-400`} />;
      default:
        return <Circle className={`${className} text-gray-400`} />;
    }
  } else if (status === "in_progress") {
    return <Loader2 className={`${className} text-blue-500 animate-spin`} />;
  } else if (status === "queued") {
    return <Clock className={`${className} text-orange-500`} />;
  } else {
    return <Circle className={`${className} text-gray-400`} />;
  }
}

function getStepStatusIcon(
  status: string,
  conclusion?: string,
  className = "h-4 w-4"
) {
  if (status === "completed") {
    switch (conclusion) {
      case "success":
        return <CheckCircle className={`${className} text-green-500`} />;
      case "failure":
        return <XCircle className={`${className} text-red-500`} />;
      case "cancelled":
        return <AlertCircle className={`${className} text-yellow-500`} />;
      case "skipped":
        return <Circle className={`${className} text-gray-400`} />;
      default:
        return <Circle className={`${className} text-gray-400`} />;
    }
  } else if (status === "in_progress") {
    return <Loader2 className={`${className} text-blue-500 animate-spin`} />;
  } else if (status === "queued") {
    return <Clock className={`${className} text-orange-500`} />;
  } else {
    return <Circle className={`${className} text-gray-400`} />;
  }
}

function getStatusBadge(status: string, conclusion?: string) {
  if (status === "completed" && conclusion) {
    const variant =
      CONCLUSION_COLORS[conclusion as keyof typeof CONCLUSION_COLORS] ||
      "outline";
    return <Badge variant={variant}>{conclusion}</Badge>;
  }

  const variant =
    STATUS_COLORS[status as keyof typeof STATUS_COLORS] || "outline";
  return <Badge variant={variant}>{status.replace("_", " ")}</Badge>;
}

interface JobStepDetailsProps {
  step: JobStep;
}

function JobStepDetails({ step }: JobStepDetailsProps) {
  return (
    <div className="flex items-center justify-between p-3 border-b last:border-b-0 hover:bg-muted/50 transition-colors">
      <div className="flex items-center gap-3 flex-1">
        <div className="flex h-6 w-6 items-center justify-center rounded bg-muted text-xs font-medium">
          {step.step_number}
        </div>
        {getStepStatusIcon(step.status, step.conclusion)}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm">{step.name}</span>
            <Badge
              variant={
                step.status === "completed"
                  ? step.conclusion === "success"
                    ? "default"
                    : step.conclusion === "failure"
                    ? "destructive"
                    : "secondary"
                  : step.status === "in_progress"
                  ? "default"
                  : "secondary"
              }
              className="text-xs h-5"
            >
              {step.status === "completed" && step.conclusion
                ? step.conclusion
                : step.status.replace("_", " ")}
            </Badge>
          </div>
          {step.started_at && (
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Timer className="h-3 w-3" />
                <span>
                  {formatDuration(step.started_at, step.completed_at)}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>{formatRelativeTime(step.started_at)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface JobDetailsProps {
  job: Job;
  index: number;
}

function JobDetails({ job, index }: JobDetailsProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="border rounded-lg overflow-hidden bg-card hover:bg-muted/30 transition-colors">
        <CollapsibleTrigger asChild onClick={() => setIsOpen(!isOpen)}>
          <div className="flex items-center justify-between cursor-pointer p-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-sm font-medium">
                  {index}
                </div>
                {getStatusIcon(job.status, job.conclusion, "h-5 w-5")}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-semibold">{job.job_name}</h4>
                  {getStatusBadge(job.status, job.conclusion)}
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Timer className="h-3 w-3" />
                    {formatDuration(job.started_at, job.completed_at)}
                  </div>
                  {job.started_at && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatRelativeTime(job.started_at)}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(job.url, "_blank");
                }}
                className="opacity-60 hover:opacity-100"
              >
                <ExternalLink className="h-4 w-4" />
              </Button>
              <div className="p-1">
                {isOpen ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>
          </div>
        </CollapsibleTrigger>

        <CollapsibleContent open={isOpen}>
          <div className="border-t bg-muted/20 p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Play className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Started</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatRelativeTime(job.started_at)}
                </p>
                {job.started_at && (
                  <p className="text-xs text-muted-foreground/70">
                    {formatToLocalTime(job.started_at)}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Completed</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {formatRelativeTime(job.completed_at)}
                </p>
                {job.completed_at && (
                  <p className="text-xs text-muted-foreground/70">
                    {formatToLocalTime(job.completed_at)}
                  </p>
                )}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Status</span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusIcon(job.status, job.conclusion, "h-4 w-4")}
                  <span className="text-sm">
                    {job.status === "completed" && job.conclusion
                      ? job.conclusion
                      : job.status.replace("_", " ")}
                  </span>
                </div>
              </div>
            </div>

            {/* Job Steps */}
            {job.steps && job.steps.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center gap-2 mb-3">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    Steps ({job.steps.length})
                  </span>
                </div>
                <div className="border rounded-lg overflow-hidden bg-background">
                  <div className="max-h-60 overflow-auto">
                    {job.steps
                      .sort((a, b) => a.step_number - b.step_number)
                      .map((step) => (
                        <JobStepDetails key={step.id} step={step} />
                      ))}
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2 justify-end mt-4 pt-3 border-t">
              <Button
                asChild
                variant="default"
                size="sm"
                className="flex items-center gap-2"
              >
                <Link href={`/jobs/${job.id}/logs`}>
                  <Terminal className="h-4 w-4" />
                  View Logs
                </Link>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(job.url, "_blank");
                }}
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                View Job on GitHub
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}

interface WorkflowRunDetailsProps {
  runId: string | null;
  runAttempt?: number;
  open: boolean;
  onClose: () => void;
}

export function WorkflowRunDetails({
  runId,
  runAttempt,
  open,
  onClose,
}: WorkflowRunDetailsProps) {
  const {
    data: workflowRun,
    isLoading,
    error,
  } = useWorkflowRun(runId || "", runAttempt, {
    enabled: !!runId && open,
  });

  if (!runId) return null;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-[900px] sm:max-w-[900px] p-0">
        {/* Clean Header */}
        <div className="border-b bg-muted/30 px-6 py-6">
          <div className="flex items-start justify-between">
            <div className="space-y-3">
              <div className="flex items-center gap-4">
                {workflowRun &&
                  getStatusIcon(
                    workflowRun.status,
                    workflowRun.conclusion,
                    "h-7 w-7"
                  )}
                <div>
                  <SheetTitle className="text-2xl font-bold text-foreground">
                    {workflowRun?.workflow_name || "Loading..."}
                  </SheetTitle>
                  <div className="flex items-center gap-4 text-muted-foreground mt-2">
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4" />
                      <span className="font-mono text-sm">
                        #{workflowRun?.run_number}
                      </span>
                    </div>
                    {workflowRun?.run_attempt &&
                      workflowRun.run_attempt > 1 && (
                        <Badge variant="secondary" className="h-6 text-xs px-3">
                          <Timer className="h-3 w-3 mr-1" />
                          Attempt {workflowRun.run_attempt}
                        </Badge>
                      )}
                    <div className="flex items-center gap-2">
                      <GitBranch className="h-4 w-4" />
                      <span className="font-medium">
                        {workflowRun?.repository?.full_name}
                      </span>
                    </div>
                    {workflowRun?.status &&
                      getStatusBadge(
                        workflowRun.status,
                        workflowRun.conclusion
                      )}
                  </div>
                </div>
              </div>
            </div>
            {workflowRun && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open(workflowRun.url, "_blank")}
                className="shrink-0"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View on GitHub
              </Button>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-3">
                <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
                <p className="text-muted-foreground">
                  Loading workflow details...
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center justify-center py-12">
              <div className="text-center space-y-3 max-w-md">
                <XCircle className="h-12 w-12 text-destructive mx-auto" />
                <div className="space-y-1">
                  <h3 className="font-semibold">
                    Failed to load workflow details
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {error.message}
                  </p>
                </div>
              </div>
            </div>
          )}

          {workflowRun && (
            <div className="space-y-0">
              {/* Clean Overview Section */}
              <div className="px-6 py-6 border-b">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="bg-card rounded-lg p-4 border">
                    <div className="flex items-center gap-2 mb-2">
                      <Timer className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">
                        Duration
                      </span>
                    </div>
                    <p className="text-lg font-semibold">
                      {formatDuration(
                        workflowRun.started_at,
                        workflowRun.completed_at
                      )}
                    </p>
                  </div>

                  <div className="bg-card rounded-lg p-4 border">
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">
                        Trigger
                      </span>
                    </div>
                    <Badge variant="secondary">
                      {workflowRun.event.replace("_", " ")}
                    </Badge>
                  </div>

                  {workflowRun.head_branch && (
                    <div className="bg-card rounded-lg p-4 border">
                      <div className="flex items-center gap-2 mb-2">
                        <GitBranch className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium text-muted-foreground">
                          Branch
                        </span>
                      </div>
                      <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                        {workflowRun.head_branch}
                      </code>
                    </div>
                  )}

                  <div className="bg-card rounded-lg p-4 border">
                    <div className="flex items-center gap-2 mb-2">
                      <GitCommit className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-muted-foreground">
                        Commit
                      </span>
                    </div>
                    <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
                      {workflowRun.head_sha.substring(0, 7)}
                    </code>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Started {formatRelativeTime(workflowRun.started_at)}
                  </div>
                  {workflowRun.completed_at && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Completed {formatRelativeTime(workflowRun.completed_at)}
                    </div>
                  )}
                </div>
              </div>

              {/* Jobs Section */}
              <div className="px-6 py-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl font-semibold flex items-center gap-2">
                      <Activity className="h-5 w-5" />
                      Jobs ({workflowRun.jobs.length})
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Execution details for each job in this workflow run
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {workflowRun.jobs.filter((j) => j.conclusion === "success")
                      .length > 0 && (
                      <Badge
                        variant="default"
                        className="bg-green-500 hover:bg-green-600"
                      >
                        <CheckCircle className="h-3 w-3 mr-1" />
                        {
                          workflowRun.jobs.filter(
                            (j) => j.conclusion === "success"
                          ).length
                        }{" "}
                        passed
                      </Badge>
                    )}
                    {workflowRun.jobs.filter((j) => j.conclusion === "failure")
                      .length > 0 && (
                      <Badge variant="destructive">
                        <XCircle className="h-3 w-3 mr-1" />
                        {
                          workflowRun.jobs.filter(
                            (j) => j.conclusion === "failure"
                          ).length
                        }{" "}
                        failed
                      </Badge>
                    )}
                    {workflowRun.jobs.filter((j) => j.status === "in_progress")
                      .length > 0 && (
                      <Badge variant="secondary">
                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                        {
                          workflowRun.jobs.filter(
                            (j) => j.status === "in_progress"
                          ).length
                        }{" "}
                        running
                      </Badge>
                    )}
                  </div>
                </div>

                {workflowRun.jobs.length === 0 ? (
                  <div className="text-center py-12">
                    <Activity className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <h4 className="font-semibold mb-1">No jobs found</h4>
                    <p className="text-sm text-muted-foreground">
                      This workflow run doesn&apos;t have any jobs yet
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {workflowRun.jobs.map((job, index) => (
                      <JobDetails key={job.id} job={job} index={index + 1} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
