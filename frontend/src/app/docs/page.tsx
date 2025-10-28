"use client";

export const dynamic = 'force-dynamic';

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Github,
  ArrowLeft,
  Settings,
  Users,
  Workflow,
  FileText,
  Server,
  Eye,
  Terminal,
} from "lucide-react";
import Link from "next/link";
import { PageLayout } from "@/components/page-layout";

export default function DocsPage() {
  return (
    <PageLayout navigationVariant="docs" className="bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <aside className="lg:w-64 flex-shrink-0">
            <div className="sticky top-24">
              <Link
                href="/"
                className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-6"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Link>

              <nav className="space-y-1">
                <div className="pb-2">
                  <h3 className="font-semibold text-foreground mb-2">
                    Getting Started
                  </h3>
                  <ul className="space-y-1 text-sm">
                    <li>
                      <a
                        href="#introduction"
                        className="text-muted-foreground hover:text-foreground block py-1"
                      >
                        Introduction
                      </a>
                    </li>
                    <li>
                      <a
                        href="#quick-start"
                        className="text-muted-foreground hover:text-foreground block py-1"
                      >
                        Quick Start
                      </a>
                    </li>
                    <li>
                      <a
                        href="#installation"
                        className="text-muted-foreground hover:text-foreground block py-1"
                      >
                        Development Status
                      </a>
                    </li>
                  </ul>
                </div>

                <div className="pb-2">
                  <h3 className="font-semibold text-foreground mb-2">
                    Features
                  </h3>
                  <ul className="space-y-1 text-sm">
                    <li>
                      <a
                        href="#workflows"
                        className="text-muted-foreground hover:text-foreground block py-1"
                      >
                        Workflow Management
                      </a>
                    </li>
                    <li>
                      <a
                        href="#workflow-runs"
                        className="text-muted-foreground hover:text-foreground block py-1"
                      >
                        Workflow Runs
                      </a>
                    </li>
                    <li>
                      <a
                        href="#job-logs"
                        className="text-muted-foreground hover:text-foreground block py-1"
                      >
                        Job Logs
                      </a>
                    </li>
                    <li>
                      <a
                        href="#runners"
                        className="text-muted-foreground hover:text-foreground block py-1"
                      >
                        Self-Hosted Runners
                      </a>
                    </li>
                    <li>
                      <a
                        href="#repositories"
                        className="text-muted-foreground hover:text-foreground block py-1"
                      >
                        Repository Information
                      </a>
                    </li>
                  </ul>
                </div>

                <div className="pb-2">
                  <h3 className="font-semibold text-foreground mb-2">
                    Integration
                  </h3>
                  <ul className="space-y-1 text-sm">
                    <li>
                      <a
                        href="#github-setup"
                        className="text-muted-foreground hover:text-foreground block py-1"
                      >
                        GitHub Integration
                      </a>
                    </li>
                  </ul>
                </div>

                <div className="pb-2">
                  <h3 className="font-semibold text-foreground mb-2">
                    Support
                  </h3>
                  <ul className="space-y-1 text-sm">
                    <li>
                      <a
                        href="#support"
                        className="text-muted-foreground hover:text-foreground block py-1"
                      >
                        Community Support
                      </a>
                    </li>
                    <li>
                      <a
                        href="#contributing"
                        className="text-muted-foreground hover:text-foreground block py-1"
                      >
                        Contributing
                      </a>
                    </li>
                  </ul>
                </div>
              </nav>
            </div>
          </aside>

          <main className="flex-1 max-w-none">
            <div className="prose prose-slate dark:prose-invert max-w-none">
              <section id="introduction" className="mb-12">
                <h1 className="text-4xl font-bold text-foreground mb-4">
                  Pipeline Vision Beta Testing
                </h1>
                <p className="text-xl text-muted-foreground mb-6">
                  Help us build the perfect GitHub dashboard! This is a beta
                  version designed for testing and feedback collection. Your bug
                  reports and feature requests directly shape the final product.
                </p>

                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 mb-6">
                  <h3 className="text-lg font-semibold text-red-900 dark:text-red-100 mb-2">
                    Beta Status - Please Expect Bugs!
                  </h3>
                  <p className="text-red-800 dark:text-red-200 text-sm">
                    This is beta software. I am actively changing things so
                    expect BUGS! For updates checkout the discord or changelog.
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  <Card>
                    <CardHeader>
                      <div className="flex items-center mb-2">
                        <Workflow className="h-8 w-8 text-foreground mr-2" />
                        <Badge className="bg-green-600">Available</Badge>
                      </div>
                      <CardTitle className="text-lg">
                        Workflow Viewing
                      </CardTitle>
                      <CardDescription>
                        View workflows across your organization repositories
                      </CardDescription>
                    </CardHeader>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div className="flex items-center mb-2">
                        <Server className="h-8 w-8 text-orange-600 mr-2" />
                        <Badge
                          variant="outline"
                          className="border-orange-600 text-orange-600"
                        >
                          Work in Progress
                        </Badge>
                      </div>
                      <CardTitle className="text-lg">Runner Status</CardTitle>
                      <CardDescription>
                        Basic runner status viewing (management coming soon)
                      </CardDescription>
                    </CardHeader>
                  </Card>

                  <Card>
                    <CardHeader>
                      <div className="flex items-center mb-2">
                        <Eye className="h-8 w-8 text-green-600 mr-2" />
                        <Badge className="bg-green-600">Available</Badge>
                      </div>
                      <CardTitle className="text-lg">
                        Real-time Updates
                      </CardTitle>
                      <CardDescription>
                        Live workflow run status with server-sent events
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </div>
              </section>

              <Separator className="my-8" />

              <section id="quick-start" className="mb-12">
                <h2 className="text-3xl font-bold text-foreground mb-4">
                  Start Beta Testing
                </h2>

                <div className="grid md:grid-cols-2 gap-6 mb-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Badge className="mr-2 bg-primary">Beta Testing</Badge>
                        Test & Report
                      </CardTitle>
                      <CardDescription>
                        Help us identify bugs and missing features
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ol className="list-decimal list-inside space-y-2 text-sm">
                        <li>Sign in with your GitHub account</li>
                        <li>Authorize access to your organization</li>
                        <li>Test workflow and runner viewing</li>
                        <li>Try the real-time updates</li>
                        <li>Report bugs and suggest improvements</li>
                        <li>Help us understand what&apos;s missing</li>
                      </ol>
                      <Link href="/login">
                        <Button className="w-full mt-4">
                          Start Beta Testing
                        </Button>
                      </Link>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center">
                        <Badge
                          variant="secondary"
                          className="mr-2 border-red-600 text-red-600"
                        >
                          After Beta
                        </Badge>
                        Self-Hosting
                      </CardTitle>
                      <CardDescription>
                        Needs your feedback first to become stable
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm space-y-2 text-muted-foreground">
                        <p>
                          Self-hosting requires stability from beta testing:
                        </p>
                        <ul className="space-y-1 ml-4">
                          <li>• We need to find and fix bugs first</li>
                          <li>• Features need validation from users</li>
                          <li>• Setup docs require stable foundation</li>
                          <li>• Your feedback determines readiness</li>
                          <li>• Available after beta phase succeeds</li>
                        </ul>
                      </div>
                      <Button
                        variant="outline"
                        className="w-full mt-4 bg-transparent"
                        //  TODO: onClick with link to github repo once I switch to public repo
                      >
                        <Github className="mr-2 h-4 w-4" />
                        Help Us Get There
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </section>

              <Separator className="my-8" />

              <section id="installation" className="mb-12">
                <h2 className="text-3xl font-bold text-foreground mb-4">
                  Beta Testing Focus & What We Need
                </h2>

                <p className="text-muted-foreground mb-6">
                  We&apos;re actively collecting feedback to understand what
                  this app should become. Here&apos;s what you can test now and
                  what we&apos;re looking for from beta testers.
                </p>

                <div className="space-y-6 mb-8">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center text-lg">
                        <Badge className="mr-2 bg-primary">Test These</Badge>
                        Ready for Testing
                      </CardTitle>
                      <CardDescription>
                        Try these features and report what breaks or feels wrong
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-muted-foreground">
                        <li className="flex items-center">
                          <Eye className="h-4 w-4 mr-2 text-foreground" />
                          Workflow viewing across all repositories
                        </li>
                        <li className="flex items-center">
                          <Eye className="h-4 w-4 mr-2 text-foreground" />
                          Workflow run monitoring
                        </li>
                        <li className="flex items-center">
                          <Eye className="h-4 w-4 mr-2 text-foreground" />
                          Real-time status updates
                        </li>
                        <li className="flex items-center">
                          <Eye className="h-4 w-4 mr-2 text-foreground" />
                          Basic runner status
                        </li>
                        <li className="flex items-center">
                          <Eye className="h-4 w-4 mr-2 text-foreground" />
                          GitHub OAuth flow
                        </li>
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center text-lg">
                        <Badge
                          variant="outline"
                          className="mr-2 border-orange-600 text-orange-600"
                        >
                          Help Decide
                        </Badge>
                        What Should We Build?
                      </CardTitle>
                      <CardDescription>
                        Please submit feature requests on github or the proper
                        discord channel for feature requests
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </div>
              </section>

              <Separator className="my-8" />

              <section id="workflows" className="mb-12">
                <h2 className="text-3xl font-bold text-foreground mb-4">
                  Workflow Management
                </h2>
                <p className="text-muted-foreground mb-6">
                  View all workflows across your entire GitHub organization in
                  one centralized dashboard. No more jumping between
                  repositories to check workflow status.
                </p>

                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <div>
                    <h4 className="text-lg font-semibold text-foreground mb-3">
                      What You Can See
                    </h4>
                    <ul className="space-y-2 text-muted-foreground">
                      <li className="flex items-center">
                        <Workflow className="h-4 w-4 mr-2 text-foreground" />
                        All workflows from all repositories
                      </li>
                      <li className="flex items-center">
                        <Workflow className="h-4 w-4 mr-2 text-foreground" />
                        Workflow details
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-foreground mb-3">
                      Benefits
                    </h4>
                    <ul className="space-y-2 text-muted-foreground">
                      <li>• Centralized view of all workflows</li>
                      <li>• No need to switch between repos</li>
                      <li>• Quick access to workflow files</li>
                      <li>• Organization-wide visibility</li>
                    </ul>
                  </div>
                </div>
              </section>

              <Separator className="my-8" />

              <section id="workflow-runs" className="mb-12">
                <h2 className="text-3xl font-bold text-foreground mb-4">
                  Workflow Runs
                </h2>
                <p className="text-muted-foreground mb-6">
                  Monitor all workflow runs across your organization with
                  real-time status updates and detailed execution information.
                </p>

                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <div>
                    <h4 className="text-lg font-semibold text-foreground mb-3">
                      Run Information
                    </h4>
                    <ul className="space-y-2 text-muted-foreground">
                      <li className="flex items-center">
                        Run status (success, failure, in-progress)
                      </li>
                      <li className="flex items-center">
                        <Settings className="h-4 w-4 mr-2 text-green-600" />
                        Execution time and duration
                      </li>
                      <li className="flex items-center">
                        <Users className="h-4 w-4 mr-2 text-foreground" />
                        Triggered by information
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-foreground mb-3">
                      Organization View
                    </h4>
                    <ul className="space-y-2 text-muted-foreground">
                      <li>• All runs from all repositories</li>
                      <li>• Real-time status updates</li>
                      <li>• Filter by repository or status</li>
                      <li>• Quick access to run details</li>
                    </ul>
                  </div>
                </div>
              </section>

              <Separator className="my-8" />

              <section id="job-logs" className="mb-12">
                <h2 className="text-3xl font-bold text-foreground mb-4">
                  Job Logs
                </h2>
                <p className="text-muted-foreground mb-6">
                  Access detailed job logs for every workflow run. Debug issues
                  faster with centralized log viewing across your entire
                  organization.
                </p>

                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <div>
                    <h4 className="text-lg font-semibold text-foreground mb-3">
                      Log Features
                    </h4>
                    <ul className="space-y-2 text-muted-foreground">
                      <li className="flex items-center">
                        <FileText className="h-4 w-4 mr-2 text-foreground" />
                        Complete job output logs
                      </li>
                      <li className="flex items-center">
                        <Terminal className="h-4 w-4 mr-2 text-green-600" />
                        Step-by-step execution details
                      </li>
                      <li className="flex items-center">
                        <Eye className="h-4 w-4 mr-2 text-foreground" />
                        Easy navigation between jobs
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-lg font-semibold text-foreground mb-3">
                      Debugging Benefits
                    </h4>
                    <ul className="space-y-2 text-muted-foreground">
                      <li>• Centralized log access</li>
                      <li>• No need to visit GitHub directly</li>
                      <li>• Quick failure identification</li>
                      <li>• Organization-wide debugging</li>
                    </ul>
                  </div>
                </div>
              </section>

              <Separator className="my-8" />

              <section id="runners" className="mb-12">
                <h2 className="text-3xl font-bold text-foreground mb-4">
                  Self-Hosted Runners
                </h2>
                <p className="text-muted-foreground mb-6">Work in Progress</p>
              </section>

              <Separator className="my-8" />

              <section id="repositories" className="mb-12">
                <h2 className="text-3xl font-bold text-foreground mb-4">
                  Repository Information
                </h2>
                <p className="text-muted-foreground mb-6">Work in progress</p>
              </section>

              <Separator className="my-8" />

              <section id="github-setup" className="mb-12">
                <h2 className="text-3xl font-bold text-foreground mb-4">
                  How GitHub Integration Works
                </h2>
                <p className="text-muted-foreground mb-6">
                  Pipeline Vision integrates with GitHub to provide
                  organization-wide visibility. Here&apos;s what permissions are
                  requested and why.
                </p>

                <Card className="mb-6">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Github className="h-6 w-6 mr-2" />
                      Required GitHub Permissions
                    </CardTitle>
                    <CardDescription>
                      When you sign in, Pipeline Vision requests these minimal
                      permissions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3 text-muted-foreground">
                      <li className="flex items-start">
                        <div>
                          <strong>Actions: read and write</strong>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <div>
                          <strong>Deployments: read</strong>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <div>
                          <strong>
                            Metadata: read (mandatory from github apps)
                          </strong>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <div>
                          <strong>Webhooks: read</strong>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <div>
                          <strong>Workflows: read</strong>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <div>
                          <strong>Memebers: read</strong>
                        </div>
                      </li>
                      <li className="flex items-start">
                        <div>
                          <strong>Self Hosted Runners: read and write</strong>
                        </div>
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>What We Access</CardTitle>
                    <CardDescription>
                      Pipeline Vision only accesses public information from your
                      organization
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-muted-foreground text-sm">
                      <li>✓ Repository names and workflow files</li>
                      <li>✓ Workflow run status and basic metadata</li>
                      <li>✓ Self-hosted runner status</li>
                      <li>✓ Organization membership</li>
                      <li>✗ Private code or file contents</li>
                      <li>✗ Secrets or environment variables</li>
                      <li>
                        ✗ Personal repositories (unless explicitly shared)
                      </li>
                      <li>✗ Any write access to your repositories</li>
                    </ul>
                  </CardContent>
                </Card>
              </section>

              <Separator className="my-8" />

              <section id="support" className="mb-12">
                <h2 className="text-3xl font-bold text-foreground mb-4">
                  Your Feedback Is Essential
                </h2>
                <p className="text-muted-foreground mb-6">
                  This is a beta focused on collecting feedback and bug reports.
                  Every issue you find and feature you request directly impacts
                  development and gets us closer to a stable self-hostable
                  version.
                </p>

                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <Card className="border-red-200 dark:border-red-800">
                    <CardHeader>
                      <Github className="h-8 w-8 text-red-600 mb-2" />
                      <CardTitle className="text-red-900 dark:text-red-100">
                        Bug Reports (Priority!)
                      </CardTitle>
                      <CardDescription>
                        Found something broken? This is exactly what we need!
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        Every bug you report helps us build a more stable
                        foundation. Include steps to reproduce, what you
                        expected, and what actually happened.
                      </p>
                      <Button
                        className="w-full bg-red-600 hover:bg-red-700"
                        //  TODO: onClick with link to github repo once I switch to public repo
                      >
                        <Github className="mr-2 h-4 w-4" />
                        Report a Bug
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="border-primary">
                    <CardHeader>
                      <Eye className="h-8 w-8 text-foreground mb-2" />
                      <CardTitle className="text-foreground">
                        Feature Requests
                      </CardTitle>
                      <CardDescription>
                        Tell us what&apos;s missing or what could work better
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Button
                        variant="outline"
                        className="w-full border-primary text-foreground"
                        //  TODO: onClick with link to github repo once I switch to public repo
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Request a Feature
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                <div className="bg-muted/50 border border-primary rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    How Your Feedback Shapes Development
                  </h3>
                  <div className="text-muted-foreground text-sm space-y-2">
                    <p>
                      <strong>Bug Reports:</strong> Get fixed immediately -
                      stability is our top priority
                    </p>
                    <p>
                      <strong>Feature Requests:</strong> Help us understand what
                      to build next and how
                    </p>
                    <p>
                      <strong>Usage Feedback:</strong> Tell us what feels clunky
                      or confusing
                    </p>
                    <p>
                      <strong>Self-hosting:</strong> Only becomes available
                      after beta testing proves stability
                    </p>
                  </div>
                </div>
              </section>
              <section id="contributing" className="mb-12">
                <h2 className="text-3xl font-bold text-foreground mb-4">
                  Contributing
                </h2>
                <p className="text-muted-foreground mb-6">
                  Pipeline Vision is open source so that the community and its
                  users have the control. Contributing is encouraged! If you are
                  interested let me know on discord or feel free to open a PR.
                </p>
              </section>
            </div>
          </main>
        </div>
      </div>
    </PageLayout>
  );
}
