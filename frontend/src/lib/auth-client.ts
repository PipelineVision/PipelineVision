import { createAuthClient } from "better-auth/react";

const getAuthBaseURL = () => {
  if (typeof window === "undefined") {
    return process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000";
  }

  const origin = window.location.origin;

  if (origin.includes("vercel.app") && process.env.NODE_ENV === "production") {
    return "https://pipelinevision.app";
  }

  return origin;
};

export const authClient = createAuthClient({
  baseURL: getAuthBaseURL(),
  fetchOptions: {
    onError(e) {
      console.error("Auth client error:", e);
    },
  },
});

export const { signIn, signUp, signOut, useSession } = authClient;
