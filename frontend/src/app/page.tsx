"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, BarChart3, Workflow, Server, Zap } from "lucide-react";
import Link from "next/link";
import { PageLayout } from "@/components/page-layout";
import { useSession } from "@/lib/auth-client";
import { authClient } from "@/lib/auth-client";
import {
  navLinks,
  heroContent,
  featuresContent,
  pricingContent,
  ctaContent,
  footerContent,
} from "../lib/content";

const handleSignOut = async () => {
  try {
    await authClient.signOut();
    window.location.href = "/";
  } catch (error) {
    console.error("Sign out error:", error);
  }
};

export default function HomePage() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { data: session, isPending } = useSession();

  return (
    <PageLayout className="bg-background">
      <nav className="border-b bg-background/80 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <BarChart3 className="h-8 w-8 text-foreground" />
              <span className="text-xl font-bold text-foreground">
                {footerContent.companyName}
              </span>
            </div>
            <div className="flex items-center space-x-4">
              {/* <Button variant="ghost" asChild>
                <Link href="/demo">Live Demo</Link>
              </Button> */}
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={
                    link.isButton
                      ? ""
                      : "text-muted-foreground hover:text-foreground"
                  }
                  onClick={
                    link.label === "Sign In" && session?.user
                      ? () => handleSignOut()
                      : undefined
                  }
                >
                  {link.isButton ? (
                    <Button
                      variant={
                        (link.label === "Sign In" && session?.user
                          ? "outline"
                          : link.variant) as
                          | "link"
                          | "default"
                          | "secondary"
                          | "destructive"
                          | "outline"
                          | "ghost"
                      }
                    >
                      {link.label === "Sign In" && session?.user
                        ? "Sign Out"
                        : link.label}
                    </Button>
                  ) : (
                    link.label
                  )}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </nav>

      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-4xl sm:text-6xl font-bold text-foreground mb-6">
            {heroContent.title}
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            {heroContent.subtitle}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href={session?.user ? heroContent.primaryAction.href : "/login"}
            >
              <Button
                size="lg"
                className="text-lg px-8 py-3 h-auto font-semibold"
              >
                <Zap className="mr-2 h-5 w-5" />
                {heroContent.primaryAction.label}
              </Button>
            </Link>
            <Link href={heroContent.secondaryAction.href}>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 bg-transparent"
              >
                <BarChart3 className="mr-2 h-5 w-5" />
                {heroContent.secondaryAction.label}
              </Button>
            </Link>
          </div>
          <div className="flex justify-center mt-4">
            <Link href={heroContent.demoAction.href}>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground"
              >
                <heroContent.demoAction.icon className="mr-2 h-4 w-4" />
                {heroContent.demoAction.label}
              </Button>
            </Link>
          </div>
          <div className="mt-12">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="bg-card p-6 rounded-lg border">
                <div className="flex items-center mb-3">
                  <Workflow className="h-8 w-8 text-foreground mr-2" />
                  <Badge className="bg-green-600">Available</Badge>
                </div>
                <h3 className="font-semibold text-card-foreground mb-2">
                  Workflow Viewing
                </h3>
                <p className="text-sm text-muted-foreground">
                  View workflows across all repositories in your organization
                </p>
              </div>
              <div className="bg-card p-6 rounded-lg border">
                <div className="flex items-center mb-3">
                  <BarChart3 className="h-8 w-8 text-green-600 mr-2" />
                  <Badge className="bg-green-600">Available</Badge>
                </div>
                <h3 className="font-semibold text-foreground mb-2">
                  Workflow Runs
                </h3>
                <p className="text-sm text-muted-foreground">
                  Monitor workflow runs with real-time status updates
                </p>
              </div>
              <div className="bg-card p-6 rounded-lg border">
                <div className="flex items-center mb-3">
                  <Server className="h-8 w-8 text-orange-600 mr-2" />
                  <Badge
                    variant="outline"
                    className="border-orange-600 text-orange-600"
                  >
                    Partial
                  </Badge>
                </div>
                <h3 className="font-semibold text-foreground mb-2">
                  Runner Status
                </h3>
                <p className="text-sm text-muted-foreground">
                  Basic runner status viewing (full management coming soon)
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              The Problem: Scattered GitHub Data
            </h2>
            <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
              Managing GitHub Actions across multiple repositories means
              constantly switching between repos, losing context, and missing
              important workflow status updates.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                  <span className="text-red-600 font-bold">×</span>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">
                    Jumping Between Repositories
                  </h3>
                  <p className="text-muted-foreground">
                    Constantly switching tabs to check workflow status across
                    different repos
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                  <span className="text-red-600 font-bold">×</span>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">
                    Missing Critical Updates
                  </h3>
                  <p className="text-muted-foreground">
                    Easy to miss failed workflows or important status changes
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                  <span className="text-red-600 font-bold">×</span>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">
                    No Organization Overview
                  </h3>
                  <p className="text-muted-foreground">
                    Hard to get a bird&apos;s eye view of your entire
                    organization&lsquo;s CI/CD health
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="text-green-600 h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">
                    Single Dashboard View
                  </h3>
                  <p className="text-muted-foreground">
                    See all workflows, runs, and runners from one centralized
                    location
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="text-green-600 h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">
                    Real-Time Monitoring
                  </h3>
                  <p className="text-muted-foreground">
                    Get instant updates on all workflow runs across your
                    organization
                  </p>
                </div>
              </div>
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="text-green-600 h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-2">
                    Complete Organization Visibility
                  </h3>
                  <p className="text-muted-foreground">
                    Monitor the health and activity of your entire GitHub
                    organization
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              {featuresContent.title}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {featuresContent.subtitle}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {featuresContent.features.map((feature, index) => (
              <Card key={index}>
                <CardHeader>
                  <feature.icon className={`h-10 w-10 ${feature.color} mb-2`} />
                  <CardTitle>{feature.title}</CardTitle>
                  <CardDescription>{feature.description}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              {pricingContent.title}
            </h2>
            <p className="text-lg text-muted-foreground">
              {pricingContent.subtitle}
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingContent.plans.map((plan, index) => (
              <Card
                key={index}
                className={`relative ${
                  plan.isFeatured ? "border-primary" : ""
                }`}
              >
                {plan.isFeatured && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary">
                    {plan.badge}
                  </Badge>
                )}
                <CardHeader>
                  <Badge
                    variant={plan.isFeatured ? "default" : "secondary"}
                    className={`w-fit ${plan.isFeatured ? "bg-primary" : ""}`}
                  >
                    {plan.name}
                  </Badge>
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="text-3xl font-bold text-foreground">
                    {plan.price}
                    {plan.priceDetail && (
                      <span className="text-lg font-normal text-muted-foreground">
                        {plan.priceDetail}
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {plan.features.map((feature, i) => (
                      <li key={i} className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link href={plan.action.href}>
                    <Button
                      className="w-full mt-6"
                      variant={plan.isFeatured ? "default" : "outline"}
                    >
                      {plan.action.label}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            {ctaContent.title}
          </h2>
          <p className="text-xl text-slate-300 mb-8">{ctaContent.subtitle}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href={ctaContent.primaryAction.href}>
              <Button
                size="lg"
                className="text-lg px-8 py-3 h-auto font-semibold"
              >
                <Zap className="mr-2 h-5 w-5" />
                {ctaContent.primaryAction.label}
              </Button>
            </Link>
            <Link href={ctaContent.secondaryAction.href}>
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 border-slate-600 text-slate-300 hover:bg-slate-800 bg-transparent"
              >
                {ctaContent.secondaryAction.label}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="bg-muted/30 border-t">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <BarChart3 className="h-6 w-6" />
                <span className="font-bold">{footerContent.companyName}</span>
              </div>
              <p className="text-muted-foreground">
                {footerContent.description}
              </p>
            </div>
            {footerContent.links.map((section, index) => (
              <div key={index}>
                <h3 className="font-semibold mb-4">{section.title}</h3>
                <ul className="space-y-2 text-muted-foreground">
                  {section.items.map((link, i) => (
                    <li key={i}>
                      <Link
                        href={link.href}
                        className="hover:text-slate-900 dark:hover:text-white"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t mt-8 pt-8 text-center text-muted-foreground">
            <p>{footerContent.copyright}</p>
          </div>
        </div>
      </footer>
    </PageLayout>
  );
}
