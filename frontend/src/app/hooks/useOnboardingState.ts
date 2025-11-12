import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/lib/auth-client";
import { useAuthenticatedFetch } from "@/hooks/use-authenticated-fetch";

export type OnboardingState =
  | "loading"
  | "complete"
  | "no_memberships"
  | "processing";

export function useOnboardingState() {
  const { data: session, isPending } = useSession();
  const { authenticatedFetch } = useAuthenticatedFetch();

  const {
    data: memberships,
    isLoading: membershipsLoading,
    refetch: refetchMemberships,
  } = useQuery({
    queryKey: ["onboarding", "memberships", session?.user?.id],
    queryFn: async () => {
      const response = await authenticatedFetch("/api/account/memberships");
      if (!response.ok) throw new Error("Failed to fetch memberships");
      return response.json();
    },
    enabled: !!session?.user,
    retry: 1,
  });

  const { data: preferences, isLoading: preferencesLoading } = useQuery({
    queryKey: ["onboarding", "preferences", session?.user?.id],
    queryFn: async () => {
      const response = await authenticatedFetch("/api/account/preferences");
      if (!response.ok) throw new Error("Failed to fetch preferences");
      return response.json();
    },
    enabled: !!session?.user,
    retry: 1,
  });

  const getOnboardingState = (): OnboardingState => {
    if (isPending) {
      return "loading";
    }

    if (!session?.user) {
      return "loading";
    }

    if (membershipsLoading || preferencesLoading) {
      return "complete";
    }

    if (!memberships || memberships.length === 0) {
      return "no_memberships";
    }

    return "complete";
  };

  const state = getOnboardingState();

  return {
    state,
    memberships,
    preferences,
    isLoading: state === "loading",
    needsOnboarding: state === "no_memberships",
    isComplete: state === "complete",
    refetchMemberships,
  };
}
