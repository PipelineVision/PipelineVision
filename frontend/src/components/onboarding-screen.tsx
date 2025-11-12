"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SidebarInset } from "@/components/ui/sidebar";
import {
  Github,
  ExternalLink,
  CheckCircle2,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Zap,
} from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { useAuthenticatedFetch } from "@/hooks/use-authenticated-fetch";
import { usePreference } from "@/app/contexts/PreferenceContext";

interface OnboardingScreenProps {
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export function OnboardingScreen({
  onRefresh,
  isRefreshing = false,
}: OnboardingScreenProps) {
  const { data: session } = useSession();
  const { authenticatedFetch } = useAuthenticatedFetch();
  const { refetch: refetchPreference } = usePreference();
  const [step, setStep] = useState<1 | 2>(1);

  const handleInstallApp = () => {
    // Open GitHub Apps page - user will need to find and install the correct app
    // TODO: Replace with actual GitHub App URL once deployed
    window.open("https://github.com/apps", "_blank");
    setStep(2);
  };

  const handleRefresh = async () => {
    setStep(1); // Reset to step 1 for next attempt

    // Also trigger automatic membership processing for existing users
    try {
      const response = await authenticatedFetch(
        "/api/accounts/process-automatic-memberships",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.ok) {
        const result = await response.json();

        // If organizations were added, refresh preferences
        if (
          result.organizations_added &&
          result.organizations_added.length > 0
        ) {
          await refetchPreference();
        }
      }
    } catch (error) {
      console.warn("Error during manual membership processing:", error);
    }

    // Always call the provided refresh function
    onRefresh();
  };

  return (
    <SidebarInset>
      <div className="flex-1 space-y-6 p-4 md:p-8 pt-6">
        <div className="text-center space-y-2">
          <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-xl flex items-center justify-center mb-4">
            <Github className="h-8 w-8 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">
            Welcome to GitHub Runner Dashboard!
          </h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            To get started, you&apos;ll need to install our GitHub App on your
            organization or personal repositories.
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Step 1: Install GitHub App */}
            <Card
              className={`relative ${step === 1 ? "ring-2 ring-blue-500" : ""}`}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                      <span className="text-sm font-bold text-blue-600">1</span>
                    </div>
                    Install GitHub App
                  </CardTitle>
                  <Badge variant={step === 2 ? "default" : "secondary"}>
                    {step === 2 ? "Completed" : "Required"}
                  </Badge>
                </div>
                <CardDescription>
                  Install our GitHub App on your organization or personal
                  repositories to enable runner monitoring.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">What the app can do:</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        Monitor GitHub Actions workflows
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        Track runner usage and performance
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        Access job logs and statistics
                      </li>
                    </ul>
                  </div>

                  <Button
                    onClick={handleInstallApp}
                    className="w-full"
                    disabled={step === 2}
                  >
                    {step === 2 ? (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        App Installed
                      </>
                    ) : (
                      <>
                        <Github className="mr-2 h-4 w-4" />
                        Install GitHub App
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Step 2: Refresh Dashboard */}
            <Card
              className={`relative ${
                step === 2 ? "ring-2 ring-blue-500" : "opacity-60"
              }`}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                      <span className="text-sm font-bold text-green-600">
                        2
                      </span>
                    </div>
                    Refresh Dashboard
                  </CardTitle>
                  <Badge variant={step === 2 ? "default" : "secondary"}>
                    {step === 2 ? "Ready" : "Waiting"}
                  </Badge>
                </div>
                <CardDescription>
                  After installing the app, refresh your dashboard to see your
                  organization&apos;s data.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium">You&apos;ll get access to:</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-yellow-500" />
                        Real-time workflow monitoring
                      </li>
                      <li className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-yellow-500" />
                        Runner performance analytics
                      </li>
                      <li className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-yellow-500" />
                        Detailed job execution logs
                      </li>
                    </ul>
                  </div>

                  <Button
                    onClick={handleRefresh}
                    className="w-full"
                    disabled={step === 1 || isRefreshing}
                  >
                    {isRefreshing ? (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                        Checking for Organizations...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Refresh Dashboard
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Help Section */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-blue-600" />
                Need Help?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <h4 className="font-medium mb-2">For Organization Owners:</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Install the app on your organization to give your team
                    access to runner monitoring.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Signed in as:{" "}
                    <span className="font-medium">
                      {session?.user?.name || session?.user?.email}
                    </span>
                  </p>
                </div>
                <div>
                  <h4 className="font-medium mb-2">For Team Members:</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Ask your organization owner to install the GitHub App, then
                    refresh this page.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    You&apos;ll automatically get access once the app is
                    installed.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </SidebarInset>
  );
}
