"use client";

import { useAuthenticatedFetch } from "@/hooks/use-authenticated-fetch";
import { useEffect, useState } from "react";

interface Runner {
  id: string;
  name: string;
  status: string;
  // Add other runner properties as needed
}

export function RunnersList() {
  const { authenticatedFetch, isAuthenticated, user } = useAuthenticatedFetch();
  const [runners, setRunners] = useState<Runner[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchRunners = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await authenticatedFetch("/api/runner");
        const data = await response.json();
        setRunners(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch runners"
        );
      } finally {
        setLoading(false);
      }
    };

    fetchRunners();
  }, [isAuthenticated, authenticatedFetch]);

  if (!isAuthenticated) {
    return <div>Please log in to view runners</div>;
  }

  if (loading) {
    return <div>Loading runners...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  return (
    <div>
      <h2>Runners for {user?.email}</h2>
      {runners.length === 0 ? (
        <p>No runners found</p>
      ) : (
        <ul>
          {runners.map((runner) => (
            <li key={runner.id}>
              {runner.name} - {runner.status}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
