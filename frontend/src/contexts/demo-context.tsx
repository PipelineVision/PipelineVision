"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import {
  demoRunners,
  demoWorkflowRuns,
  demoJobs,
  demoOrganizations,
  getDemoStats,
  DemoDataGenerator,
  type DemoRunner,
  type DemoWorkflowRun,
  type DemoJob,
  type DemoOrganization,
} from "../lib/demo-data";

interface DemoContextType {
  isDemoMode: boolean;
  demoData: {
    runners: DemoRunner[];
    workflowRuns: DemoWorkflowRun[];
    jobs: DemoJob[];
    organizations: DemoOrganization[];
    selectedOrg: DemoOrganization;
    stats: ReturnType<typeof getDemoStats>;
  };
  setDemoMode: (enabled: boolean) => void;
  switchDemoOrg: (orgId: string) => void;
}

const DemoContext = createContext<DemoContextType | undefined>(undefined);

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState(demoOrganizations[0]);
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [updateCount, setUpdateCount] = useState(0);

  useEffect(() => {
    if (!isDemoMode) return;

    const generator = new DemoDataGenerator();

    generator.onUpdate(() => {
      setUpdateCount((prev) => prev + 1);
    });

    return () => {
      generator.destroy();
    };
  }, [isDemoMode]);

  const setDemoMode = (enabled: boolean) => {
    setIsDemoMode(enabled);
  };

  const switchDemoOrg = (orgId: string) => {
    const org = demoOrganizations.find((o) => o.id === orgId);
    if (org) {
      setSelectedOrg(org);
    }
  };

  const value: DemoContextType = {
    isDemoMode,
    demoData: {
      runners: demoRunners,
      workflowRuns: demoWorkflowRuns,
      jobs: demoJobs,
      organizations: demoOrganizations,
      selectedOrg,
      stats: getDemoStats(),
    },
    setDemoMode,
    switchDemoOrg,
  };

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (context === undefined) {
    throw new Error("useDemo must be used within a DemoProvider");
  }
  return context;
}
