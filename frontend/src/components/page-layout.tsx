import type React from "react";

interface PageLayoutProps {
  children: React.ReactNode;
  navigationVariant?: "default" | "dashboard" | "docs";
  className?: string;
}

export function PageLayout({ children, className = "" }: PageLayoutProps) {
  return <div className={`min-h-screen ${className}`}>{children}</div>;
}
