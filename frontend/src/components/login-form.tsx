"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authClient, useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Github, Loader2, AlertCircle, CheckCircle, Eye, EyeOff } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, isPending } = useSession();

  // Get the callback URL from search params
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  // Redirect if already logged in
  useEffect(() => {
    if (session?.user && !isPending) {
      router.push(callbackUrl);
    }
  }, [session, isPending, router, callbackUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      let result;
      if (isLogin) {
        result = await authClient.signIn.email({ email, password });
      } else {
        result = await authClient.signUp.email({ email, password, name: email });
      }
      
      if (result) {
        setSuccess(true);
        setTimeout(() => {
          router.push(callbackUrl);
        }, 1000);
      }
    } catch (err) {
      console.error("Authentication error", err);
      setError(isLogin ? "Invalid email or password" : "Failed to create account. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGitHubSignIn = async () => {
    if (isLoading) return; // Prevent multiple clicks
    
    setIsLoading(true);
    setError(null);

    try {
      // Use Better Auth's signIn.social method
      // This should handle the OAuth flow properly
      await authClient.signIn.social({
        provider: "github",
        callbackURL: callbackUrl
      });
    } catch (err) {
      console.error("GitHub authentication error", err);
      setError("Failed to sign in with GitHub. Please try again.");
      setIsLoading(false);
    }
  };

  // Show loading if checking session
  if (isPending) {
    return (
      <Card className="w-full max-w-md mx-auto shadow-lg border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-600" />
            <p className="text-gray-600 dark:text-gray-400">Checking authentication...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm z-50 flex items-center justify-center rounded-lg">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-xl">
            <div className="flex items-center space-x-3">
              <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              <span className="text-gray-700 dark:text-gray-300 font-medium">
                Redirecting to GitHub...
              </span>
            </div>
          </div>
        </div>
      )}
      <Card className="w-full max-w-md mx-auto shadow-lg border-0 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
      <CardHeader className="text-center space-y-2 pb-6">
        <div className="mx-auto w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center mb-4">
          <Github className="h-6 w-6 text-white" />
        </div>
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
          {isLogin ? "Welcome Back" : "Create Account"}
        </CardTitle>
        <CardDescription className="text-gray-600 dark:text-gray-400">
          {isLogin ? "Sign in to your account" : "Sign up for a new account"}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive" className="animate-in slide-in-from-top-2 duration-300">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        {success && (
          <Alert className="animate-in slide-in-from-top-2 duration-300 border-green-200 bg-green-50 dark:bg-green-900/20">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800 dark:text-green-200">
              {isLogin ? "Successfully signed in! Redirecting..." : "Account created! Redirecting..."}
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              className="transition-all duration-200"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                className="pr-10 transition-all duration-200"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4 text-gray-400" />
                ) : (
                  <Eye className="h-4 w-4 text-gray-400" />
                )}
              </Button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-11 text-base font-medium bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isLogin ? "Signing in..." : "Creating account..."}
              </>
            ) : (
              isLogin ? "Sign In" : "Create Account"
            )}
          </Button>

          <Button
            type="button"
            variant="ghost"
            onClick={() => setIsLogin(!isLogin)}
            disabled={isLoading}
            className="w-full text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            {isLogin ? "Need an account? Sign up" : "Already have an account? Sign in"}
          </Button>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-200 dark:border-gray-700" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white dark:bg-slate-800 px-2 text-gray-500 dark:text-gray-400">Or continue with</span>
          </div>
        </div>

        <Button
          onClick={handleGitHubSignIn}
          disabled={isLoading}
          variant="outline"
          className="w-full h-11 text-base font-medium border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Redirecting to GitHub...
            </>
          ) : (
            <>
              <Github className="mr-2 h-4 w-4" />
              Continue with GitHub
            </>
          )}
        </Button>

        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          By signing in, you agree to our terms of service and privacy policy
        </div>
      </CardContent>
    </Card>
    </div>
  );
}
