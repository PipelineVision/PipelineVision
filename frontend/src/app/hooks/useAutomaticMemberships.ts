import { useEffect, useState } from "react";
import { useSession } from "@/lib/auth-client";
import { useAuthenticatedFetch } from "@/hooks/use-authenticated-fetch";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { usePreference } from "@/app/contexts/PreferenceContext";

export function useAutomaticMemberships() {
  const { data: session } = useSession();
  const { authenticatedFetch } = useAuthenticatedFetch();
  const { refetch: refetchPreference } = usePreference();
  const queryClient = useQueryClient();
  const [processed, setProcessed] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Check if user has existing memberships
  const { data: existingMemberships, isLoading: membershipsLoading } = useQuery(
    {
      queryKey: ["account", "memberships", session?.user?.id],
      queryFn: async () => {
        const response = await authenticatedFetch("/api/account/memberships");
        if (!response.ok) throw new Error("Failed to fetch memberships");
        return response.json();
      },
      enabled: !!session?.user,
      retry: 1,
    }
  );

  useEffect(() => {
    let cancelled = false;

    const processAutomaticMemberships = async () => {
      if (!session?.user || cancelled || membershipsLoading) {
        return;
      }

      const shouldShowProcessing =
        !existingMemberships || existingMemberships.length === 0;

      if (existingMemberships && existingMemberships.length > 0) {
        return;
      }

      if (processing) {
        return;
      }

      try {
        if (!cancelled && shouldShowProcessing) {
          setProcessing(true);
        }

        // TODO: Delay might need to be invcreased.
        const minimumDelay = shouldShowProcessing ? 1500 : 0;
        const [response] = await Promise.all([
          authenticatedFetch("/api/accounts/process-automatic-memberships", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          }),
          new Promise((resolve) => setTimeout(resolve, minimumDelay)),
        ]);

        if (response.ok) {
          const result = await response.json();

          if (!cancelled) {
            if (
              result.organizations_added &&
              result.organizations_added.length > 0
            ) {
              queryClient.invalidateQueries({ queryKey: ["onboarding"] });
              queryClient.invalidateQueries({ queryKey: ["account"] });

              await refetchPreference();
            }
          }
        } else {
          console.warn(
            "Failed to process automatic memberships:",
            response.statusText
          );
        }
      } catch (error) {
        console.warn("Error processing automatic memberships:", error);
      } finally {
        if (!cancelled) {
          setProcessing(false);
          setProcessed(true);
        }
      }
    };

    processAutomaticMemberships();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session?.user?.id, existingMemberships, membershipsLoading]);

  return { processing, processed };
}
