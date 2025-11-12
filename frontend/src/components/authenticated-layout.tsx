"use client";

import type React from "react";
import { useSession } from "@/lib/auth-client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useEffect, Suspense } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useServerSentEvents } from "@/hooks/useServerSentEvents";
import { useAutomaticMemberships } from "@/app/hooks/useAutomaticMemberships";

interface AuthenticatedLayoutProps {
  children: React.ReactNode;
}

function AuthenticatedLayoutContent({ children }: AuthenticatedLayoutProps) {
  const { data: session, isPending } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  useServerSentEvents();

  const { processing: processingMemberships } = useAutomaticMemberships();

  const isReturningUser =
    searchParams.get("callbackUrl") || pathname.includes("callback");

  const protectedRoutes = [
    "/dashboard",
    "/workflows",
    "/runners",
    "/jobs",
    "/account",
  ];
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  useEffect(() => {
    if (!isPending) {
      if (!session?.user && isProtectedRoute) {
        router.push(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
        return;
      }

      if (session?.user && pathname === "/login") {
        const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
        router.replace(callbackUrl);
        return;
      }
    }
  }, [session, isPending, pathname, router, isProtectedRoute, searchParams]);

  if (isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-primary rounded-xl flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">
              {isReturningUser ? "Welcome back!" : "Pipeline Vision"}
            </h3>
            <p className="text-muted-foreground">
              {isReturningUser ? "Setting up your dashboard..." : "Loading..."}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!session?.user && isProtectedRoute) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-6">
          <div className="mx-auto w-16 h-16 bg-primary rounded-xl flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
          </div>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">
              Authentication Required
            </h3>
            <p className="text-muted-foreground">Redirecting to sign in...</p>
          </div>
        </div>
      </div>
    );
  }

  const excludeSidebarPages = ["/", "/docs", "/login"];
  const shouldShowSidebar =
    session?.user && !excludeSidebarPages.includes(pathname);

  if (shouldShowSidebar) {
    return (
      <SidebarProvider>
        <AppSidebar />
        {processingMemberships && (
          <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right-2 duration-300">
            <Card className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <CardContent className="flex items-center space-x-2 p-4">
                <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />
                <span className="text-blue-800 dark:text-blue-200 font-medium">
                  Setting up your organizations...
                </span>
              </CardContent>
            </Card>
          </div>
        )}
        {children}
      </SidebarProvider>
    );
  }

  return <>{children}</>;
}

export function AuthenticatedLayout({ children }: AuthenticatedLayoutProps) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-primary rounded-xl flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-foreground">
                Pipeline Vision
              </h3>
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </div>
        </div>
      }
    >
      <AuthenticatedLayoutContent>{children}</AuthenticatedLayoutContent>
    </Suspense>
  );
}
