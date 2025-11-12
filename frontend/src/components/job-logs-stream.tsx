"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  RefreshCw,
  Wifi,
  WifiOff,
  Terminal,
  Clock,
  Activity,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

import { useJobLogsStream, JobLog } from "@/app/hooks/useJobLogs";

interface JobLogsStreamProps {
  jobId: string;
  jobName?: string;
  jobStatus?: string;
  className?: string;
  onComplete?: () => void;
}

interface LogLineProps {
  log: JobLog;
  isNew?: boolean;
}

function LogLine({ log, isNew = false }: LogLineProps) {
  const timestamp = new Date(log.timestamp).toLocaleTimeString();

  return (
    <div
      className={`group flex font-mono text-sm leading-relaxed px-2 py-1 ${
        isNew ? "bg-blue-500/10 animate-pulse" : "hover:bg-muted/30"
      }`}
    >
      <span className="mr-4 text-xs text-muted-foreground w-20 shrink-0">
        {timestamp}
      </span>
      <span className="mr-4 text-xs text-muted-foreground w-12 text-right shrink-0">
        {log.line_number}
      </span>
      {log.step_number && (
        <Badge variant="outline" className="mr-2 text-xs h-4 shrink-0">
          Step {log.step_number}
        </Badge>
      )}
      <div className="flex-1 whitespace-pre-wrap break-words">
        {log.content}
      </div>
    </div>
  );
}

export function JobLogsStream({
  jobId,
  jobName,
  jobStatus,
  className,
  onComplete,
}: JobLogsStreamProps) {
  const [isStreaming, setIsStreaming] = useState(true);
  const [allLogs, setAllLogs] = useState<JobLog[]>([]);
  const [lastLineNumber, setLastLineNumber] = useState(0);
  const [newLogIds, setNewLogIds] = useState<Set<number>>(new Set());

  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const {
    data: streamData,
    isLoading,
    error,
    refetch,
  } = useJobLogsStream(jobId, lastLineNumber);

  useEffect(() => {
    if (streamData?.logs && streamData.logs.length > 0) {
      const newLogs = streamData.logs.filter(
        (log) => log.line_number > lastLineNumber
      );

      if (newLogs.length > 0) {
        setAllLogs((prev) => {
          const existingLineNumbers = new Set(
            prev.map((log) => log.line_number)
          );
          const filteredNewLogs = newLogs.filter(
            (log) => !existingLineNumbers.has(log.line_number)
          );
          return [...prev, ...filteredNewLogs];
        });

        const newIds = new Set(newLogs.map((log) => log.id));
        setNewLogIds(newIds);

        setTimeout(() => {
          setNewLogIds((prev) => {
            const updated = new Set(prev);
            newIds.forEach((id) => updated.delete(id));
            return updated;
          });
        }, 2000);

        const maxLineNumber = Math.max(
          ...newLogs.map((log) => log.line_number)
        );
        setLastLineNumber(maxLineNumber);
      }
    }
  }, [streamData, lastLineNumber]);

  useEffect(() => {
    if (isStreaming && scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [allLogs, isStreaming]);

  useEffect(() => {
    if (streamData?.is_complete && isStreaming) {
      setIsStreaming(false);
      onComplete?.();
    }
  }, [streamData?.is_complete, isStreaming, onComplete]);

  const handleToggleStreaming = () => {
    setIsStreaming(!isStreaming);
    if (!isStreaming) {
      refetch();
    }
  };

  const isJobRunning = jobStatus === "in_progress" || jobStatus === "queued";
  const isConnected = !error && !isLoading;

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Terminal className="h-5 w-5" />
              Live Job Logs
              {jobName && (
                <span className="text-sm font-normal">- {jobName}</span>
              )}
            </CardTitle>
            <CardDescription className="flex items-center gap-4">
              <span>{allLogs.length} log lines</span>
              <div className="flex items-center gap-1">
                {isConnected ? (
                  <Wifi className="h-3 w-3 text-green-500" />
                ) : (
                  <WifiOff className="h-3 w-3 text-red-500" />
                )}
                <span className="text-xs">
                  {isConnected ? "Connected" : "Disconnected"}
                </span>
              </div>
              {isJobRunning && (
                <Badge variant="outline" className="text-xs">
                  <Activity className="h-3 w-3 mr-1" />
                  Running
                </Badge>
              )}
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleToggleStreaming}
              className={isStreaming ? "bg-green-500/10 text-green-600" : ""}
            >
              {isStreaming ? (
                <>
                  <Pause className="h-4 w-4 mr-1" />
                  Pause
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-1" />
                  Resume
                </>
              )}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isLoading}
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
            </Button>
          </div>
        </div>

        {streamData && (
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>Total lines: {streamData.total_lines}</span>
            <span>From line: {streamData.from_line}</span>
            <span>Status: {streamData.job_status}</span>
            {streamData.is_complete && (
              <Badge variant="outline" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                Complete
              </Badge>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent className="p-0">
        <Separator />
        <ScrollArea ref={scrollAreaRef} className="h-96 bg-muted/10">
          {error ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <WifiOff className="h-8 w-8 text-red-500 mx-auto mb-2" />
                <p className="text-destructive">Connection lost</p>
                <Button onClick={() => refetch()} className="mt-2" size="sm">
                  Reconnect
                </Button>
              </div>
            </div>
          ) : allLogs.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              {isLoading ? (
                <div className="text-center">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto mb-2" />
                  <p className="text-muted-foreground">
                    Connecting to log stream...
                  </p>
                </div>
              ) : (
                <div className="text-center">
                  <Terminal className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-muted-foreground">Waiting for logs...</p>
                  {isJobRunning && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Job is running, logs will appear here
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="py-2">
              {allLogs.map((log) => (
                <LogLine key={log.id} log={log} isNew={newLogIds.has(log.id)} />
              ))}
              {isStreaming && isJobRunning && (
                <div className="flex items-center gap-2 px-2 py-1 text-xs text-muted-foreground">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  Streaming live logs...
                </div>
              )}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
