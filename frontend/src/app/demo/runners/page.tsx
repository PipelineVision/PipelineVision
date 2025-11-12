"use client";

import React, { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  RefreshCw,
  Search,
  Server,
  Cpu,
  HardDrive,
  Activity,
} from "lucide-react";

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

import { useDemo } from "@/contexts/demo-context";
import type { DemoRunner } from "@/lib/demo-data";

const STATUS_COLORS = {
  online: "default",
  offline: "secondary",
  busy: "destructive",
} as const;

function getStatusBadge(runner: DemoRunner) {
  if (runner.status === "busy") {
    return (
      <Badge variant="destructive" className="flex items-center gap-1 text-xs">
        <Activity className="h-3 w-3" />
        Busy
      </Badge>
    );
  }

  return (
    <Badge variant={STATUS_COLORS[runner.status]} className="text-xs">
      {runner.status.charAt(0).toUpperCase() + runner.status.slice(1)}
    </Badge>
  );
}

export default function DemoRunnersPage() {
  const { demoData } = useDemo();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const runners = demoData.runners;

  const filteredRunners = runners.filter((runner) => {
    const matchesSearch = runner.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || runner.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatLastSeen = (lastSeenString: string) => {
    try {
      const lastSeen = new Date(lastSeenString);
      return formatDistanceToNow(lastSeen, { addSuffix: true });
    } catch {
      return "Unknown";
    }
  };

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
              <BreadcrumbItem>
                <BreadcrumbPage>Runners</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Self-Hosted Runners
            </h1>
            <p className="text-muted-foreground">
              Manage your organization&apos;s self-hosted GitHub Actions runners
              (Demo Mode)
            </p>
          </div>
          <Button disabled className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Refresh (Demo)
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search runners..."
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
              <SelectItem value="online">Online</SelectItem>
              <SelectItem value="offline">Offline</SelectItem>
              <SelectItem value="busy">Busy</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Runner</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Operating System</TableHead>
                <TableHead>Architecture</TableHead>
                <TableHead>Labels</TableHead>
                <TableHead>Current Job</TableHead>
                <TableHead>Last Seen</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRunners.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No runners found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRunners.map((runner) => (
                  <TableRow key={runner.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <Server className="h-4 w-4 text-muted-foreground" />
                        {runner.name}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(runner)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Cpu className="h-4 w-4 text-muted-foreground" />
                        {runner.os}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <HardDrive className="h-4 w-4 text-muted-foreground" />
                        {runner.architecture}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {runner.labels.slice(0, 3).map((label) => (
                          <Badge
                            key={label}
                            variant="outline"
                            className="text-xs"
                          >
                            {label}
                          </Badge>
                        ))}
                        {runner.labels.length > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{runner.labels.length - 3}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {runner.current_job ? (
                        <div className="flex items-center gap-2">
                          <Activity className="h-3 w-3 text-blue-500 animate-pulse" />
                          <span className="text-sm font-medium text-blue-600">
                            {runner.current_job}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {formatLastSeen(runner.last_seen)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <p>
            Showing {filteredRunners.length} of {runners.length} runner
            {runners.length !== 1 ? "s" : ""}
          </p>
          {/* <p>
            {runners.filter(r => r.status === &apos;online&apos; || r.status === &apos;busy&apos;).length} online • {&apos; &apos;}
            {runners.filter(r => r.status === &apos;busy&apos;).length} busy • {&apos; &apos;}
            {runners.filter(r => r.status === &apos;offline&apos;).length} offline
          </p> */}
        </div>
      </div>
    </SidebarInset>
  );
}
