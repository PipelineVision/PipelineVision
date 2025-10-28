/* eslint-disable @typescript-eslint/no-unused-vars */
import { formatDistanceToNow, format } from "date-fns";

/**
 * Format a UTC date string to local time
 */
export function formatToLocalTime(dateString?: string): string {
  if (!dateString) return "—";

  try {
    const date = new Date(dateString);
    // Check if date is valid
    if (isNaN(date.getTime())) return "—";

    return format(date, "MMM d, yyyy HH:mm");
  } catch (error) {
    console.warn("Invalid date string:", dateString);
    return "—";
  }
}

/**
 * Format relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(dateString?: string): string {
  if (!dateString) return "—";

  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "—";

    return formatDistanceToNow(date, { addSuffix: true });
  } catch (error) {
    console.warn("Invalid date string:", dateString);
    return "—";
  }
}

/**
 * Calculate and format duration between two timestamps
 */
export function formatDuration(
  startedAt?: string,
  completedAt?: string
): string {
  if (!startedAt || !completedAt) return "—";

  try {
    const start = new Date(startedAt);
    const end = new Date(completedAt);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) return "—";

    const diffMs = end.getTime() - start.getTime();

    if (diffMs < 0) return "—"; // Invalid duration

    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);

    if (diffHours > 0) {
      const remainingMins = diffMins % 60;
      return `${diffHours}h ${remainingMins}m`;
    } else if (diffMins > 0) {
      const remainingSecs = diffSecs % 60;
      return `${diffMins}m ${remainingSecs}s`;
    } else {
      return `${diffSecs}s`;
    }
  } catch (error) {
    console.warn("Invalid dates for duration:", { startedAt, completedAt });
    return "—";
  }
}
