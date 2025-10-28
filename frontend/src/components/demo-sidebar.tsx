// "use client";

// import {
//   ChevronDown,
//   ChevronRight,
//   ChevronsUpDown,
//   Cog,
//   Github,
//   LayoutDashboard,
//   Moon,
//   PlayCircle,
//   Server,
//   Sun,
//   User,
// } from "lucide-react";
// import { useTheme } from "next-themes";
// import Link from "next/link";
// import { usePathname } from "next/navigation";

// import { Button } from "@/components/ui/button";

// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuLabel,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import {
//   Sidebar,
//   SidebarContent,
//   SidebarFooter,
//   SidebarGroup,
//   SidebarGroupContent,
//   SidebarGroupLabel,
//   SidebarHeader,
//   SidebarMenu,
//   SidebarMenuButton,
//   SidebarMenuItem,
//   SidebarMenuSub,
//   SidebarMenuSubButton,
//   SidebarMenuSubItem,
//   SidebarRail,
// } from "@/components/ui/sidebar";
// import {
//   Collapsible,
//   CollapsibleContent,
//   CollapsibleTrigger,
// } from "@/components/ui/collapsible";
// import { useDemo } from "@/contexts/demo-context";

// export function DemoSidebar() {
//   const pathname = usePathname();
//   const { setTheme, theme } = useTheme();
//   const { demoData, switchDemoOrg } = useDemo();

//   const selectedOrg = demoData.selectedOrg;
//   const organizations = demoData.organizations;

//   const handleUpdateMembership = async (org) => {
//     switchDemoOrg(org.id);
//   };

//   return (
//     <Sidebar variant="inset" collapsible="icon">
//       <SidebarHeader>
//         <SidebarMenu>
//           <SidebarMenuItem>
//             <DropdownMenu>
//               <DropdownMenuTrigger asChild>
//                 <SidebarMenuButton
//                   size="lg"
//                   className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
//                 >
//                   <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
//                     <Github className="size-4" />
//                   </div>
//                   <div className="flex flex-col gap-0.5 leading-none">
//                     <span className="font-semibold">
//                       {selectedOrg?.login || "Select Organization"}
//                     </span>
//                     <span className="text-xs text-muted-foreground">
//                       Pipeline Vision Dashboard
//                     </span>
//                   </div>
//                   <ChevronsUpDown className="ml-auto size-4" />
//                 </SidebarMenuButton>
//               </DropdownMenuTrigger>
//               <DropdownMenuContent
//                 className="w-[--radix-dropdown-menu-trigger-width]"
//                 align="start"
//               >
//                 <DropdownMenuLabel>Organizations</DropdownMenuLabel>
//                 <DropdownMenuSeparator />
//                 {organizations?.map((org) => (
//                   <DropdownMenuItem
//                     key={org.id}
//                     onSelect={async () => await handleUpdateMembership(org)}
//                     className="flex items-center justify-between"
//                   >
//                     <span>{org.login}</span>
//                     {selectedOrg?.id === org.id && (
//                       <div className="ml-2 h-2 w-2 rounded-full bg-primary" />
//                     )}
//                   </DropdownMenuItem>
//                 ))}
//               </DropdownMenuContent>
//             </DropdownMenu>
//           </SidebarMenuItem>
//         </SidebarMenu>
//       </SidebarHeader>

//       {/* Demo Status Indicator */}
//       <div className="p-3 border-b border-sidebar-border space-y-3">
//         <div className="flex items-center justify-center">
//           <div className="flex items-center gap-2 text-sm font-medium text-blue-600">
//             <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse"></div>
//             Demo Mode Active
//           </div>
//         </div>
//         <div className="text-center">
//           <Link href="/login">
//             <Button size="sm" className="w-full text-xs h-8">
//               Try Real Version
//             </Button>
//           </Link>
//         </div>
//         <div className="text-center text-xs text-muted-foreground">
//           Updates every 8 seconds
//         </div>
//       </div>

//       <SidebarContent>
//         <SidebarGroup>
//           <SidebarGroupLabel>Overview</SidebarGroupLabel>
//           <SidebarGroupContent>
//             <SidebarMenu>
//               <SidebarMenuItem>
//                 <SidebarMenuButton
//                   asChild
//                   isActive={pathname === "/demo"}
//                   tooltip="Dashboard"
//                 >
//                   <Link href="/demo">
//                     <LayoutDashboard className="size-4" />
//                     <span>Dashboard</span>
//                   </Link>
//                 </SidebarMenuButton>
//               </SidebarMenuItem>
//               <SidebarMenuItem>
//                 <SidebarMenuButton
//                   asChild
//                   isActive={pathname === "/demo/runners"}
//                   tooltip="Runners"
//                 >
//                   <Link href="/demo/runners">
//                     <Server className="size-4" />
//                     <span>Runners</span>
//                   </Link>
//                 </SidebarMenuButton>
//               </SidebarMenuItem>
//               <Collapsible>
//                 <SidebarMenuItem>
//                   <CollapsibleTrigger asChild>
//                     <SidebarMenuButton
//                       isActive={pathname.startsWith("/demo/workflows")}
//                       tooltip="Workflows"
//                     >
//                       <PlayCircle className="size-4" />
//                       <span>Workflows</span>
//                       <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
//                     </SidebarMenuButton>
//                   </CollapsibleTrigger>
//                   <CollapsibleContent>
//                     <SidebarMenuSub>
//                       <SidebarMenuSubItem>
//                         <SidebarMenuSubButton
//                           asChild
//                           isActive={pathname === "/demo/workflows"}
//                         >
//                           <Link href="/demo/workflows">
//                             <span>Overview</span>
//                           </Link>
//                         </SidebarMenuSubButton>
//                       </SidebarMenuSubItem>
//                       <SidebarMenuSubItem>
//                         <SidebarMenuSubButton
//                           asChild
//                           isActive={pathname === "/demo/workflows/runs"}
//                         >
//                           <Link href="/demo/workflows/runs">
//                             <span>Workflow Runs</span>
//                           </Link>
//                         </SidebarMenuSubButton>
//                       </SidebarMenuSubItem>
//                     </SidebarMenuSub>
//                   </CollapsibleContent>
//                 </SidebarMenuItem>
//               </Collapsible>
//             </SidebarMenu>
//           </SidebarGroupContent>
//         </SidebarGroup>
//       </SidebarContent>
//       <SidebarFooter>
//         <SidebarMenu>
//           <SidebarMenuItem>
//             <DropdownMenu>
//               <DropdownMenuTrigger asChild>
//                 <SidebarMenuButton tooltip="Demo User">
//                   <span>Demo User</span>
//                   <ChevronDown className="ml-auto size-4" />
//                 </SidebarMenuButton>
//               </DropdownMenuTrigger>
//               <DropdownMenuContent
//                 align="start"
//                 className="w-[--radix-dropdown-menu-trigger-width]"
//               >
//                 <DropdownMenuLabel>Demo Account</DropdownMenuLabel>
//                 <DropdownMenuSeparator />
//                 <DropdownMenuItem>
//                   <User className="mr-2 size-4" />
//                   <span>Profile (Demo)</span>
//                 </DropdownMenuItem>
//                 <DropdownMenuItem disabled>
//                   <Cog className="mr-2 size-4" />
//                   <span>Settings (Demo)</span>
//                 </DropdownMenuItem>
//                 <DropdownMenuItem
//                   onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
//                 >
//                   {theme === "dark" ? (
//                     <Sun className="mr-2 size-4" />
//                   ) : (
//                     <Moon className="mr-2 size-4" />
//                   )}
//                   <span>{theme === "dark" ? "Light Mode" : "Dark Mode"}</span>
//                 </DropdownMenuItem>
//                 <DropdownMenuSeparator />
//                 <DropdownMenuItem asChild>
//                   <Link href="/login">Try Real Version</Link>
//                 </DropdownMenuItem>
//               </DropdownMenuContent>
//             </DropdownMenu>
//           </SidebarMenuItem>
//         </SidebarMenu>
//       </SidebarFooter>
//       <SidebarRail />
//     </Sidebar>
//   );
// }
