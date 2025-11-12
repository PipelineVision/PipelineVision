"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { useSSEStatus } from "@/hooks/useServerSentEvents";
import { Wifi, WifiOff, Loader2, RotateCcw, Clock } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function LiveStatusIndicator() {
  const { isConnected, error, statusText, fallbackMode, isRetrying } =
    useSSEStatus();

  const getIcon = () => {
    if (fallbackMode) return <Clock className="h-3 w-3" />;
    if (isRetrying) return <RotateCcw className="h-3 w-3 animate-spin" />;
    if (error && !isRetrying) return <WifiOff className="h-3 w-3" />;
    if (isConnected) return <Wifi className="h-3 w-3" />;
    return <Loader2 className="h-3 w-3 animate-spin" />;
  };

  const getVariant = () => {
    if (fallbackMode) return "outline" as const;
    if (isRetrying) return "secondary" as const;
    if (error && !isRetrying) return "destructive" as const;
    if (isConnected) return "default" as const;
    return "secondary" as const;
  };

  const getTooltipText = () => {
    if (fallbackMode)
      return "Real-time connection lost. Using periodic updates every 30 seconds.";
    if (isRetrying) return "Connection lost, attempting to reconnect...";
    if (error && !isRetrying)
      return "Connection failed after multiple attempts. Data may be stale.";
    if (isConnected) return "Real-time updates active via server-sent events.";
    return "Establishing connection...";
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge variant={getVariant()} className="text-xs gap-1 cursor-help">
          {getIcon()}
          {statusText}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>
        <p>{getTooltipText()}</p>
      </TooltipContent>
    </Tooltip>
  );
}
