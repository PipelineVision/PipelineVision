"use client";

import React from "react";
import { JobLogsViewer } from "./job-logs-viewer";

interface JobLogsProps {
  jobId: string;
  jobName?: string;
  jobStatus?: string;
  className?: string;
}

export function JobLogs({ 
  jobId, 
  jobName, 
  jobStatus, 
  className 
}: JobLogsProps) {
  return (
    <div className={className}>
      <JobLogsViewer
        jobId={jobId}
        jobName={jobName}
        jobStatus={jobStatus}
      />
    </div>
  );
}