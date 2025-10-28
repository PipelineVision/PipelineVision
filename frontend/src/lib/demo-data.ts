// Demo data generator for showcase purposes
export interface DemoRunner {
  id: string;
  name: string;
  status: 'online' | 'offline' | 'busy';
  os: string;
  architecture: string;
  labels: string[];
  last_seen: string;
  current_job?: string;
}

export interface DemoWorkflowRun {
  id: string;
  workflow_name: string;
  repository: string;
  status: 'queued' | 'in_progress' | 'completed' | 'failed';
  conclusion?: 'success' | 'failure' | 'cancelled';
  created_at: string;
  updated_at: string;
  duration?: number;
  jobs_summary: {
    total: number;
    completed: number;
    failed: number;
    in_progress: number;
  };
}

export interface DemoJob {
  id: string;
  name: string;
  workflow_name: string;
  workflow_run_id: string;
  repository: string;
  status: 'queued' | 'in_progress' | 'completed';
  conclusion?: 'success' | 'failure' | 'cancelled';
  runner_name?: string;
  started_at?: string;
  completed_at?: string;
  duration?: number;
  job_name: string;
}

export interface DemoOrganization {
  id: string;
  login: string;
  name: string;
  avatar_url: string;
}

// Demo organizations
export const demoOrganizations: DemoOrganization[] = [
  {
    id: "demo-org-1",
    login: "acme-corp",
    name: "ACME Corporation",
    avatar_url: "https://github.com/github.png"
  },
  {
    id: "demo-org-2", 
    login: "startup-inc",
    name: "Startup Inc",
    avatar_url: "https://github.com/microsoft.png"
  },
  {
    id: "demo-org-3",
    login: "enterprise-ltd",
    name: "Enterprise Ltd",
    avatar_url: "https://github.com/google.png"
  }
];

// Demo runners with realistic data
export const demoRunners: DemoRunner[] = [
  {
    id: "runner-1",
    name: "ubuntu-runner-01",
    status: "online",
    os: "Linux",
    architecture: "x64",
    labels: ["self-hosted", "linux", "x64", "ubuntu-latest"],
    last_seen: new Date(Date.now() - 5000).toISOString(),
  },
  {
    id: "runner-2", 
    name: "ubuntu-runner-02",
    status: "busy",
    os: "Linux",
    architecture: "x64", 
    labels: ["self-hosted", "linux", "x64", "ubuntu-latest"],
    last_seen: new Date(Date.now() - 2000).toISOString(),
    current_job: "Build and Test API"
  },
  {
    id: "runner-3",
    name: "windows-runner-01", 
    status: "online",
    os: "Windows",
    architecture: "x64",
    labels: ["self-hosted", "windows", "x64"],
    last_seen: new Date(Date.now() - 8000).toISOString(),
  },
  {
    id: "runner-4",
    name: "macos-runner-01",
    status: "offline",
    os: "macOS", 
    architecture: "arm64",
    labels: ["self-hosted", "macos", "arm64"],
    last_seen: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
  },
  {
    id: "runner-5",
    name: "gpu-runner-01",
    status: "busy", 
    os: "Linux",
    architecture: "x64",
    labels: ["self-hosted", "linux", "x64", "gpu", "ml"],
    last_seen: new Date().toISOString(),
    current_job: "Train ML Model"
  }
];

// Demo workflow runs
export const demoWorkflowRuns: DemoWorkflowRun[] = [
  {
    id: "run-1",
    workflow_name: "CI/CD Pipeline",
    repository: "acme-corp/web-app",
    status: "in_progress",
    created_at: new Date(Date.now() - 120000).toISOString(), // 2 min ago
    updated_at: new Date(Date.now() - 30000).toISOString(),  // 30 sec ago
    jobs_summary: {
      total: 4,
      completed: 2,
      failed: 0, 
      in_progress: 2
    }
  },
  {
    id: "run-2",
    workflow_name: "Build and Test",
    repository: "acme-corp/api-service", 
    status: "completed",
    conclusion: "success",
    created_at: new Date(Date.now() - 600000).toISOString(), // 10 min ago
    updated_at: new Date(Date.now() - 300000).toISOString(), // 5 min ago
    duration: 285,
    jobs_summary: {
      total: 3,
      completed: 3,
      failed: 0,
      in_progress: 0
    }
  },
  {
    id: "run-3", 
    workflow_name: "Security Scan",
    repository: "acme-corp/mobile-app",
    status: "completed", 
    conclusion: "failure",
    created_at: new Date(Date.now() - 900000).toISOString(), // 15 min ago
    updated_at: new Date(Date.now() - 600000).toISOString(), // 10 min ago
    duration: 156,
    jobs_summary: {
      total: 2,
      completed: 2, 
      failed: 1,
      in_progress: 0
    }
  },
  {
    id: "run-4",
    workflow_name: "Deploy to Staging",
    repository: "acme-corp/web-app",
    status: "queued",
    created_at: new Date(Date.now() - 30000).toISOString(), // 30 sec ago
    updated_at: new Date(Date.now() - 30000).toISOString(),
    jobs_summary: {
      total: 2,
      completed: 0,
      failed: 0,
      in_progress: 0
    }
  }
];

// Demo jobs
export const demoJobs: DemoJob[] = [
  {
    id: "job-1",
    name: "Build and Test API",
    job_name: "Build and Test API",
    workflow_name: "CI/CD Pipeline", 
    workflow_run_id: "run-1",
    repository: "acme-corp/web-app",
    status: "in_progress",
    runner_name: "ubuntu-runner-02",
    started_at: new Date(Date.now() - 90000).toISOString(), // 1.5 min ago
  },
  {
    id: "job-2",
    name: "Frontend Tests",
    job_name: "Frontend Tests",
    workflow_name: "CI/CD Pipeline",
    workflow_run_id: "run-1",
    repository: "acme-corp/web-app", 
    status: "completed",
    conclusion: "success",
    runner_name: "ubuntu-runner-01",
    started_at: new Date(Date.now() - 180000).toISOString(), // 3 min ago
    completed_at: new Date(Date.now() - 120000).toISOString(), // 2 min ago
    duration: 60
  },
  {
    id: "job-3",
    name: "Deploy to Staging",
    job_name: "Deploy to Staging",
    workflow_name: "CI/CD Pipeline",
    workflow_run_id: "run-1",
    repository: "acme-corp/web-app",
    status: "in_progress", 
    runner_name: "ubuntu-runner-03",
    started_at: new Date(Date.now() - 60000).toISOString(), // 1 min ago
  },
  {
    id: "job-4",
    name: "End-to-End Tests",
    job_name: "End-to-End Tests",
    workflow_name: "CI/CD Pipeline",
    workflow_run_id: "run-1",
    repository: "acme-corp/web-app",
    status: "completed",
    conclusion: "success",
    runner_name: "ubuntu-runner-01", 
    started_at: new Date(Date.now() - 200000).toISOString(), // 3.3 min ago
    completed_at: new Date(Date.now() - 150000).toISOString(), // 2.5 min ago
    duration: 50
  },
  {
    id: "job-5",
    name: "Build API Service",
    job_name: "Build API Service",
    workflow_name: "Build and Test",
    workflow_run_id: "run-2",
    repository: "acme-corp/api-service",
    status: "completed",
    conclusion: "success",
    runner_name: "ubuntu-runner-01",
    started_at: new Date(Date.now() - 600000).toISOString(), // 10 min ago
    completed_at: new Date(Date.now() - 480000).toISOString(), // 8 min ago
    duration: 120
  },
  {
    id: "job-6",
    name: "Unit Tests",
    job_name: "Unit Tests",
    workflow_name: "Build and Test",
    workflow_run_id: "run-2",
    repository: "acme-corp/api-service",
    status: "completed",
    conclusion: "success",
    runner_name: "ubuntu-runner-02",
    started_at: new Date(Date.now() - 480000).toISOString(), // 8 min ago
    completed_at: new Date(Date.now() - 360000).toISOString(), // 6 min ago
    duration: 120
  },
  {
    id: "job-7",
    name: "Integration Tests",
    job_name: "Integration Tests",
    workflow_name: "Build and Test",
    workflow_run_id: "run-2",
    repository: "acme-corp/api-service",
    status: "completed",
    conclusion: "success",
    runner_name: "ubuntu-runner-03",
    started_at: new Date(Date.now() - 360000).toISOString(), // 6 min ago
    completed_at: new Date(Date.now() - 300000).toISOString(), // 5 min ago
    duration: 60
  }
];

// Simulate live updates
export class DemoDataGenerator {
  private updateCallbacks: Array<() => void> = [];
  private interval: NodeJS.Timeout | null = null;
  
  constructor() {
    this.startLiveUpdates();
  }

  onUpdate(callback: () => void) {
    this.updateCallbacks.push(callback);
  }

  private startLiveUpdates() {
    this.interval = setInterval(() => {
      this.simulateUpdates();
      this.updateCallbacks.forEach(callback => callback());
    }, 8000); // Update every 8 seconds
  }

  private simulateUpdates() {
    // Randomly update runner statuses
    const randomRunner = demoRunners[Math.floor(Math.random() * demoRunners.length)];
    const statuses: DemoRunner['status'][] = ['online', 'busy', 'offline'];
    const newStatus = statuses[Math.floor(Math.random() * statuses.length)];
    
    if (randomRunner.status !== newStatus) {
      randomRunner.status = newStatus;
      randomRunner.last_seen = new Date().toISOString();
      
      if (newStatus === 'busy') {
        const jobs = ["Build Frontend", "Run Tests", "Deploy Service", "Security Scan", "Build Docker Image"];
        randomRunner.current_job = jobs[Math.floor(Math.random() * jobs.length)];
      } else {
        delete randomRunner.current_job;
      }
    }

    // Simulate job completions
    const inProgressJobs = demoJobs.filter(job => job.status === 'in_progress');
    if (inProgressJobs.length > 0 && Math.random() > 0.7) { // 30% chance
      const job = inProgressJobs[Math.floor(Math.random() * inProgressJobs.length)];
      job.status = 'completed';
      job.conclusion = Math.random() > 0.8 ? 'failure' : 'success'; // 20% failure rate
      job.completed_at = new Date().toISOString();
      
      if (job.started_at) {
        job.duration = Math.floor((Date.now() - new Date(job.started_at).getTime()) / 1000);
      }
    }

    // Simulate new workflow runs
    if (Math.random() > 0.85) { // 15% chance of new workflow
      const workflows = ["CI/CD Pipeline", "Build and Test", "Deploy Production", "Security Scan"];
      const repos = ["acme-corp/web-app", "acme-corp/api-service", "acme-corp/mobile-app", "acme-corp/ml-models"];
      
      const newRun: DemoWorkflowRun = {
        id: `run-${Date.now()}`,
        workflow_name: workflows[Math.floor(Math.random() * workflows.length)],
        repository: repos[Math.floor(Math.random() * repos.length)],
        status: 'queued',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        jobs_summary: {
          total: Math.floor(Math.random() * 4) + 1,
          completed: 0,
          failed: 0,
          in_progress: 0
        }
      };
      
      demoWorkflowRuns.unshift(newRun);
      // Keep only last 10 runs
      if (demoWorkflowRuns.length > 10) {
        demoWorkflowRuns.pop();
      }
    }
  }

  destroy() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.updateCallbacks = [];
  }
}

// Stats for dashboard
export const getDemoStats = () => {
  const totalRunners = demoRunners.length;
  const onlineRunners = demoRunners.filter(r => r.status === 'online' || r.status === 'busy').length;
  const busyRunners = demoRunners.filter(r => r.status === 'busy').length;
  
  const totalRuns = demoWorkflowRuns.length;
  const successfulRuns = demoWorkflowRuns.filter(r => r.conclusion === 'success').length;
  const failedRuns = demoWorkflowRuns.filter(r => r.conclusion === 'failure').length;
  
  return {
    runners: {
      total: totalRunners,
      online: onlineRunners,
      busy: busyRunners,
      offline: totalRunners - onlineRunners
    },
    workflows: {
      total: totalRuns,
      successful: successfulRuns,
      failed: failedRuns,
      success_rate: Math.round((successfulRuns / (successfulRuns + failedRuns)) * 100) || 0
    }
  };
};