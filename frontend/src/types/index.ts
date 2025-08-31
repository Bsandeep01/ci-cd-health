// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Workflow Run types
export interface WorkflowRun {
  id: number;
  workflow_id: number;
  name: string;
  head_branch: string;
  head_sha: string;
  run_number: number;
  status: 'queued' | 'in_progress' | 'completed' | 'waiting';
  conclusion: 'success' | 'failure' | 'cancelled' | 'skipped' | 'timed_out' | null;
  created_at: string;
  updated_at: string;
  run_started_at: string | null;
  duration_minutes: number | null;
  actor?: {
    login: string;
  };
  triggering_actor?: {
    login: string;
  };
  is_success: boolean;
  is_failure: boolean;
  is_cancelled: boolean;
  is_skipped: boolean;
  is_timed_out: boolean;
}

// Metrics types
export interface MetricsSummary {
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  cancelledRuns: number;
  skippedRuns: number;
  successRate: number;
  failureRate: number;
  averageBuildTime: number;
}

export interface WorkflowBreakdown {
  [workflowName: string]: {
    total: number;
    success: number;
    failure: number;
    cancelled: number;
    skipped: number;
    averageDuration: number;
  };
}

export interface RecentActivity {
  id: number;
  name: string;
  run_number: number;
  status: string;
  conclusion: string | null;
  branch: string;
  commit_sha: string;
  duration_minutes: number | null;
  created_at: string;
  updated_at: string;
  actor: string | null;
  is_success: boolean;
  is_failure: boolean;
}

export interface MetricsData {
  summary: MetricsSummary;
  lastBuild: WorkflowRun | null;
  workflowBreakdown: WorkflowBreakdown;
  recentActivity: RecentActivity[];
  period: {
    days: number;
    startDate: string;
    endDate: string;
  };
}

// Alert types
export interface Alert {
  id: number;
  type: 'email' | 'slack' | 'webhook';
  status: 'pending' | 'sent' | 'failed';
  title: string;
  message: string;
  recipient: string | null;
  workflow_run_id: number | null;
  workflow_name: string | null;
  branch: string | null;
  commit_sha: string | null;
  error_message: string | null;
  sent_at: string | null;
  retry_count: number;
  metadata: any;
  created_at: string;
  updated_at: string;
}

// Pagination types
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

// Workflow Runs response
export interface WorkflowRunsResponse {
  workflowRuns: WorkflowRun[];
  pagination: Pagination;
}

// Alerts response
export interface AlertsResponse {
  alerts: Alert[];
  pagination: Pagination;
}

// System status types
export interface SyncStatus {
  isRunning: boolean;
  lastSyncTime: string | null;
  syncInterval: number;
  nextSyncTime: string | null;
}

export interface ConnectionTest {
  connected: boolean;
}

// Chart data types
export interface ChartDataPoint {
  date: string;
  total: number;
  success: number;
  failure: number;
  cancelled: number;
  skipped: number;
  averageDuration: number;
}

export interface TrendsData {
  trends: ChartDataPoint[];
  period: {
    days: number;
    interval: string;
    startDate: string;
    endDate: string;
  };
}
