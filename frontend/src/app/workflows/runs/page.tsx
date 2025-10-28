"use client";

export const dynamic = 'force-dynamic';

import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { WorkflowRunsTable } from "@/components/workflow-runs-table";
import { WorkflowRunsFilters } from "@/app/hooks/useWorkflowRuns";

export default function WorkflowRunsPage() {
  const searchParams = useSearchParams();

  const initialFilters: WorkflowRunsFilters = {};

  const workflowName = searchParams.get("workflow_name");
  if (workflowName) {
    initialFilters.workflow_name = workflowName;
  }

  const repositoryName = searchParams.get("repository_name");
  if (repositoryName) {
    initialFilters.repository_name = repositoryName;
  }

  const repositoryFullName = searchParams.get("repository_full_name");
  if (repositoryFullName) {
    initialFilters.repository_full_name = repositoryFullName;
  }

  const status = searchParams.get("status");
  if (status) {
    initialFilters.status = status;
  }

  const conclusion = searchParams.get("conclusion");
  if (conclusion) {
    initialFilters.conclusion = conclusion;
  }

  const event = searchParams.get("event");
  if (event) {
    initialFilters.event = event;
  }
  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink asChild>
                  <Link href="/dashboard">Dashboard</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href="/workflows">Workflows</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Workflow Runs</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Workflow Runs</h1>
            <p className="text-muted-foreground">
              View all workflow runs across all repositories with detailed job
              information
            </p>
          </div>

          <WorkflowRunsTable initialFilters={initialFilters} />
        </div>
      </div>
    </SidebarInset>
  );
}
