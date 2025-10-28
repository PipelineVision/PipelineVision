// /**
//  * Smart polling configuration based on context and user activity
//  */

// export const POLLING_CONFIG = {
//   // Base intervals
//   ACTIVE_RUNS: 10 * 1000,      // 10s for active workflows
//   RECENT_RUNS: 30 * 1000,      // 30s for recently completed
//   OLDER_RUNS: 5 * 60 * 1000,   // 5min for older workflows
//   BACKGROUND: 2 * 60 * 1000,   // 2min when tab not visible

//   // Stale times
//   FRESH_DATA: 15 * 1000,       // 15s for fresh data
//   STABLE_DATA: 60 * 1000,      // 1min for stable data
// } as const;

// /**
//  * Determine polling interval based on workflow run states
//  */
// export function getPollingInterval(workflowRuns?: any[]): number {
//   if (!workflowRuns?.length) return POLLING_CONFIG.OLDER_RUNS;

//   // Check for active runs
//   const hasActiveRuns = workflowRuns.some(run =>
//     run.status === 'in_progress' || run.status === 'queued'
//   );

//   if (hasActiveRuns) return POLLING_CONFIG.ACTIVE_RUNS;

//   // Check for recently completed runs (last 10 minutes)
//   const tenMinutesAgo = Date.now() - (10 * 60 * 1000);
//   const hasRecentRuns = workflowRuns.some(run =>
//     run.completed_at && new Date(run.completed_at).getTime() > tenMinutesAgo
//   );

//   if (hasRecentRuns) return POLLING_CONFIG.RECENT_RUNS;

//   return POLLING_CONFIG.OLDER_RUNS;
// }

// /**
//  * Adjust polling based on page visibility
//  */
// export function useVisibilityAwarePolling() {
//   const [isVisible, setIsVisible] = React.useState(!document.hidden);

//   React.useEffect(() => {
//     const handleVisibilityChange = () => {
//       setIsVisible(!document.hidden);
//     };

//     document.addEventListener('visibilitychange', handleVisibilityChange);
//     return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
//   }, []);

//   return isVisible;
// }
