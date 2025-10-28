"use client";

import type React from "react";
import { useOnboardingState } from "@/app/hooks/useOnboardingState";
import { OnboardingScreen } from "@/components/onboarding-screen";
import { SidebarInset } from "@/components/ui/sidebar";
import { Loader2 } from "lucide-react";
import { useState } from "react";

interface LayoutWithOnboardingProps {
  children: React.ReactNode;
  loadingMessage?: string;
}

export function LayoutWithOnboarding({ 
  children, 
  loadingMessage = "Loading..." 
}: LayoutWithOnboardingProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { 
    needsOnboarding, 
    isLoading: onboardingLoading, 
    refetchMemberships 
  } = useOnboardingState();

  // Handle onboarding refresh
  const handleOnboardingRefresh = async () => {
    setIsRefreshing(true);
    try {
      await refetchMemberships();
    } finally {
      setIsRefreshing(false);
    }
  };

  if (onboardingLoading) {
    return (
      <SidebarInset>
        <div className="flex-1 flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-muted-foreground" />
            <p className="text-gray-600 dark:text-gray-400">{loadingMessage}</p>
          </div>
        </div>
      </SidebarInset>
    );
  }

  if (needsOnboarding) {
    return <OnboardingScreen onRefresh={handleOnboardingRefresh} isRefreshing={isRefreshing} />;
  }

  return <>{children}</>;
}