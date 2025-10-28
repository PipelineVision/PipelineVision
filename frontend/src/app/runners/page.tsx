"use client";

import React, { useState, useEffect } from "react";
import { formatDistanceToNow } from "date-fns";
import { RefreshCw, Search, Cpu, HardDrive, Activity } from "lucide-react";
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

import { useRunners } from "@/app/hooks/useRunners";

function getStatusBadge(status: string, busy: boolean) {
  if (busy) {
    return (
      <Badge variant="destructive" className="flex items-center gap-1 text-xs">
        <Activity className="h-3 w-3" />
        Busy
      </Badge>
    );
  }

  if (status === "online") {
    return (
      <Badge className="flex items-center gap-1 text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800">
        <div className="h-2 w-2 rounded-full bg-green-500" />
        Online
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="flex items-center gap-1 text-xs">
      <div className="h-2 w-2 rounded-full bg-gray-400 dark:bg-gray-500" />
      Offline
    </Badge>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RunnerLabels({ labels }: { labels: any[] }) {
  if (!labels || labels.length === 0)
    return <span className="text-muted-foreground">—</span>;

  const filteredLabels = labels.filter((label) =>
    typeof label === "string"
      ? label !== "self-hosted"
      : label.name !== "self-hosted"
  );

  if (filteredLabels.length === 0) {
    return (
      <Badge variant="outline" className="text-xs">
        self-hosted
      </Badge>
    );
  }

  return (
    <div className="flex flex-wrap gap-1">
      {filteredLabels.slice(0, 3).map((label, index) => (
        <Badge key={index} variant="outline" className="text-xs">
          {typeof label === "string" ? label : label.name}
        </Badge>
      ))}
      {filteredLabels.length > 3 && (
        <Badge variant="outline" className="text-xs">
          +{filteredLabels.length - 3}
        </Badge>
      )}
    </div>
  );
}

function RunnersTable({ className }: { className?: string }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const { data, isLoading, error, refetch } = useRunners();

  useEffect(() => {}, [searchTerm, statusFilter]);

  const filteredRunners =
    data?.runners.filter((runner) => {
      const matchesSearch =
        !searchTerm ||
        runner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        runner.os?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        runner.architecture?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus =
        !statusFilter ||
        statusFilter === "all" ||
        (statusFilter === "online" && runner.status === "online") ||
        (statusFilter === "offline" && runner.status === "offline") ||
        (statusFilter === "busy" && runner.busy);

      return matchesSearch && matchesStatus;
    }) || [];

  const handleStatusChange = (value: string) => {
    setStatusFilter(value === "all" ? "" : value);
  };

  const handleClearFilters = () => {
    setSearchTerm("");
    setStatusFilter("");
  };

  if (error) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <p className="text-destructive mb-2">Failed to load runners</p>
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
              placeholder="Search runners..."
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
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
              <SelectItem value="busy">Busy</SelectItem>
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
              <TableHead>Name</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>OS</TableHead>
              <TableHead>Architecture</TableHead>
              <TableHead>Labels</TableHead>
              <TableHead>Last Seen</TableHead>
              <TableHead>Type</TableHead>
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
            ) : filteredRunners.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <p className="text-muted-foreground">No runners found</p>
                </TableCell>
              </TableRow>
            ) : (
              filteredRunners.map((runner) => (
                <TableRow key={runner.id} className="hover:bg-muted/30">
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span className="font-medium">{runner.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ID: {runner.runner_id}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(runner.status, runner.busy)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Cpu className="h-4 w-4 text-muted-foreground" />
                      <span className="capitalize">{runner.os || "—"}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <HardDrive className="h-4 w-4 text-muted-foreground" />
                      <span>{runner.architecture || "—"}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <RunnerLabels labels={runner.labels} />
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {runner.last_seen
                        ? formatDistanceToNow(new Date(runner.last_seen), {
                            addSuffix: true,
                          })
                        : "—"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {runner.ephemeral ? "Ephemeral" : "Persistent"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {data && data.total_runners > 0 && (
        <div className="flex items-center justify-between mt-4">
          <div className="text-sm text-muted-foreground">
            Showing {filteredRunners.length} of {data.total_runners} self-hosted
            runners
          </div>
        </div>
      )}
    </div>
  );
}

export default function Runners() {
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
                <BreadcrumbPage>Self-Hosted Runners</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Self-Hosted Runners
            </h1>
            <p className="text-muted-foreground">
              Manage and monitor your organization&apos;s self-hosted GitHub
              Actions runners
            </p>
          </div>

          <RunnersTable />
        </div>
      </div>
    </SidebarInset>
  );
}
