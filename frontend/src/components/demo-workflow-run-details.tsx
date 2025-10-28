// "use client";

// import React from "react";
// import {
//   Calendar,
//   Clock,
//   ExternalLink,
//   GitBranch,
//   Hash,
//   Play,
//   CheckCircle,
//   XCircle,
//   AlertCircle,
//   Circle,
//   ChevronDown,
//   ChevronRight,
//   User,
//   Timer,
//   Activity,
//   GitCommit,
//   Zap,
//   Loader2
// } from "lucide-react";

// import { Badge } from "@/components/ui/badge";
// import { Button } from "@/components/ui/button";
// import {
//   Sheet,
//   SheetContent,
//   SheetHeader,
//   SheetTitle,
//   SheetDescription,
// } from "@/components/ui/sheet";
// import { Separator } from "@/components/ui/separator";
// import { useDemo } from "@/contexts/demo-context";
// import type { DemoWorkflowRun, DemoJob } from "@/lib/demo-data";

// // Simple collapsible implementation
// interface CollapsibleProps {
//   open: boolean;
//   onOpenChange: (open: boolean) => void;
//   children: React.ReactNode;
// }

// function Collapsible({ children }: CollapsibleProps) {
//   return <div>{children}</div>;
// }

// interface CollapsibleTriggerProps {
//   asChild?: boolean;
//   children: React.ReactNode;
//   onClick?: () => void;
// }

// function CollapsibleTrigger({ asChild, children, onClick }: CollapsibleTriggerProps) {
//   if (asChild && React.isValidElement(children)) {
//     return React.cloneElement(children, { onClick });
//   }
//   return <div onClick={onClick}>{children}</div>;
// }

// interface CollapsibleContentProps {
//   children: React.ReactNode;
//   open: boolean;
// }

// function CollapsibleContent({ children, open }: CollapsibleContentProps) {
//   if (!open) return null;
//   return <div>{children}</div>;
// }

// const STATUS_COLORS = {
//   queued: "secondary",
//   in_progress: "default",
//   completed: "outline",
// } as const;

// const CONCLUSION_COLORS = {
//   success: "default",
//   failure: "destructive",
//   cancelled: "secondary",
//   skipped: "secondary",
//   neutral: "outline",
//   timed_out: "destructive",
// } as const;

// function getStatusIcon(status: string, conclusion?: string, className = "h-5 w-5") {
//   if (status === "completed") {
//     switch (conclusion) {
//       case "success": return <CheckCircle className={`${className} text-green-500`} />;
//       case "failure": return <XCircle className={`${className} text-red-500`} />;
//       case "cancelled": return <AlertCircle className={`${className} text-yellow-500`} />;
//       case "skipped": return <Circle className={`${className} text-gray-400`} />;
//       default: return <Circle className={`${className} text-gray-400`} />;
//     }
//   } else if (status === "in_progress") {
//     return <Loader2 className={`${className} text-blue-500 animate-spin`} />;
//   } else if (status === "queued") {
//     return <Clock className={`${className} text-orange-500`} />;
//   } else {
//     return <Circle className={`${className} text-gray-400`} />;
//   }
// }

// function getStepStatusIcon(status: string, conclusion?: string, className = "h-4 w-4") {
//   if (status === "completed") {
//     switch (conclusion) {
//       case "success": return <CheckCircle className={`${className} text-green-500`} />;
//       case "failure": return <XCircle className={`${className} text-red-500`} />;
//       case "cancelled": return <AlertCircle className={`${className} text-yellow-500`} />;
//       case "skipped": return <Circle className={`${className} text-gray-400`} />;
//       default: return <Circle className={`${className} text-gray-400`} />;
//     }
//   } else if (status === "in_progress") {
//     return <Loader2 className={`${className} text-blue-500 animate-spin`} />;
//   } else if (status === "queued") {
//     return <Clock className={`${className} text-orange-500`} />;
//   } else {
//     return <Circle className={`${className} text-gray-400`} />;
//   }
// }

// function getStatusBadge(status: string, conclusion?: string) {
//   if (status === "completed" && conclusion) {
//     const variant = CONCLUSION_COLORS[conclusion as keyof typeof CONCLUSION_COLORS] || "outline";
//     return <Badge variant={variant}>{conclusion}</Badge>;
//   }

//   const variant = STATUS_COLORS[status as keyof typeof STATUS_COLORS] || "outline";
//   return <Badge variant={variant}>{status.replace("_", " ")}</Badge>;
// }

// // Demo utility functions
// function formatDuration(started?: string | null, completed?: string | null): string {
//   if (!started) return "—";

//   const start = new Date(started);
//   const end = completed ? new Date(completed) : new Date();
//   const diff = end.getTime() - start.getTime();

//   const minutes = Math.floor(diff / 60000);
//   const seconds = Math.floor((diff % 60000) / 1000);

//   if (minutes > 0) {
//     return `${minutes}m ${seconds}s`;
//   }
//   return `${seconds}s`;
// }

// function formatRelativeTime(dateString: string | null): string {
//   if (!dateString) return "—";
//   const date = new Date(dateString);
//   const now = new Date();
//   const diff = now.getTime() - date.getTime();
//   const minutes = Math.floor(diff / 60000);
//   const hours = Math.floor(minutes / 60);
//   const days = Math.floor(hours / 24);

//   if (days > 0) return `${days}d ago`;
//   if (hours > 0) return `${hours}h ago`;
//   if (minutes > 0) return `${minutes}m ago`;
//   return "Just now";
// }

// function formatToLocalTime(dateString: string | null): string {
//   if (!dateString) return "—";
//   return new Date(dateString).toLocaleString();
// }

// interface JobStepDetailsProps {
//   step: {
//     id: string;
//     name: string;
//     step_number: number;
//     status: string;
//     conclusion?: string;
//     started_at?: string;
//     completed_at?: string;
//   };
// }

// function JobStepDetails({ step }: JobStepDetailsProps) {
//   return (
//     <div className="flex items-center justify-between p-3 border-b last:border-b-0 hover:bg-muted/50 transition-colors">
//       <div className="flex items-center gap-3 flex-1">
//         <div className="flex h-6 w-6 items-center justify-center rounded bg-muted text-xs font-medium">
//           {step.step_number}
//         </div>
//         {getStepStatusIcon(step.status, step.conclusion)}
//         <div className="flex-1">
//           <div className="flex items-center gap-2 mb-1">
//             <span className="font-medium text-sm">{step.name}</span>
//             <Badge
//               variant={
//                 step.status === 'completed'
//                   ? step.conclusion === 'success'
//                     ? 'default'
//                     : step.conclusion === 'failure'
//                     ? 'destructive'
//                     : 'secondary'
//                   : step.status === 'in_progress'
//                   ? 'default'
//                   : 'secondary'
//               }
//               className="text-xs h-5"
//             >
//               {step.status === 'completed' && step.conclusion ? step.conclusion : step.status.replace('_', ' ')}
//             </Badge>
//           </div>
//           {step.started_at && (
//             <div className="flex items-center gap-4 text-xs text-muted-foreground">
//               <div className="flex items-center gap-1">
//                 <Timer className="h-3 w-3" />
//                 <span>{formatDuration(step.started_at, step.completed_at)}</span>
//               </div>
//               <div className="flex items-center gap-1">
//                 <Clock className="h-3 w-3" />
//                 <span>{formatRelativeTime(step.started_at)}</span>
//               </div>
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

// interface JobDetailsProps {
//   job: DemoJob;
//   index: number;
// }

// function JobDetails({ job, index }: JobDetailsProps) {
//   const [isOpen, setIsOpen] = React.useState(false);

//   // Generate demo steps for jobs
//   const generateSteps = (job: DemoJob) => {
//     const steps = [
//       { name: "Set up job", status: "completed", conclusion: "success" },
//       { name: "Checkout code", status: "completed", conclusion: "success" },
//       { name: "Setup Node.js", status: "completed", conclusion: "success" },
//       { name: "Install dependencies", status: "completed", conclusion: "success" },
//     ];

//     if (job.job_name.includes("Build")) {
//       steps.push(
//         { name: "Build project", status: job.status, conclusion: job.conclusion },
//         { name: "Upload artifacts", status: job.status === "completed" ? "completed" : "queued", conclusion: job.conclusion }
//       );
//     } else if (job.job_name.includes("Test")) {
//       steps.push(
//         { name: "Run tests", status: job.status, conclusion: job.conclusion },
//         { name: "Generate coverage", status: job.status === "completed" ? "completed" : "queued", conclusion: job.conclusion }
//       );
//     } else if (job.job_name.includes("Deploy")) {
//       steps.push(
//         { name: "Deploy to staging", status: job.status, conclusion: job.conclusion },
//         { name: "Run health checks", status: job.status === "completed" ? "completed" : "queued", conclusion: job.conclusion }
//       );
//     } else {
//       steps.push(
//         { name: "Run job", status: job.status, conclusion: job.conclusion }
//       );
//     }

//     return steps.map((step, i) => ({
//       ...step,
//       id: `step-${job.id}-${i}`,
//       step_number: i + 1,
//       started_at: job.started_at,
//       completed_at: step.status === "completed" ? job.completed_at : undefined,
//     }));
//   };

//   const steps = generateSteps(job);

//   return (
//     <Collapsible open={isOpen} onOpenChange={setIsOpen}>
//       <div className="border rounded-lg overflow-hidden bg-card hover:bg-muted/30 transition-colors">
//         <CollapsibleTrigger
//           asChild
//           onClick={() => setIsOpen(!isOpen)}
//         >
//           <div className="flex items-center justify-between cursor-pointer p-4">
//             <div className="flex items-center gap-4">
//               <div className="flex items-center gap-3">
//                 <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted text-sm font-medium">
//                   {index}
//                 </div>
//                 {getStatusIcon(job.status, job.conclusion, "h-5 w-5")}
//               </div>
//               <div className="flex-1">
//                 <div className="flex items-center gap-2 mb-1">
//                   <h4 className="font-semibold">{job.job_name}</h4>
//                   {getStatusBadge(job.status, job.conclusion)}
//                 </div>
//                 <div className="flex items-center gap-4 text-sm text-muted-foreground">
//                   <div className="flex items-center gap-1">
//                     <Timer className="h-3 w-3" />
//                     {formatDuration(job.started_at, job.completed_at)}
//                   </div>
//                   {job.started_at && (
//                     <div className="flex items-center gap-1">
//                       <Clock className="h-3 w-3" />
//                       {formatRelativeTime(job.started_at)}
//                     </div>
//                   )}
//                 </div>
//               </div>
//             </div>
//             <div className="flex items-center gap-2">
//               <Button
//                 variant="ghost"
//                 size="sm"
//                 onClick={(e) => {
//                   e.stopPropagation();
//                   // Demo mode - just show a message instead of opening GitHub
//                   alert("This is a demo. In the real app, this would open the job on GitHub.");
//                 }}
//                 className="opacity-60 hover:opacity-100"
//               >
//                 <ExternalLink className="h-4 w-4" />
//               </Button>
//               <div className="p-1">
//                 {isOpen ? (
//                   <ChevronDown className="h-4 w-4 text-muted-foreground" />
//                 ) : (
//                   <ChevronRight className="h-4 w-4 text-muted-foreground" />
//                 )}
//               </div>
//             </div>
//           </div>
//         </CollapsibleTrigger>

//         <CollapsibleContent open={isOpen}>
//           <div className="border-t bg-muted/20 p-4">
//             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//               <div className="space-y-1">
//                 <div className="flex items-center gap-2">
//                   <Play className="h-4 w-4 text-muted-foreground" />
//                   <span className="text-sm font-medium">Started</span>
//                 </div>
//                 <p className="text-sm text-muted-foreground">
//                   {formatRelativeTime(job.started_at)}
//                 </p>
//                 {job.started_at && (
//                   <p className="text-xs text-muted-foreground/70">
//                     {formatToLocalTime(job.started_at)}
//                   </p>
//                 )}
//               </div>

//               <div className="space-y-1">
//                 <div className="flex items-center gap-2">
//                   <CheckCircle className="h-4 w-4 text-muted-foreground" />
//                   <span className="text-sm font-medium">Completed</span>
//                 </div>
//                 <p className="text-sm text-muted-foreground">
//                   {formatRelativeTime(job.completed_at)}
//                 </p>
//                 {job.completed_at && (
//                   <p className="text-xs text-muted-foreground/70">
//                     {formatToLocalTime(job.completed_at)}
//                   </p>
//                 )}
//               </div>

//               <div className="space-y-1">
//                 <div className="flex items-center gap-2">
//                   <Activity className="h-4 w-4 text-muted-foreground" />
//                   <span className="text-sm font-medium">Status</span>
//                 </div>
//                 <div className="flex items-center gap-2">
//                   {getStatusIcon(job.status, job.conclusion, "h-4 w-4")}
//                   <span className="text-sm">
//                     {job.status === "completed" && job.conclusion
//                       ? job.conclusion
//                       : job.status.replace("_", " ")
//                     }
//                   </span>
//                 </div>
//               </div>
//             </div>

//             {/* Job Steps */}
//             <div className="mt-4 pt-4 border-t">
//               <div className="flex items-center gap-2 mb-3">
//                 <Activity className="h-4 w-4 text-muted-foreground" />
//                 <span className="text-sm font-medium">Steps ({steps.length})</span>
//               </div>
//               <div className="border rounded-lg overflow-hidden bg-background">
//                 <div className="max-h-60 overflow-auto">
//                   {steps.map((step) => (
//                     <JobStepDetails key={step.id} step={step} />
//                   ))}
//                 </div>
//               </div>
//             </div>

//             <div className="flex justify-end mt-4 pt-3 border-t">
//               <Button
//                 variant="outline"
//                 size="sm"
//                 onClick={(e) => {
//                   e.stopPropagation();
//                   alert("This is a demo. In the real app, this would open the job on GitHub.");
//                 }}
//                 className="flex items-center gap-2"
//               >
//                 <ExternalLink className="h-4 w-4" />
//                 View Job on GitHub (Demo)
//               </Button>
//             </div>
//           </div>
//         </CollapsibleContent>
//       </div>
//     </Collapsible>
//   );
// }

// interface DemoWorkflowRunDetailsProps {
//   runId: string | null;
//   open: boolean;
//   onClose: () => void;
// }

// export function DemoWorkflowRunDetails({ runId, open, onClose }: DemoWorkflowRunDetailsProps) {
//   const { demoData } = useDemo();

//   const workflowRun = demoData.workflowRuns.find(run => run.id === runId);
//   const workflowJobs = demoData.jobs.filter(job => job.workflow_run_id === runId);

//   if (!runId || !workflowRun) return null;

//   return (
//     <Sheet open={open} onOpenChange={onClose}>
//       <SheetContent className="w-[900px] sm:max-w-[900px] p-0">
//         {/* Clean Header */}
//         <div className="border-b bg-muted/30 px-6 py-6">
//           <div className="flex items-start justify-between">
//             <div className="space-y-3">
//               <div className="flex items-center gap-4">
//                 {getStatusIcon(workflowRun.status, workflowRun.conclusion, "h-7 w-7")}
//                 <div>
//                   <SheetTitle className="text-2xl font-bold text-foreground">
//                     {workflowRun.workflow_name}
//                   </SheetTitle>
//                   <div className="flex items-center gap-4 text-muted-foreground mt-2">
//                     <div className="flex items-center gap-2">
//                       <Hash className="h-4 w-4" />
//                       <span className="font-mono text-sm">#{Math.floor(Math.random() * 100) + 1}</span>
//                     </div>
//                     <div className="flex items-center gap-2">
//                       <GitBranch className="h-4 w-4" />
//                       <span className="font-medium">{workflowRun.repository}</span>
//                     </div>
//                     {getStatusBadge(workflowRun.status, workflowRun.conclusion)}
//                     <Badge variant="secondary" className="h-6 text-xs px-3 text-blue-600">
//                       <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse mr-2"></div>
//                       Demo Mode
//                     </Badge>
//                   </div>
//                 </div>
//               </div>
//             </div>
//             <Button
//               variant="outline"
//               size="sm"
//               onClick={() => alert("This is a demo. In the real app, this would open the workflow run on GitHub.")}
//               className="shrink-0"
//             >
//               <ExternalLink className="h-4 w-4 mr-2" />
//               View on GitHub (Demo)
//             </Button>
//           </div>
//         </div>

//         {/* Main Content */}
//         <div className="flex-1 overflow-auto">
//           <div className="space-y-0">
//             {/* Clean Overview Section */}
//             <div className="px-6 py-6 border-b">
//               <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
//                 <div className="bg-card rounded-lg p-4 border">
//                   <div className="flex items-center gap-2 mb-2">
//                     <Timer className="h-4 w-4 text-muted-foreground" />
//                     <span className="text-sm font-medium text-muted-foreground">Duration</span>
//                   </div>
//                   <p className="text-lg font-semibold">
//                     {formatDuration(workflowRun.created_at, workflowRun.updated_at)}
//                   </p>
//                 </div>

//                 <div className="bg-card rounded-lg p-4 border">
//                   <div className="flex items-center gap-2 mb-2">
//                     <Zap className="h-4 w-4 text-muted-foreground" />
//                     <span className="text-sm font-medium text-muted-foreground">Trigger</span>
//                   </div>
//                   <Badge variant="secondary">
//                     push
//                   </Badge>
//                 </div>

//                 <div className="bg-card rounded-lg p-4 border">
//                   <div className="flex items-center gap-2 mb-2">
//                     <GitBranch className="h-4 w-4 text-muted-foreground" />
//                     <span className="text-sm font-medium text-muted-foreground">Branch</span>
//                   </div>
//                   <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
//                     main
//                   </code>
//                 </div>

//                 <div className="bg-card rounded-lg p-4 border">
//                   <div className="flex items-center gap-2 mb-2">
//                     <GitCommit className="h-4 w-4 text-muted-foreground" />
//                     <span className="text-sm font-medium text-muted-foreground">Commit</span>
//                   </div>
//                   <code className="text-sm font-mono bg-muted px-2 py-1 rounded">
//                     {Math.random().toString(36).substring(2, 9)}
//                   </code>
//                 </div>
//               </div>

//               <div className="mt-4 pt-4 border-t flex items-center gap-4 text-sm text-muted-foreground">
//                 <div className="flex items-center gap-2">
//                   <Clock className="h-4 w-4" />
//                   Started {formatRelativeTime(workflowRun.created_at)}
//                 </div>
//                 {workflowRun.updated_at && (
//                   <div className="flex items-center gap-2">
//                     <Calendar className="h-4 w-4" />
//                     Completed {formatRelativeTime(workflowRun.updated_at)}
//                   </div>
//                 )}
//               </div>
//             </div>

//             {/* Jobs Section */}
//             <div className="px-6 py-6">
//               <div className="flex items-center justify-between mb-6">
//                 <div>
//                   <h3 className="text-xl font-semibold flex items-center gap-2">
//                     <Activity className="h-5 w-5" />
//                     Jobs ({workflowJobs.length})
//                   </h3>
//                   <p className="text-sm text-muted-foreground mt-1">
//                     Execution details for each job in this workflow run
//                   </p>
//                 </div>
//                 <div className="flex flex-wrap gap-2">
//                   {workflowJobs.filter(j => j.conclusion === 'success').length > 0 && (
//                     <Badge variant="default" className="bg-green-500 hover:bg-green-600">
//                       <CheckCircle className="h-3 w-3 mr-1" />
//                       {workflowJobs.filter(j => j.conclusion === 'success').length} passed
//                     </Badge>
//                   )}
//                   {workflowJobs.filter(j => j.conclusion === 'failure').length > 0 && (
//                     <Badge variant="destructive">
//                       <XCircle className="h-3 w-3 mr-1" />
//                       {workflowJobs.filter(j => j.conclusion === 'failure').length} failed
//                     </Badge>
//                   )}
//                   {workflowJobs.filter(j => j.status === 'in_progress').length > 0 && (
//                     <Badge variant="secondary">
//                       <Loader2 className="h-3 w-3 mr-1 animate-spin" />
//                       {workflowJobs.filter(j => j.status === 'in_progress').length} running
//                     </Badge>
//                   )}
//                 </div>
//               </div>

//               {workflowJobs.length === 0 ? (
//                 <div className="text-center py-12">
//                   <Activity className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
//                   <h4 className="font-semibold mb-1">No jobs found</h4>
//                   <p className="text-sm text-muted-foreground">
//                     This workflow run doesn't have any jobs yet
//                   </p>
//                 </div>
//               ) : (
//                 <div className="space-y-3">
//                   {workflowJobs.map((job, index) => (
//                     <JobDetails key={job.id} job={job} index={index + 1} />
//                   ))}
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       </SheetContent>
//     </Sheet>
//   );
// }
