"use client";

export const dynamic = 'force-dynamic';

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SidebarInset } from "@/components/ui/sidebar";
import {
  Activity,
  CheckCircle2,
  XCircle,
  Clock,
  GitBranch,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { useDemo } from "@/contexts/demo-context";
// import { DemoWorkflowRunDetails } from "@/components/demo-workflow-run-details";

export default function DemoPage() {
  const { demoData } = useDemo();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  const stats = demoData.stats;
  const workflowRuns = demoData.workflowRuns;

  // Same utility functions as real dashboard
  const getStatusColor = (status: string, conclusion?: string | null) => {
    if (status === "in_progress") return "bg-muted";
    if (status === "queued") return "bg-yellow-500";
    if (conclusion === "success") return "bg-green-500";
    if (conclusion === "failure") return "bg-red-500";
    if (conclusion === "cancelled") return "bg-gray-500";
    return "bg-gray-400";
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

  return (
    <SidebarInset>
      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your GitHub Actions workflow activity (Demo Mode)
          </p>
        </div>

        {/* Stats Cards - Same as Real Dashboard */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Runs</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.workflows.total}</div>
              <p className="text-xs text-muted-foreground">Last 7 days</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Success Rate
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.workflows.success_rate}%
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.workflows.successful} of {stats.workflows.total}{" "}
                successful
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Active Repositories
              </CardTitle>
              <GitBranch className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4</div>
              <p className="text-xs text-muted-foreground">
                With recent activity
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Avg Duration
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">4m</div>
              <p className="text-xs text-muted-foreground">Per workflow run</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {/* Recent Workflow Runs - Same as Real Dashboard */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Recent Workflow Runs</CardTitle>
              <CardDescription>
                Latest activity across all repositories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {workflowRuns.slice(0, 8).map((run) => (
                  <div
                    key={run.id}
                    className="flex items-center space-x-3 text-sm hover:bg-muted/50 p-2 rounded-md cursor-pointer transition-colors"
                    onClick={() => setSelectedRunId(run.id)}
                  >
                    <div className="flex-shrink-0">
                      <div
                        className={`w-2 h-2 rounded-full ${getStatusColor(
                          run.status,
                          run.conclusion
                        )}`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {run.workflow_name}
                      </div>
                      <div className="text-muted-foreground truncate">
                        {run.repository.replace("acme-corp/", "")} • #
                        {Math.floor(Math.random() * 100) + 1}
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-muted-foreground">
                      {formatRelativeTime(run.updated_at)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Repository Activity - Same as Real Dashboard */}
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Repository Activity</CardTitle>
              <CardDescription>
                Most active repositories (last 30 days)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">web-app</div>
                    <div className="text-muted-foreground">
                      12 runs • 92% success
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-2">
                    <Badge variant="default" className="text-xs">
                      92%
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">api-service</div>
                    <div className="text-muted-foreground">
                      8 runs • 100% success
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-2">
                    <Badge variant="default" className="text-xs">
                      100%
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">mobile-app</div>
                    <div className="text-muted-foreground">
                      5 runs • 80% success
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-2">
                    <Badge variant="secondary" className="text-xs">
                      80%
                    </Badge>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">ml-models</div>
                    <div className="text-muted-foreground">
                      3 runs • 67% success
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-2">
                    <Badge variant="secondary" className="text-xs">
                      67%
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Current Status Summary - Same as Real Dashboard */}
        <Card>
          <CardHeader>
            <CardTitle>Current Status</CardTitle>
            <CardDescription>
              Real-time overview of workflow activity
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex items-center space-x-2">
                <Loader2 className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">2 Running</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span className="text-sm font-medium">
                  {stats.workflows.successful} Successful
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <XCircle className="h-4 w-4 text-red-500" />
                <span className="text-sm font-medium">
                  {stats.workflows.failed} Failed
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <GitBranch className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">4 Repositories</span>
              </div>
            </div>
          </CardContent>
        </Card>
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
