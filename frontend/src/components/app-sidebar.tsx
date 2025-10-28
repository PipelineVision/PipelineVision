"use client";

import {
  ChevronDown,
  ChevronRight,
  ChevronsUpDown,
  Github,
  LayoutDashboard,
  Moon,
  PlayCircle,
  Server,
  Sun,
  Terminal,
  User,
  Users,
} from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Key, useMemo } from "react";
import { authClient, useSession } from "@/lib/auth-client";
import { useQueryClient } from "@tanstack/react-query";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useOrganizationMemberships } from "@/hooks/use-api-queries";
import { apiRequest } from "@/lib/api";
import { usePreference } from "@/app/contexts/PreferenceContext";
import { LiveStatusIndicator } from "@/components/live-status-indicator";

interface Organization {
  id: string;
  login?: string;
}

interface UpdateMembershipResponse {
  success: boolean;
  orgId: string;
}

export function AppSidebar() {
  const pathname = usePathname();
  const { setTheme, theme } = useTheme();
  const { preference, refetch: refetchPreference } = usePreference();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { data: session, isPending } = useSession();
  const queryClient = useQueryClient();

  const { data: organizations } = useOrganizationMemberships();

  const selectedOrg = useMemo(() => {
    if (!preference?.organization_id || !organizations) {
      return null;
    }
    return organizations.find(
      (org: { id: string }) => org.id === preference.organization_id
    );
  }, [preference?.organization_id, organizations]);

  const handleUpdateMembership = async (org: Organization): Promise<void> => {
    try {
      const data: UpdateMembershipResponse =
        await apiRequest<UpdateMembershipResponse>("/api/account/memberships", {
          method: "PUT",
          body: JSON.stringify({ membership_id: org.id }),
        });

      if (data.success) {
        await refetchPreference();

        queryClient.invalidateQueries({ queryKey: ["workflow-runs"] });
        queryClient.invalidateQueries({ queryKey: ["workflows"] });
        queryClient.invalidateQueries({ queryKey: ["runner-stats"] });
        queryClient.invalidateQueries({ queryKey: ["org-runners"] });
      }
    } catch (err) {
      console.error("Failed to update organization:", err);
      // TODO: Show a toast here if update fails
    }
  };

  const handleSignOut = async () => {
    try {
      await authClient.signOut();
      window.location.href = "/";
    } catch (error) {
      console.error("Sign out error:", error);
    }
  };

  return (
    <>
      <Sidebar variant="inset" collapsible="icon">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                      <Github className="size-4" />
                    </div>
                    <div className="flex flex-col gap-0.5 leading-none">
                      <span className="font-semibold">
                        {selectedOrg?.login || "Select Organization"}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Pipeline Vision Dashboard
                      </span>
                    </div>
                    <ChevronsUpDown className="ml-auto size-4" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-[--radix-dropdown-menu-trigger-width]"
                  align="start"
                >
                  <DropdownMenuLabel>Organizations</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {organizations
                    ?.filter(
                      (org: { id: Key | null | undefined }) =>
                        typeof org.id === "string"
                    )
                    .map((org: { id: string; login: string }) => (
                      <DropdownMenuItem
                        key={org.id}
                        onSelect={async () => await handleUpdateMembership(org)}
                        className="flex items-center justify-between"
                      >
                        <span>{org.login}</span>
                        {selectedOrg?.id === org.id && (
                          <div className="ml-2 h-2 w-2 rounded-full bg-primary" />
                        )}
                      </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <div className="p-2 border-b border-sidebar-border space-y-2">
          <div className="flex items-center justify-center">
            <LiveStatusIndicator />
          </div>
        </div>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Overview</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === "/dashboard"}
                    tooltip="Dashboard"
                  >
                    <Link href="/dashboard">
                      <LayoutDashboard className="size-4" />
                      <span>Dashboard</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === "/runners"}
                    tooltip="Runners"
                  >
                    <Link href="/runners">
                      <Server className="size-4" />
                      <span>Runners</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    isActive={pathname === "/jobs"}
                    tooltip="Jobs"
                  >
                    <Link href="/jobs">
                      <Terminal className="size-4" />
                      <span>Jobs</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>

                <Collapsible>
                  <SidebarMenuItem>
                    <CollapsibleTrigger asChild>
                      <SidebarMenuButton
                        isActive={pathname.startsWith("/workflows")}
                        tooltip="Workflows"
                      >
                        <PlayCircle className="size-4" />
                        <span>Workflows</span>
                        <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                      </SidebarMenuButton>
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton
                            asChild
                            isActive={pathname === "/workflows"}
                          >
                            <Link href="/workflows">
                              <span>Overview</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                        <SidebarMenuSubItem>
                          <SidebarMenuSubButton
                            asChild
                            isActive={pathname === "/workflows/runs"}
                          >
                            <Link href="/workflows/runs">
                              <span>Workflow Runs</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton
                      asChild
                      isActive={pathname === "/members"}
                      tooltip="Members"
                    >
                      <Link href="/members">
                        <Users className="size-4" />
                        <span>Members</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                </Collapsible>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton tooltip="User">
                    <span> {session?.user.name}</span>
                    <ChevronDown className="ml-auto size-4" />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  className="w-[--radix-dropdown-menu-trigger-width]"
                >
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/profile">
                      <User className="mr-2 size-4" />
                      <span>Profile</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      setTheme(theme === "dark" ? "light" : "dark")
                    }
                  >
                    {theme === "dark" ? (
                      <Sun className="mr-2 size-4" />
                    ) : (
                      <Moon className="mr-2 size-4" />
                    )}
                    <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>
    </>
  );
}
