"use client";

import { useRunners, useUpdateRunner } from "@/hooks/use-api-queries";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw } from "lucide-react";

export function RunnersListWithQuery() {
  const { data: runners, isLoading, error, refetch, isFetching } = useRunners();

  const updateRunnerMutation = useUpdateRunner();

  const handleRefresh = () => {
    refetch();
  };

  const handleToggleRunner = async (
    runnerId: string,
    currentStatus: string
  ) => {
    const newStatus = currentStatus === "online" ? "offline" : "online";

    try {
      await updateRunnerMutation.mutateAsync({
        runnerId,
        data: { status: newStatus as "online" | "offline" | "busy" },
      });
    } catch (error) {
      console.error("Failed to toggle runner:", error);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading Runners...</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <RefreshCw className="h-8 w-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Error Loading Runners</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-red-600 mb-4">
            {error instanceof Error ? error.message : "Unknown error occurred"}
          </p>
          <Button onClick={handleRefresh} variant="outline">
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>GitHub Runners</CardTitle>
        <Button
          onClick={handleRefresh}
          variant="outline"
          size="sm"
          disabled={isFetching}
        >
          <RefreshCw
            className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </CardHeader>
      <CardContent>
        {!runners || runners.length === 0 ? (
          <p className="text-muted-foreground">No runners found</p>
        ) : (
          <div className="space-y-4">
            {runners.map((runner) => (
              <div
                key={runner.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div>
                    <h3 className="font-medium">{runner.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {runner.os} • {runner.labels.join(", ")}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Badge
                    variant={
                      runner.status === "online"
                        ? "default"
                        : runner.status === "busy"
                        ? "secondary"
                        : "outline"
                    }
                  >
                    {runner.status}
                  </Badge>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleToggleRunner(runner.id, runner.status)}
                    disabled={updateRunnerMutation.isPending}
                  >
                    {updateRunnerMutation.isPending ? "..." : "Toggle"}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
