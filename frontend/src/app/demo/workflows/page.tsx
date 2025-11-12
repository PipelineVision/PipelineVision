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
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  PlayCircle,
  Search,
  GitBranch,
  Clock,
  CheckCircle2,
  Activity
} from "lucide-react";
import { useState } from "react";

interface DemoWorkflow {
  id: string;
  name: string;
  repository: string;
  status: 'active' | 'disabled';
  runs_count: number;
  last_run: string | null;
  success_rate: number;
  path: string;
}

const demoWorkflows: DemoWorkflow[] = [
  {
    id: "wf-1",
    name: "CI/CD Pipeline",
    repository: "web-app",
    status: "active",
    runs_count: 156,
    last_run: new Date(Date.now() - 120000).toISOString(), // 2 min ago
    success_rate: 92,
    path: ".github/workflows/ci.yml"
  },
  {
    id: "wf-2", 
    name: "Build and Test",
    repository: "api-service",
    status: "active",
    runs_count: 98,
    last_run: new Date(Date.now() - 300000).toISOString(), // 5 min ago
    success_rate: 100,
    path: ".github/workflows/test.yml"
  },
  {
    id: "wf-3",
    name: "Security Scan",
    repository: "mobile-app", 
    status: "active",
    runs_count: 45,
    last_run: new Date(Date.now() - 600000).toISOString(), // 10 min ago
    success_rate: 87,
    path: ".github/workflows/security.yml"
  },
  {
    id: "wf-4",
    name: "Deploy to Production",
    repository: "web-app",
    status: "active", 
    runs_count: 23,
    last_run: new Date(Date.now() - 1800000).toISOString(), // 30 min ago
    success_rate: 96,
    path: ".github/workflows/deploy.yml"
  },
  {
    id: "wf-5",
    name: "ML Model Training",
    repository: "ml-models",
    status: "active",
    runs_count: 12,
    last_run: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    success_rate: 75,
    path: ".github/workflows/train.yml"
  },
  {
    id: "wf-6",
    name: "Code Quality",
    repository: "api-service",
    status: "disabled",
    runs_count: 67,
    last_run: new Date(Date.now() - 86400000).toISOString(), // 1 day ago  
    success_rate: 94,
    path: ".github/workflows/quality.yml"
  }
];

export default function DemoWorkflowsPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredWorkflows = demoWorkflows.filter((workflow) =>
    workflow.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    workflow.repository.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

  const getSuccessRateColor = (rate: number) => {
    if (rate >= 95) return "text-green-600";
    if (rate >= 80) return "text-yellow-600";
    return "text-red-600";
  };

  const getSuccessRateBadge = (rate: number) => {
    if (rate >= 95) return "default";
    if (rate >= 80) return "secondary";
    return "destructive";
  };

  const activeWorkflows = filteredWorkflows.filter(w => w.status === 'active');
  const totalRuns = filteredWorkflows.reduce((sum, w) => sum + w.runs_count, 0);
  const avgSuccessRate = Math.round(
    filteredWorkflows.reduce((sum, w) => sum + w.success_rate, 0) / filteredWorkflows.length
  );

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
                <BreadcrumbPage>Workflows</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Workflows</h1>
          <p className="text-muted-foreground">
            Overview of GitHub Actions workflows across all repositories (Demo Mode)
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Workflows</CardTitle>
              <PlayCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredWorkflows.length}</div>
              <p className="text-xs text-muted-foreground">
                {activeWorkflows.length} active, {filteredWorkflows.length - activeWorkflows.length} disabled
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Runs</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalRuns}</div>
              <p className="text-xs text-muted-foreground">Across all workflows</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Success Rate</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getSuccessRateColor(avgSuccessRate)}`}>
                {avgSuccessRate}%
              </div>
              <p className="text-xs text-muted-foreground">Last 30 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Repositories</CardTitle>
              <GitBranch className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4</div>
              <p className="text-xs text-muted-foreground">With active workflows</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search workflows..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
          <Button disabled variant="outline">
            View Runs
          </Button>
        </div>

        {/* Workflows Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Workflow</TableHead>
                <TableHead>Repository</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Runs</TableHead>
                <TableHead>Success Rate</TableHead>
                <TableHead>Last Run</TableHead>
                <TableHead>Path</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredWorkflows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-24 text-center">
                    No workflows found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredWorkflows.map((workflow) => (
                  <TableRow key={workflow.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <PlayCircle className="h-4 w-4 text-muted-foreground" />
                        {workflow.name}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <GitBranch className="h-4 w-4 text-muted-foreground" />
                        {workflow.repository}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={workflow.status === 'active' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {workflow.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="font-medium">{workflow.runs_count}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant={getSuccessRateBadge(workflow.success_rate)} className="text-xs">
                          {workflow.success_rate}%
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatRelativeTime(workflow.last_run)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-1 py-0.5 rounded">
                        {workflow.path}
                      </code>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <p>
            Showing {filteredWorkflows.length} workflow{filteredWorkflows.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>
    </SidebarInset>
  );
}