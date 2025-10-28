"use client";

export const dynamic = 'force-dynamic';

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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Search,
  GitBranch,
  Clock,
  CheckCircle2,
  XCircle,
  Activity,
  Loader2,
  GitCommit,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import { useState } from "react";
import { useDemo } from "@/contexts/demo-context";
// import { DemoWorkflowRunDetails } from "@/components/demo-workflow-run-details";

export default function DemoWorkflowRunsPage() {
  const { demoData } = useDemo();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  const workflowRuns = demoData.workflowRuns;

  const filteredRuns = workflowRuns.filter((run) => {
    const matchesSearch =
      run.workflow_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      run.repository.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || run.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusIcon = (status: string, conclusion?: string | null) => {
    if (status === "in_progress")
      return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />;
    if (status === "queued")
      return <Clock className="h-4 w-4 text-yellow-500" />;
    if (conclusion === "success")
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    if (conclusion === "failure")
      return <XCircle className="h-4 w-4 text-red-500" />;
    if (conclusion === "cancelled")
      return <AlertCircle className="h-4 w-4 text-gray-500" />;
    return <GitCommit className="h-4 w-4 text-gray-400" />;
  };

  const getStatusBadge = (status: string, conclusion?: string | null) => {
    if (status === "in_progress")
      return (
        <Badge variant="secondary" className="text-blue-600 bg-blue-50">
          In Progress
        </Badge>
      );
    if (status === "queued")
      return (
        <Badge variant="secondary" className="text-yellow-600 bg-yellow-50">
          Queued
        </Badge>
      );
    if (conclusion === "success")
      return (
        <Badge variant="default" className="bg-green-600">
          Success
        </Badge>
      );
    if (conclusion === "failure")
      return <Badge variant="destructive">Failure</Badge>;
    if (conclusion === "cancelled")
      return <Badge variant="secondary">Cancelled</Badge>;
    return <Badge variant="secondary">Unknown</Badge>;
  };

  const formatRelativeTime = (dateString: string | null) => {
    if (!dateString) return "—";
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "Just now";
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "—";
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m ${seconds % 60}s`;
  };

  // Calculate stats
  const totalRuns = filteredRuns.length;
  const successfulRuns = filteredRuns.filter(
    (r) => r.conclusion === "success"
  ).length;
  const failedRuns = filteredRuns.filter(
    (r) => r.conclusion === "failure"
  ).length;
  const inProgressRuns = filteredRuns.filter(
    (r) => r.status === "in_progress"
  ).length;
  const queuedRuns = filteredRuns.filter((r) => r.status === "queued").length;

  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/demo">Dashboard</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="/demo/workflows">
                  Workflows
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Workflow Runs</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Workflow Runs</h1>
            <p className="text-muted-foreground">
              All workflow runs across your organization&apos;s repositories
              (Demo Mode)
            </p>
          </div>
          <Button disabled className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh (Demo)
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Runs</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalRuns}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Successful</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {successfulRuns}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Failed</CardTitle>
              <XCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {failedRuns}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Loader2 className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {inProgressRuns}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Queued</CardTitle>
              <Clock className="h-4 w-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {queuedRuns}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search workflow runs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="queued">Queued</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Workflow Runs Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Workflow</TableHead>
                <TableHead>Repository</TableHead>
                <TableHead>Event</TableHead>
                <TableHead>Jobs</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRuns.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No workflow runs found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRuns.map((run) => (
                  <TableRow
                    key={run.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setSelectedRunId(run.id)}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(run.status, run.conclusion)}
                        {getStatusBadge(run.status, run.conclusion)}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {run.workflow_name}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <GitBranch className="h-4 w-4 text-muted-foreground" />
                        {run.repository.replace("acme-corp/", "")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        push
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <span className="font-medium">
                          {run.jobs_summary.total}
                        </span>{" "}
                        jobs
                        {run.jobs_summary.failed > 0 && (
                          <span className="text-red-600">
                            {" "}
                            • {run.jobs_summary.failed} failed
                          </span>
                        )}
                        {run.jobs_summary.in_progress > 0 && (
                          <span className="text-blue-600">
                            {" "}
                            • {run.jobs_summary.in_progress} running
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDuration(run.duration)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {formatRelativeTime(run.created_at)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* <div className="flex items-center justify-between text-sm text-muted-foreground">
          <p>
            Showing {filteredRuns.length} of {workflowRuns.length} run{workflowRuns.length !== 1 ? &apos;s&apos; : &apos;&apos;}
          </p>
          <p>
            Success rate: {totalRuns > 0 ? Math.round((successfulRuns / (successfulRuns + failedRuns)) * 100) : 0}%
          </p>
        </div> */}
      </div>

      {/* Workflow Run Details Modal */}
      {/* <DemoWorkflowRunDetails
        runId={selectedRunId}
        open={!!selectedRunId}
        onClose={() => setSelectedRunId(null)}
      /> */}
    </SidebarInset>
  );
}
