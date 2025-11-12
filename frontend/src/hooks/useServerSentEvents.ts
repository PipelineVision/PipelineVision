import { useEffect, useRef, useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { usePreference } from "@/app/contexts/PreferenceContext";

export function useServerSentEvents() {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fallbackMode, setFallbackMode] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const fallbackIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastHeartbeatRef = useRef<number>(Date.now());
  const healthCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const retryCountRef = useRef(0);

  const queryClient = useQueryClient();
  const { preference } = usePreference();

  const MAX_RETRY_COUNT = 5;
  const BASE_RETRY_DELAY = 1000; // 1 second
  const MAX_RETRY_DELAY = 30000; // 30 seconds
  const HEARTBEAT_TIMEOUT = 60000; // 60 seconds
  const FALLBACK_POLLING_INTERVAL = 30000; // 30 seconds

  // Calculate exponential backoff delay
  const getRetryDelay = (count: number): number => {
    const delay = Math.min(
      BASE_RETRY_DELAY * Math.pow(2, count),
      MAX_RETRY_DELAY
    );
    // Add jitter to prevent thundering herd
    return delay + Math.random() * 1000;
  };

  // Invalidate queries as fallback when SSE is disconnected
  const performFallbackRefresh = useCallback(() => {
    if (!preference?.organization_id) return;

    // Invalidate key queries
    queryClient.invalidateQueries({
      queryKey: ["workflow-runs", preference.organization_id],
    });
    queryClient.invalidateQueries({
      queryKey: ["jobs"],
    });
    queryClient.invalidateQueries({
      queryKey: ["runners", preference.organization_id],
    });
  }, [preference?.organization_id, queryClient]);

  // Start fallback polling when SSE is disconnected
  const startFallbackPolling = useCallback(() => {
    if (fallbackIntervalRef.current) return; // Already running

    setFallbackMode(true);

    // Immediate refresh
    performFallbackRefresh();

    // Set up periodic refresh
    fallbackIntervalRef.current = setInterval(() => {
      performFallbackRefresh();
    }, FALLBACK_POLLING_INTERVAL);
  }, [performFallbackRefresh]);

  // Stop fallback polling when SSE reconnects
  const stopFallbackPolling = useCallback(() => {
    if (fallbackIntervalRef.current) {
      clearInterval(fallbackIntervalRef.current);
      fallbackIntervalRef.current = null;
      setFallbackMode(false);
    }
  }, []);

  // Health check to detect stale connections
  const startHealthCheck = useCallback(() => {
    if (healthCheckIntervalRef.current) return;

    healthCheckIntervalRef.current = setInterval(() => {
      const timeSinceLastHeartbeat = Date.now() - lastHeartbeatRef.current;

      if (timeSinceLastHeartbeat > HEARTBEAT_TIMEOUT) {
        console.warn("⚠️ SSE connection appears stale, forcing reconnect");
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
        }
      }
    }, HEARTBEAT_TIMEOUT / 2); // Check every 30 seconds
  }, []);

  const stopHealthCheck = useCallback(() => {
    if (healthCheckIntervalRef.current) {
      clearInterval(healthCheckIntervalRef.current);
      healthCheckIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!preference?.organization_id) {
      return;
    }

    const connectSSE = () => {
      // Clear any existing reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }

      // Check if we've exceeded max retries
      if (retryCountRef.current >= MAX_RETRY_COUNT) {
        console.error(
          "❌ Max SSE retry attempts reached, switching to fallback mode"
        );
        setError("Connection failed after multiple attempts");
        setIsConnected(false);
        startFallbackPolling();
        return;
      }

      try {
        const eventSource = new EventSource("/api/events");
        eventSourceRef.current = eventSource;

        eventSource.onopen = () => {
          setIsConnected(true);
          setError(null);
          retryCountRef.current = 0; // Reset retry count on successful connection
          setRetryCount(0);
          stopFallbackPolling(); // Stop fallback polling
          startHealthCheck(); // Start monitoring connection health
          lastHeartbeatRef.current = Date.now(); // Reset heartbeat timer
        };

        eventSource.onerror = () => {
          setIsConnected(false);
          stopHealthCheck(); // Stop health check

          // Close the current connection
          if (eventSource.readyState !== EventSource.CLOSED) {
            eventSource.close();
          }

          // Increment retry count and attempt reconnection
          retryCountRef.current += 1;
          const newRetryCount = retryCountRef.current;
          setRetryCount(newRetryCount);

          if (newRetryCount < MAX_RETRY_COUNT) {
            const delay = getRetryDelay(newRetryCount - 1);
            setError(
              `Connection lost, retrying in ${Math.round(delay / 1000)}s...`
            );

            reconnectTimeoutRef.current = setTimeout(() => {
              connectSSE();
            }, delay);
          } else {
            setError("Connection failed after multiple attempts");
            startFallbackPolling();
          }
        };

        // Handle all SSE events through the generic message handler
        eventSource.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            // Only log non-heartbeat events to reduce noise

            // Handle heartbeat
            if (data.type === "heartbeat") {
              lastHeartbeatRef.current = Date.now();
              return;
            }

            // Handle workflow run events
            if (data.type && data.type.startsWith("workflow_run_")) {
              queryClient.invalidateQueries({
                queryKey: ["workflow-runs", preference.organization_id],
              });

              queryClient.invalidateQueries({
                queryKey: ["dashboard", "stats", preference.organization_id],
              });

              // Also invalidate specific workflow run if we have the run_id
              if (data.run_id) {
                queryClient.invalidateQueries({
                  queryKey: [
                    "workflow-run",
                    preference.organization_id,
                    data.run_id,
                  ],
                });

                // Also invalidate with specific run_attempt if available
                if (data.run_attempt) {
                  queryClient.invalidateQueries({
                    queryKey: [
                      "workflow-run",
                      preference.organization_id,
                      data.run_id,
                      data.run_attempt,
                    ],
                  });
                }
              }

              // Force a refetch of the workflow runs list and dashboard stats
              queryClient.refetchQueries({
                queryKey: ["workflow-runs", preference.organization_id],
              });
              queryClient.refetchQueries({
                queryKey: ["dashboard", "stats", preference.organization_id],
              });
            }

            // Handle workflow job events
            if (data.type && data.type.startsWith("workflow_job_")) {
              // Invalidate specific workflow run details if open (includes jobs)
              if (data.run_id) {
                // Invalidate all workflow-run queries for this run_id regardless of attempt
                const baseQueryKey = [
                  "workflow-run",
                  preference.organization_id,
                  data.run_id,
                ];
                queryClient.invalidateQueries({ queryKey: baseQueryKey });

                // Also invalidate with specific run_attempt if available
                if (data.run_attempt) {
                  const specificQueryKey = [
                    "workflow-run",
                    preference.organization_id,
                    data.run_id,
                    data.run_attempt,
                  ];
                  queryClient.invalidateQueries({ queryKey: specificQueryKey });
                }

                // More aggressive: invalidate any workflow-run query that contains this run_id
                queryClient.invalidateQueries({
                  predicate: (query) => {
                    const isWorkflowRun = query.queryKey[0] === "workflow-run";
                    const matchesOrg =
                      query.queryKey[1] === preference.organization_id;
                    const matchesRunId = query.queryKey[2] === data.run_id;
                    const shouldInvalidate =
                      isWorkflowRun && matchesOrg && matchesRunId;
                    if (shouldInvalidate) {
                    }
                    return shouldInvalidate;
                  },
                });
              }

              // Invalidate general jobs queries (broader pattern to catch different keys)
              queryClient.invalidateQueries({
                queryKey: ["jobs"],
              });

              // Invalidate dashboard stats to update running jobs count
              queryClient.invalidateQueries({
                queryKey: ["dashboard", "stats", preference.organization_id],
              });

              // Force a refetch of the workflow runs list and dashboard stats to show job updates
              queryClient.refetchQueries({
                queryKey: ["workflow-runs", preference.organization_id],
              });
              queryClient.refetchQueries({
                queryKey: ["dashboard", "stats", preference.organization_id],
              });
            }

            // Handle legacy job_updated event (keep for compatibility)
            if (data.type === "job_updated") {
              if (data.run_id) {
                queryClient.invalidateQueries({
                  queryKey: [
                    "workflow-run",
                    preference.organization_id,
                    data.run_id,
                  ],
                });
              }

              queryClient.invalidateQueries({
                queryKey: ["jobs"],
              });

              // Invalidate dashboard stats to update running jobs count
              queryClient.invalidateQueries({
                queryKey: ["dashboard", "stats", preference.organization_id],
              });

              // Force a refetch of the workflow runs list and dashboard stats
              queryClient.refetchQueries({
                queryKey: ["workflow-runs", preference.organization_id],
              });
              queryClient.refetchQueries({
                queryKey: ["dashboard", "stats", preference.organization_id],
              });
            }
          } catch (e) {
            console.error(e);
          }
        };
      } catch (err) {
        console.error("Failed to create SSE connection:", err);
        setError("Failed to connect");
      }
    };

    connectSSE();

    return () => {
      // Cleanup all resources
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (fallbackIntervalRef.current) {
        clearInterval(fallbackIntervalRef.current);
        fallbackIntervalRef.current = null;
      }
      if (healthCheckIntervalRef.current) {
        clearInterval(healthCheckIntervalRef.current);
        healthCheckIntervalRef.current = null;
      }

      setIsConnected(false);
      setFallbackMode(false);
      setRetryCount(0);
      retryCountRef.current = 0;
      setError(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preference?.organization_id, queryClient]);

  return {
    isConnected,
    error,
    fallbackMode,
    retryCount,
    isRetrying: retryCount > 0 && retryCount < MAX_RETRY_COUNT,
  };
}

// Hook for components that want to show connection status
export function useSSEStatus() {
  const { isConnected, error, fallbackMode, isRetrying } =
    useServerSentEvents();

  const getStatusText = () => {
    if (fallbackMode) return "Polling Mode";
    if (isRetrying) return "Reconnecting...";
    if (error && !isRetrying) return "Disconnected";
    if (isConnected) return "Live";
    return "Connecting...";
  };

  const getStatusColor = () => {
    if (fallbackMode) return "orange";
    if (isRetrying) return "yellow";
    if (error && !isRetrying) return "red";
    if (isConnected) return "green";
    return "yellow";
  };

  return {
    isConnected,
    error,
    fallbackMode,
    isRetrying,
    statusText: getStatusText(),
    statusColor: getStatusColor(),
  };
}
