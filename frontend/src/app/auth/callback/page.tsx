"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import { Card, CardContent } from "@/components/ui/card";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, isPending } = useSession();
  const [processingMemberships, setProcessingMemberships] = useState(false);

  const processAutomaticMemberships = async () => {
    try {
      setProcessingMemberships(true);
      const response = await fetch(
        "/api/accounts/process-automatic-memberships",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(
          "Failed to process automatic memberships:",
          response.statusText,
          errorText
        );
        return;
      }
    } catch (error) {
      console.warn("Error processing automatic memberships:", error);
    } finally {
      setProcessingMemberships(false);
    }
  };

  useEffect(() => {
    const handleAuthentication = async () => {
      if (!isPending) {
        if (session?.user) {
          await processAutomaticMemberships();

          let callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

          const storedCallback = sessionStorage.getItem("auth_callback_url");
          if (storedCallback) {
            callbackUrl = storedCallback;
            sessionStorage.removeItem("auth_callback_url");
          }

          router.replace(callbackUrl);
        } else {
          router.replace("/login");
        }
      }
    };

    handleAuthentication();
  }, [session, isPending, router, searchParams]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md">
        <CardContent className="flex flex-col items-center justify-center py-12 space-y-4">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">
            {processingMemberships
              ? "Setting up your organizations..."
              : "Completing sign in..."}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
