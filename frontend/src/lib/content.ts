import {
  BarChart3,
  Github,
  Workflow,
  Database,
  FileText,
  Server,
  Eye,
} from "lucide-react";

export const navLinks = [
  { href: "/docs", label: "Docs" },
  { href: "/login", label: "Sign In", isButton: true, variant: "outline" },
  {
    href: "/dashboard",
    label: "Dashboard",
    isButton: true,
    variant: "default",
  },
];

export const heroContent = {
  title: "Centralize Your GitHub Organization",
  subtitle:
    "Get organization-wide visibility into your workflows, runs, and runners. Monitor all repositories from a single dashboard and identify issues across your entire GitHub organization.",
  primaryAction: { href: "/dashboard", label: "Get Started" },
  secondaryAction: { href: "/demo", label: "View Live Demo" },
  demoAction: {
    href: "/",
    //  TODO: add github repo when repo is switched to public
    label: "View Source Code",
    icon: Github,
  },
};

export const featuresContent = {
  title: "Organization-Wide Visibility",
  subtitle:
    "Monitor your entire GitHub organization from a single interface. Get centralized access to workflows, runs, and runners across all repositories.",
  features: [
    {
      icon: Workflow,
      title: "All Workflows",
      description:
        "View every workflow across all repositories in your organization. No more jumping between repos to check workflow configurations.",
      color: "text-foreground",
    },
    {
      icon: BarChart3,
      title: "Workflow Runs",
      description:
        "Monitor all workflow runs organization-wide with real-time status updates. See which runs are failing and need attention.",
      color: "text-foreground",
    },
    {
      icon: FileText,
      title: "Centralized Logs",
      description:
        "Access job logs from all repositories in one place. Debug issues faster without switching between different repo interfaces.",
      color: "text-muted-foreground",
    },
    {
      icon: Server,
      title: "Runner Status",
      description:
        "Monitor all self-hosted runners across your organization. See which runners are busy, idle, or offline at a glance.",
      color: "text-foreground",
    },
    {
      icon: Database,
      title: "Repository Overview",
      description:
        "Get insights into repository activity and workflow patterns across your entire GitHub organization.",
      color: "text-muted-foreground",
    },
    {
      icon: Eye,
      title: "Unified View",
      description:
        "Stop switching between repositories. See everything happening across your GitHub organization from a single dashboard.",
      color: "text-foreground",
    },
  ],
};

export const pricingContent = {
  title: "Beta Testing Program",
  subtitle:
    "Help us improve Pipeline Vision by testing features and reporting issues. Your feedback shapes the development.",
  plans: [
    {
      name: "Beta Access",
      price: "Free",
      description: "Test features and provide feedback during development",
      features: [
        "Organization-wide workflow visibility",
        "Real-time workflow run monitoring",
        "Runner status across all repos",
        "Centralized issue identification",
        "Direct feedback to development team",
        "Early access to new features",
        "Help shape the final product",
        "Community support",
      ],
      action: { href: "/login", label: "Join Beta" },
      badge: "Beta",
      isFeatured: true,
    },
    {
      name: "Self-Hosting",
      price: "Coming Soon",
      priceDetail: "",
      description: "Deploy on your own infrastructure",
      features: [
        "Full source code access",
        "Deploy on your servers",
        "Complete data control",
        "Custom configurations",
        "No external dependencies",
        "Available after beta testing",
        "Comprehensive setup guides",
        "Community support",
      ],
      action: { href: "/login", label: "Join Beta" },
      badge: "After Beta",
    },
    {
      name: "Future Plans",
      price: "TBD",
      priceDetail: "",
      description: "Based on what we learn from you",
      features: [
        "Features you request most",
        "Pricing based on feedback",
        "Enterprise needs assessment",
        "User-driven development",
        "Community input priority",
        "Beta insights implementation",
        "Feedback-guided roadmap",
        "Your testing shapes this",
      ],
      action: { href: "/login", label: "Join Beta" },
      badge: "You Decide",
    },
  ],
};

export const ctaContent = {
  title: "Get Organization-Wide Visibility",
  subtitle:
    "Stop switching between repositories to check workflow status. Monitor your entire GitHub organization from one centralized dashboard.",
  primaryAction: { href: "/login", label: "View Dashboard" },
  secondaryAction: {
    href: "/",
    label: "Report Issues",
    variant: "outline",
  },
};

export const footerContent = {
  companyName: "Pipeline Vision",
  description:
    "Centralize GitHub organization monitoring. View workflows, runs, and runners across all repositories from a single dashboard. Currently in beta development.",
  links: [
    {
      title: "Product",
      items: [
        { href: "/docs", label: "Documentation" },
        {
          href: "/",
          label: "Source Code",
        },
        { href: "/docs", label: "Roadmap" },
      ],
    },
    {
      title: "Development",
      items: [
        {
          href: "/",
          label: "Issues",
        },
        {
          href: "/",
          label: "Contribute",
        },
        { href: "/docs", label: "Status" },
      ],
    },
    {
      title: "Support",
      items: [
        {
          href: "/",
          label: "Get Help",
        },
        { href: "/docs", label: "FAQ" },
        {
          href: "/",
          label: "Discussions",
        },
      ],
    },
  ],
  copyright:
    "© 2025 Pipeline Vision. Open source project in early development.",
};
