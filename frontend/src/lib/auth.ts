import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import * as schema from "./schema";

const trustedOrigins = [
  // Automatic Vercel deployments
  ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
  // Auth base URL
  ...(process.env.BETTER_AUTH_URL ? [process.env.BETTER_AUTH_URL] : []),
  // Additional trusted origins from environment
  ...(process.env.TRUSTED_ORIGINS
    ? process.env.TRUSTED_ORIGINS.split(",").map((o) => o.trim())
    : []),
  // Local development
  "http://localhost:3000",
  // Production domains (customize for your deployment)
  "https://pipelinevision.app",
  "https://www.pipelinevision.app",
];

const uniqueTrustedOrigins = [...new Set(trustedOrigins.filter(Boolean))];

console.log("Trusted origins:", uniqueTrustedOrigins);

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.authUser,
      session: schema.authSession,
      account: schema.authAccount,
      verification: schema.authVerification,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID as string,
      clientSecret: process.env.GITHUB_CLIENT_SECRET as string,
      scope: ["read:org", "user:email"],
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60 * 24 * 7,
    },
  },
  cookies: {
    sessionToken: {
      name: "better-auth.session_token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
      },
    },
  },
  secret: process.env.BETTER_AUTH_SECRET as string,
  baseURL: process.env.BETTER_AUTH_URL ||
           (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"),
  trustedOrigins: uniqueTrustedOrigins,
  callbacks: {
    after: [
      {
        matcher: (ctx: { path: string }) =>
          ctx.path === "/api/auth/callback/github",
        handler: async (ctx: { baseURL: unknown }) => {
          // Redirect to our custom callback page which will handle the final redirect
          return Response.redirect(`${ctx.baseURL}/auth/callback`);
        },
      },
    ],
  },
});
