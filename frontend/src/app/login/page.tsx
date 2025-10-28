"use client";

export const dynamic = 'force-dynamic';

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Github, Loader2 } from "lucide-react";
import { authClient, useSession } from "@/lib/auth-client";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const searchParams = useSearchParams();
  const { data: session, isPending } = useSession();

  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  const handleLogin = async () => {
    setIsLoading(true);
    try {
      await authClient.signIn.social({
        provider: "github",
        callbackURL: callbackUrl,
      });
    } catch (error) {
      setIsLoading(false);
      console.error("Login failed:", error);
    }
  };

  if (isPending || session?.user) {
    return null;
  }

  // TODO: Loading issue with auth finishing but the github callback is still not complete
  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center space-y-4 pb-6">
          <div className="mx-auto w-12 h-12 bg-primary rounded-lg flex items-center justify-center mb-2">
            <Github className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-semibold">
            Pipeline Vision
          </CardTitle>
          <CardDescription className="text-base">
            Centralize your GitHub organization monitoring
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Button
            onClick={handleLogin}
            disabled={isLoading}
            className="w-full h-11"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting to GitHub...
              </>
            ) : (
              <>
                <Github className="mr-2 h-4 w-4" />
                Sign in with GitHub
              </>
            )}
          </Button>

          <div className="text-center text-xs text-muted-foreground border-t border-border pt-4">
            <p>Beta software - help us improve Pipeline Vision</p>
            <p className="mt-1">
              Monitor your GitHub organization from one dashboard
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
