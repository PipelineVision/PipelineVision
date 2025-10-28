"use client";

import { DemoProvider } from "@/contexts/demo-context";
import { SidebarProvider } from "@/components/ui/sidebar";
// import { DemoSidebar } from "@/components/demo-sidebar";

export default function DemoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DemoProvider>
      <SidebarProvider>
        {/* <DemoSidebar /> */}
        {children}
      </SidebarProvider>
    </DemoProvider>
  );
}
