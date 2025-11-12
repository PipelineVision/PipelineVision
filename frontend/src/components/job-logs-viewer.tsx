"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Search,
  Download,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Play,
  Pause,
  Terminal,
  Clock,
  Hash,
} from "lucide-react";

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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

import {
  useJobLogs,
  useJobLogsRaw,
  useRefreshJobLogs,
  useJobSteps,
  JobLog,
  JobLogsFilters,
} from "@/app/hooks/useJobLogs";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface JobLogsViewerProps {
  jobId: string;
  jobName?: string;
  jobStatus?: string;
  className?: string;
}

interface JobLogLineProps {
  log: JobLog;
  searchTerm: string;
  showTimestamp: boolean;
  showLineNumbers: boolean;
  hideStepBadge?: boolean;
}

interface JobStepSectionProps {
  number: number;
  stepNumber: number | null;
  stepName?: string;
  stepStatus?: string;
  stepConclusion?: string;
  logs: JobLog[];
  searchTerm: string;
  showTimestamp: boolean;
  showLineNumbers: boolean;
  isOpen: boolean;
  onToggle: () => void;
}

function JobLogLine({
  log,
  searchTerm,
  showTimestamp,
  showLineNumbers,
  hideStepBadge = false,
}: JobLogLineProps) {
  // Highlight search terms
  const highlightedContent = searchTerm
    ? log.content.replace(
        new RegExp(`(${searchTerm})`, "gi"),
        '<mark class="bg-yellow-200 dark:bg-yellow-800">$1</mark>'
      )
    : log.content;

  const timestamp = new Date(log.timestamp).toLocaleTimeString();

  return (
    <div className="group flex font-mono text-sm leading-relaxed hover:bg-muted/30 px-2 py-1">
      {showLineNumbers && (
        <span className="mr-4 text-xs text-muted-foreground w-12 text-right shrink-0">
          {log.line_number}
        </span>
      )}
      {showTimestamp && (
        <span className="mr-4 text-xs text-muted-foreground w-20 shrink-0">
          {timestamp}
        </span>
      )}
      {!hideStepBadge && log.step_number && (
        <Badge variant="outline" className="mr-2 text-xs h-4 shrink-0">
          Step {log.step_number}
        </Badge>
      )}
      <div
        className="flex-1 whitespace-pre-wrap break-words"
        dangerouslySetInnerHTML={{ __html: highlightedContent }}
      />
    </div>
  );
}

// TODO: The step order is messed up. Temp fix is using the index.
function JobStepSection({
  number,
  stepNumber,
  stepName,
  stepStatus,
  stepConclusion,
  logs,
  searchTerm,
  showTimestamp,
  showLineNumbers,
  isOpen,
  onToggle,
}: JobStepSectionProps) {
  const getStepIcon = () => {
    if (stepConclusion === "success") return "✅";
    if (stepConclusion === "failure") return "❌";
    if (stepConclusion === "skipped") return "⏭️";
    if (stepStatus === "in_progress") return "🔄";
    return "⏸️";
  };

  const getStepBadge = () => {
    if (stepConclusion === "success")
      return <Badge className="bg-green-500/10 text-green-600">Success</Badge>;
    if (stepConclusion === "failure")
      return <Badge className="bg-red-500/10 text-red-600">Failed</Badge>;
    if (stepConclusion === "skipped")
      return <Badge className="bg-gray-500/10 text-gray-600">Skipped</Badge>;
    if (stepStatus === "in_progress")
      return <Badge className="bg-blue-500/10 text-blue-600">Running</Badge>;
    return <Badge variant="outline">Queued</Badge>;
  };

  const stepTitle = stepNumber
    ? `Step ${number}: ${stepName || "Unknown Step"}`
    : "Job Setup & Cleanup";

  return (
    <Collapsible open={isOpen} onOpenChange={onToggle}>
      <CollapsibleTrigger asChild>
        <div className="flex items-center justify-between p-3 border-b cursor-pointer hover:bg-muted/50">
          <div className="flex items-center gap-3">
            <span className="text-lg">{getStepIcon()}</span>
            <div>
              <div className="font-medium text-sm">{stepTitle}</div>
              <div className="text-xs text-muted-foreground">
                {logs.length} log {logs.length === 1 ? "line" : "lines"}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {getStepBadge()}
            {isOpen ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </div>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="bg-muted/20">
          {logs.length === 0 ? (
            <div className="text-center py-4 text-sm text-muted-foreground">
              No logs available for this step
            </div>
          ) : (
            logs.map((log) => (
              <JobLogLine
                key={log.id}
                log={log}
                searchTerm={searchTerm}
                showTimestamp={showTimestamp}
                showLineNumbers={showLineNumbers}
                hideStepBadge={true}
              />
            ))
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

export function JobLogsViewer({
  jobId,
  jobName,
  className,
}: JobLogsViewerProps) {
  const [filters, setFilters] = useState<JobLogsFilters>({ limit: 1000 });
  const [searchTerm, setSearchTerm] = useState("");
  const [showTimestamp, setShowTimestamp] = useState(true);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [autoScroll, setAutoScroll] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [openSteps, setOpenSteps] = useState<Set<number | null>>(
    new Set([null, 1, 2, 3])
  ); // Start with job setup and first few steps open

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const {
    data: logs = [],
    isLoading: logsLoading,
    error,
    refetch,
  } = useJobLogs(jobId, filters);

  const { data: steps = [], isLoading: stepsLoading } = useJobSteps(jobId);
  const { data: rawLogs } = useJobLogsRaw(jobId);
  const refreshLogsMutation = useRefreshJobLogs();

  const isLoading = logsLoading || stepsLoading;

  // Group logs by step - enhanced to handle step estimation when step_number is null
  const logsByStep = useMemo(() => {
    if (logs.length === 0 || steps.length === 0) {
      return logs.reduce((acc, log) => {
        const stepKey = log.step_number || 1;
        if (!acc[stepKey]) {
          acc[stepKey] = [];
        }
        acc[stepKey].push(log);
        return acc;
      }, {} as Record<number, JobLog[]>);
    }

    // If logs don't have proper step numbers, estimate based on content and timing
    const result: Record<number, JobLog[]> = {};

    for (const log of logs) {
      let stepKey: number | null = log.step_number;

      // TODO: Temp fix
      // TODO: Fix why we have logs with a null step key
      if (stepKey === null) {
        stepKey = 1;
      }

      if (!result[stepKey]) {
        result[stepKey] = [];
      }
      result[stepKey].push(log);
    }

    return result;
  }, [logs, steps]);

  // Filter logs by search term within each step
  const filteredLogsByStep = Object.entries(logsByStep).reduce(
    (acc, [stepKey, stepLogs]) => {
      // const key = stepKey === "null" ? null : Number(stepKey);
      const key = Number(stepKey);
      const filtered = stepLogs.filter((log) =>
        searchTerm
          ? log.content.toLowerCase().includes(searchTerm.toLowerCase())
          : true
      );
      if (filtered.length > 0) {
        acc[key] = filtered;
      }
      return acc;
    },
    {} as Record<number, JobLog[]>
  );

  // Create step info map
  // const stepInfoMap = steps.reduce((acc, step) => {
  //   acc[step.step_number] = step;
  //   return acc;
  // }, {} as Record<number, JobStep>);

  const toggleStep = (stepNumber: number | null) => {
    const newOpenSteps = new Set(openSteps);
    if (newOpenSteps.has(stepNumber)) {
      newOpenSteps.delete(stepNumber);
    } else {
      newOpenSteps.add(stepNumber);
    }
    setOpenSteps(newOpenSteps);
  };

  // Auto-scroll to bottom when new logs arrive
  useEffect(() => {
    if (autoScroll && scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [filteredLogsByStep, autoScroll]);

  const handleRefresh = () => {
    refreshLogsMutation.mutate(jobId);
  };

  const handleDownloadLogs = () => {
    if (rawLogs?.content) {
      const blob = new Blob([rawLogs.content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `job-${jobId}-logs.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const handleStepFilter = (value: string) => {
    if (value === "all") {
      setFilters((prev) => ({ ...prev, step_number: undefined }));
    } else {
      setFilters((prev) => ({ ...prev, step_number: parseInt(value) }));
    }
  };

  // Get unique step numbers for filtering
  const stepNumbers = Array.from(
    new Set(logs.filter((log) => log.step_number).map((log) => log.step_number))
  ).sort((a, b) => (a || 0) - (b || 0));

  // Get total log count for display
  const totalFilteredLogs = Object.values(filteredLogsByStep).reduce(
    (sum, stepLogs) => sum + stepLogs.length,
    0
  );

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            Job Logs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-destructive">Failed to load logs</p>
            <Button onClick={() => refetch()} className="mt-2">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="h-5 w-5" />
              Job Logs
              {jobName && (
                <span className="text-sm font-normal">- {jobName}</span>
              )}
            </CardTitle>
            <CardDescription>
              {searchTerm
                ? `${totalFilteredLogs} of ${logs.length}`
                : `${logs.length}`}{" "}
              log lines
              {rawLogs?.total_lines &&
                rawLogs.total_lines !== logs.length &&
                ` (${rawLogs.total_lines} total)`}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoScroll(!autoScroll)}
              className={autoScroll ? "bg-muted" : ""}
            >
              {autoScroll ? (
                <Pause className="h-4 w-4" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              Auto-scroll
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshLogsMutation.isPending}
            >
              <RefreshCw
                className={`h-4 w-4 ${
                  refreshLogsMutation.isPending ? "animate-spin" : ""
                }`}
              />
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownloadLogs}>
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
              {isExpanded ? "Collapse" : "Expand"}
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 mt-4">
          <div className="flex items-center gap-2 flex-1 min-w-64">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>

          <Select
            value={filters.step_number?.toString() || "all"}
            onValueChange={handleStepFilter}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Filter by step" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All steps</SelectItem>
              {stepNumbers.map((stepNum) => (
                <SelectItem key={stepNum} value={stepNum?.toString() || ""}>
                  Step {stepNum}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTimestamp(!showTimestamp)}
              className={showTimestamp ? "bg-muted" : ""}
            >
              <Clock className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowLineNumbers(!showLineNumbers)}
              className={showLineNumbers ? "bg-muted" : ""}
            >
              <Hash className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <Separator />
        <ScrollArea
          ref={scrollAreaRef}
          className={`bg-muted/10 ${isExpanded ? "h-[80vh]" : "h-96"}`}
        >
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              Loading logs...
            </div>
          ) : Object.keys(filteredLogsByStep).length === 0 &&
            steps.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? "No logs match your search" : "No logs available"}
            </div>
          ) : (
            <div>
              {/* First show job setup logs if they exist */}
              {/* {filteredLogsByStep[null] && (
                <JobStepSection
                  key="job-setup"
                  stepNumber={null}
                  stepName="Job Setup & Cleanup"
                  stepStatus="completed"
                  stepConclusion="success"
                  logs={filteredLogsByStep[null]}
                  searchTerm={searchTerm}
                  showTimestamp={showTimestamp}
                  showLineNumbers={showLineNumbers}
                  isOpen={openSteps.has(null)}
                  onToggle={() => toggleStep(null)}
                />
              )} */}

              {/* Then show all steps in order, including empty ones */}
              {steps
                .sort((a, b) => a.step_number - b.step_number)
                .map((step, index) => {
                  const stepLogs = filteredLogsByStep[step.step_number] || [];

                  return (
                    <JobStepSection
                      number={index}
                      key={step.step_number}
                      stepNumber={step.step_number}
                      stepName={step.name}
                      stepStatus={step.status}
                      stepConclusion={step.conclusion as string}
                      logs={stepLogs}
                      searchTerm={searchTerm}
                      showTimestamp={showTimestamp}
                      showLineNumbers={showLineNumbers}
                      isOpen={openSteps.has(step.step_number)}
                      onToggle={() => toggleStep(step.step_number)}
                    />
                  );
                })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
