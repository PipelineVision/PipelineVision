"use client";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Github, Settings, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavigationProps {
  variant?: "default" | "dashboard" | "docs";
}

export function Navigation({ variant = "default" }: NavigationProps) {
  const pathname = usePathname();

  return (
    <nav className="border-b bg-white/80 backdrop-blur-sm dark:bg-slate-950/80 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-2">
            <Link href="/" className="flex items-center space-x-2">
              <Github className="h-8 w-8 text-slate-900 dark:text-white" />
              <span className="text-xl font-bold text-slate-900 dark:text-white">
                ActionsHub
              </span>
            </Link>
            {variant === "docs" && <Badge variant="secondary">Docs</Badge>}
          </div>

          {/* Navigation Items */}
          <div className="flex items-center space-x-4">
            {variant === "default" && (
              <>
                <Link
                  href="/docs"
                  className={`text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors ${
                    pathname === "/docs"
                      ? "text-slate-900 dark:text-white font-medium"
                      : ""
                  }`}
                >
                  Docs
                </Link>
                <Link href="/login">
                  <Button variant="outline">Sign In</Button>
                </Link>
                <Link href="/docs">
                  <Button>Get Started</Button>
                </Link>
              </>
            )}

            {variant === "dashboard" && (
              <>
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Button>
                <Link href="/">
                  <Button variant="ghost" size="sm">
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </Link>
              </>
            )}

            {variant === "docs" && (
              <>
                <Link
                  href="/"
                  className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors"
                >
                  Home
                </Link>
                <Link href="/login">
                  <Button variant="outline">Sign In</Button>
                </Link>
                <Link href="/docs">
                  <Button>Get Started</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
