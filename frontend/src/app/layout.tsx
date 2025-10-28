import { ThemeProvider } from "@/components/theme-provider";
import { QueryProvider } from "./providers/tanstack-query-provider";
import { AuthenticatedLayout } from "@/components/authenticated-layout";
import { PreferenceProvider } from "./contexts/PreferenceContext";
import { ErrorBoundary } from "@/components/error-boundary";
import { getPreference } from "@/lib/user-preferences";
import type React from "react";
import "./globals.css";

export const metadata = {
  title: "Pipeline Vision - GitHub Runner Dashboard",
  description: "Enhanced management of self-hosted GitHub Actions runners",
};

// Force dynamic rendering for all pages to prevent build-time session access
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

// TODO: Only show the appside bar after the user is logged in
export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const preference = await getPreference();
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-screen bg-background font-sans antialiased">
        <ErrorBoundary>
          <PreferenceProvider initialPreference={preference}>
            <QueryProvider>
              <ThemeProvider
                attribute="class"
                defaultTheme="system"
                enableSystem
                disableTransitionOnChange
              >
                <AuthenticatedLayout>{children}</AuthenticatedLayout>
              </ThemeProvider>
            </QueryProvider>
          </PreferenceProvider>
        </ErrorBoundary>
      </body>
    </html>
  );
}
