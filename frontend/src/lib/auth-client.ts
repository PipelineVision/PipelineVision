import { createAuthClient } from "better-auth/react";

// Get the correct base URL for the auth client
const getBaseURL = () => {
  if (typeof window !== "undefined") {
    // Client-side: use current origin
    return window.location.origin;
  }
  
  // Server-side: use environment variable or fallback
  return process.env.NEXT_PUBLIC_BETTER_AUTH_URL || 
         process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 
         "http://localhost:3000";
};

export const authClient = createAuthClient({
  baseURL: getBaseURL(),
  fetchOptions: {
    onError(e) {
      console.error("Auth client error:", e);
    },
  },
});

export const { signIn, signUp, signOut, useSession } = authClient;
