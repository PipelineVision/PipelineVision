"use client";

import { useSession } from "@/lib/auth-client";
import { useCallback } from "react";

export function useAuthenticatedFetch() {
  const { data: session } = useSession();

  const authenticatedFetch = useCallback(
    async (url: string, options: RequestInit = {}) => {
      if (!session?.user) {
        throw new Error("No active session");
      }

      if (!session.session?.token) {
        throw new Error("Invalid session token");
      }

      const sessionToken = session.session.token;

      const response = await fetch(url, {
        ...options,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          "X-User-ID": session.user.id,
          Authorization: `Bearer ${sessionToken}`,
          ...options.headers, // Allow custom headers to override defaults
        },
      });

      if (response.status === 401) {
        // Handle session expiration
        throw new Error("Session expired");
      }

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Unknown error");
        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
      }

      return response;
    },
    [session]
  );

  return {
    authenticatedFetch,
    isAuthenticated: !!session?.user,
    user: session?.user,
  };
}
