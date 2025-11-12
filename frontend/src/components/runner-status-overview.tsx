"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "./ui/skeleton";
import { CircleCheck, CircleOff, Clock, Server } from "lucide-react";
import { useRunnerStats } from "@/app/hooks/useRunners";
import React, { useState, useEffect } from "react";

export function RunnerStatusOverview() {
  const { data: stats, isLoading, error } = useRunnerStats();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setLoaded(true);
    }
  }, [isLoading]);

  if (error) {
    return <div>Error loading runner data</div>;
  }

  const renderCard = (
    title: string,
    icon: React.ReactNode,
    value: number | undefined
  ) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div
          className={`text-2xl font-bold transition-opacity duration-500 ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
        >
          {isLoading ? <Skeleton className="h-8 w-20" /> : value}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {renderCard(
        "Total Runners (Self Hosted)",
        <Server className="size-4 text-muted-foreground" />,
        stats?.total_runners
      )}
      {renderCard(
        "Online Runners",
        <CircleCheck className="size-4 text-green-500" />,
        stats?.online
      )}
      {renderCard(
        "Offline Runners",
        <CircleOff className="size-4 text-destructive" />,
        stats?.offline
      )}
      {renderCard(
        "Busy Runners",
        <Clock className="size-4 text-amber-500" />,
        stats?.busy
      )}
    </div>
  );
}
