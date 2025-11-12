"use client";

import React, { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  Search,
  RefreshCw,
  GitBranch,
  CheckCircle,
  XCircle,
  Clock,
  ExternalLink,
  Activity,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { useWorkflowsWithPagination } from "@/app/hooks/useWorkflows";

const STATE_COLORS = {
  active: "default",
  disabled: "secondary",
} as const;

function getStateBadge(state: string) {
  const variant = STATE_COLORS[state as keyof typeof STATE_COLORS] || "outline";
  return (
    <Badge variant={variant} className="flex items-center gap-1 text-xs">
      <div
        className={`h-2 w-2 rounded-full ${
          state === "active" ? "bg-green-500" : "bg-gray-400"
        }`}
      />
      {state.charAt(0).toUpperCase() + state.slice(1)}
    </Badge>
  );
}

function getSuccessRateBadge(successRate: number) {
  if (successRate >= 90) {
    return (
      <Badge className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
        {successRate}%
      </Badge>
    );
  } else if (successRate >= 70) {
    return (
      <Badge variant="secondary" className="text-xs">
        {successRate}%
      </Badge>
    );
  } else {
    return (
      <Badge variant="destructive" className="text-xs">
        {successRate}%
      </Badge>
    );
  }
}

function WorkflowsTable({ className }: { className?: string }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [repositoryFilter, setRepositoryFilter] = useState<string>("");
  const [stateFilter, setStateFilter] = useState<string>("");

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
  } = useWorkflowsWithPagination();

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      updateFilters({
        repository_name: repositoryFilter || undefined,
        state: stateFilter || undefined,
      });
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchTerm, repositoryFilter, stateFilter, updateFilters]);

  const filteredWorkflows =
    data?.workflows.filter(
      (workflow) =>
        !searchTerm ||
        workflow.name.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  const handleStateChange = (value: string) => {
    setStateFilter(value === "all" ? "" : value);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setRepositoryFilter("");
    setStateFilter("");
    clearFilters();
  };

  if (error) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <p className="text-destructive mb-2">Failed to load workflows</p>
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
              placeholder="Search workflows..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <Select
            value={stateFilter || "all"}
            onValueChange={handleStateChange}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="State" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All States</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="disabled">Disabled</SelectItem>
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

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Workflow</TableHead>
              <TableHead>Repository</TableHead>
              <TableHead>State</TableHead>
              <TableHead>Total Runs</TableHead>
              <TableHead>Success Rate</TableHead>
              <TableHead>Last Run</TableHead>
              <TableHead className="w-[50px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 10 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell colSpan={7}>
                    <div className="h-4 bg-muted animate-pulse rounded" />
                  </TableCell>
                </TableRow>
              ))
            ) : filteredWorkflows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <p className="text-muted-foreground">No workflows found</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredWorkflows.map((workflow) => (
                <TableRow
                  key={workflow.id}
                  className="cursor-pointer hover:bg-muted/30"
                  onClick={() =>
                    window.open(`/workflows/${workflow.id}`, "_blank")
                  }
                >
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span className="font-medium">{workflow.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {workflow.path}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <GitBranch className="h-4 w-4 text-muted-foreground" />
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">
                          {workflow.repository?.name || "—"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {workflow.repository?.owner}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{getStateBadge(workflow.state)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Activity className="h-4 w-4 text-muted-foreground" />
                      <span className="font-mono text-sm">
                        {workflow.stats.total_runs}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {workflow.stats.total_runs > 0 ? (
                      <div className="flex items-center gap-2">
                        {getSuccessRateBadge(workflow.stats.success_rate)}
                        <div className="flex gap-1 text-xs">
                          <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                            <CheckCircle className="h-3 w-3" />
                            {workflow.stats.successful_runs}
                          </span>
                          <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
                            <XCircle className="h-3 w-3" />
                            {workflow.stats.failed_runs}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs">
                        {workflow.stats.last_run_at
                          ? formatDistanceToNow(
                              new Date(workflow.stats.last_run_at),
                              { addSuffix: true }
                            )
                          : "Never"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(
                          `https://github.com/${
                            workflow.repository?.full_name
                          }/actions/workflows/${workflow.path
                            .split("/")
                            .pop()}`,
                          "_blank"
                        );
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {data && data.total > 0 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">
            Showing {filteredWorkflows.length} of {data.total} workflows
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

export default function Workflows() {
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
                <BreadcrumbPage>Workflows</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Workflows</h1>
            <p className="text-muted-foreground">
              View and manage all GitHub Actions workflows across your
              repositories
            </p>
          </div>

          <WorkflowsTable />
        </div>
      </div>
    </SidebarInset>
  );
}
