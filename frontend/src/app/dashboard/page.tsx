"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SidebarInset } from "@/components/ui/sidebar";
import { useSession } from "@/lib/auth-client";
import { useAuthenticatedFetch } from "@/hooks/use-authenticated-fetch";
import { usePreference } from "@/app/contexts/PreferenceContext";
import { useOnboardingState } from "@/app/hooks/useOnboardingState";
import { OnboardingScreen } from "@/components/onboarding-screen";
import {
  Loader2,
  CheckCircle,
  Activity,
  GitBranch,
  Clock,
  TrendingUp,
  CheckCircle2,
  XCircle,
} from "lucide-react";

interface DashboardStats {
  total_runs: number;
  successful_runs: number;
  failed_runs: number;
  in_progress_runs: number;
  total_repositories: number;
  avg_duration_minutes: number | null;
}

interface WorkflowRunSummary {
  id: number;
  run_id: string;
  run_number: number;
  workflow_name: string;
  repository_name: string;
  repository_full_name: string;
  status: string;
  conclusion: string | null;
  event: string;
  head_branch: string;
  head_sha: string;
  url: string;
  started_at: string | null;
  completed_at: string | null;
  duration_seconds: number | null;
}

interface Repository {
  id: number;
  name: string;
  full_name: string;
  owner: string;
  total_runs: number;
  successful_runs: number;
  failed_runs: number;
  success_rate: number;
  last_run_at: string | null;
}

export default function DashboardPage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();
  const [showWelcome, setShowWelcome] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { authenticatedFetch } = useAuthenticatedFetch();
  const { preference } = usePreference();
  const {
    needsOnboarding,
    isLoading: onboardingLoading,
    refetchMemberships,
  } = useOnboardingState();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard", "stats", preference?.organization_id],
    queryFn: async (): Promise<DashboardStats> => {
      const response = await authenticatedFetch("/api/dashboard/stats");
      if (!response.ok) throw new Error("Failed to fetch stats");
      return response.json();
    },
    enabled: !!session?.user && !!preference?.organization_id,
    refetchInterval: 15000,
  });

  const { data: recentRuns, isLoading: runsLoading } = useQuery({
    queryKey: ["dashboard", "workflow-runs", preference?.organization_id],
    queryFn: async (): Promise<WorkflowRunSummary[]> => {
      const response = await authenticatedFetch(
        "/api/dashboard/workflow-runs?limit=10"
      );
      if (!response.ok) throw new Error("Failed to fetch workflow runs");
      return response.json();
    },
    enabled: !!session?.user && !!preference?.organization_id,
    refetchInterval: 10000,
  });

  const { data: repositories, isLoading: reposLoading } = useQuery({
    queryKey: ["dashboard", "repositories", preference?.organization_id],
    queryFn: async (): Promise<Repository[]> => {
      const response = await authenticatedFetch("/api/dashboard/repositories");
      if (!response.ok) throw new Error("Failed to fetch repositories");
      return response.json();
    },
    enabled: !!session?.user && !!preference?.organization_id,
    refetchInterval: 60000,
  });

  // TODO: Seems to be a bug soemtimes that causes welcome message to stay and not properly be removed
  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login");
    } else if (session?.user) {
      const welcomeShownKey = `welcome_shown_${session.user.id}`;
      const lastWelcomeShown = localStorage.getItem(welcomeShownKey);

      if (!lastWelcomeShown) {
        setShowWelcome(true);
        localStorage.setItem(welcomeShownKey, "shown");
        setTimeout(() => setShowWelcome(false), 3000);
      }
    }
  }, [session, isPending, router]);

  useEffect(() => {
    const handleBeforeUnload = () => {
      return;
    };

    if (!session?.user && !isPending) {
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("welcome_shown_")) {
          localStorage.removeItem(key);
        }
      });
    }

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [session?.user, isPending]);

  const handleOnboardingRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetchMemberships();
    } finally {
      setIsRefreshing(false);
    }
  };

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

  if (isPending || onboardingLoading) {
    return (
      <SidebarInset>
        <div className="flex-1 flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            <p className="text-gray-600 dark:text-gray-400">
              Loading dashboard...
            </p>
          </div>
        </div>
      </SidebarInset>
    );
  }

  if (!session?.user) {
    return null;
  }

  if (needsOnboarding) {
    return (
      <OnboardingScreen
        onRefresh={handleOnboardingRefresh}
        isRefreshing={isRefreshing}
      />
    );
  }

  return (
    <SidebarInset>
      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
        {showWelcome && (
          <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right-2 duration-300">
            <Card className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
              <CardContent className="flex items-center space-x-2 p-4">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <span className="text-green-800 dark:text-green-200 font-medium">
                  Welcome back, {session.user.name || session.user.email}!
                </span>
              </CardContent>
            </Card>
          </div>
        )}

        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Overview of your GitHub Actions workflow activity
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Runs</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {statsLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  stats?.total_runs || 0
                )}
              </div>
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
                {statsLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  `${
                    stats?.total_runs
                      ? Math.round(
                          (stats.successful_runs / stats.total_runs) * 100
                        )
                      : 0
                  }%`
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {stats?.successful_runs || 0} of {stats?.total_runs || 0}{" "}
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
              <div className="text-2xl font-bold">
                {statsLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  stats?.total_repositories || 0
                )}
              </div>
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
              <div className="text-2xl font-bold">
                {statsLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : stats?.avg_duration_minutes ? (
                  `${Math.round(stats.avg_duration_minutes)}m`
                ) : (
                  "—"
                )}
              </div>
              <p className="text-xs text-muted-foreground">Per workflow run</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Recent Workflow Runs</CardTitle>
              <CardDescription>
                Latest activity across all repositories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {runsLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : recentRuns?.length ? (
                  recentRuns.slice(0, 8).map((run) => (
                    <div
                      key={run.id}
                      className="flex items-center space-x-3 text-sm"
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
                          {run.repository_name} • #{run.run_number}
                        </div>
                      </div>
                      <div className="flex-shrink-0 text-muted-foreground">
                        {formatRelativeTime(run.started_at)}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground py-6 text-center">
                    No recent workflow runs
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-1">
            <CardHeader>
              <CardTitle>Repository Activity</CardTitle>
              <CardDescription>
                Most active repositories (last 30 days)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {reposLoading ? (
                  <div className="flex items-center justify-center py-6">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : repositories?.length ? (
                  repositories.slice(0, 8).map((repo) => (
                    <div
                      key={repo.id}
                      className="flex items-center justify-between text-sm"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{repo.name}</div>
                        <div className="text-muted-foreground">
                          {repo.total_runs} runs • {repo.success_rate}% success
                        </div>
                      </div>
                      <div className="flex-shrink-0 ml-2">
                        <Badge
                          variant={
                            repo.success_rate >= 80 ? "default" : "secondary"
                          }
                          className="text-xs"
                        >
                          {repo.success_rate}%
                        </Badge>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground py-6 text-center">
                    No repository activity
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {stats && (
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
                  <span className="text-sm font-medium">
                    {stats.in_progress_runs} Running
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  <span className="text-sm font-medium">
                    {stats.successful_runs} Successful
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <XCircle className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium">
                    {stats.failed_runs} Failed
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <GitBranch className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    {stats.total_repositories} Repositories
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </SidebarInset>
  );
}
