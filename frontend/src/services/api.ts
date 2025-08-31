import axios, { AxiosResponse } from 'axios';
import {
  ApiResponse,
  MetricsData,
  WorkflowRunsResponse,
  AlertsResponse,
  SyncStatus,
  ConnectionTest,
  TrendsData
} from '../types';

// Create axios instance
const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    // Add any auth headers here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error);
    return Promise.reject(error);
  }
);

// Health check
export const healthCheck = async (): Promise<ApiResponse<any>> => {
  const response = await api.get('/health');
  return response.data;
};

// Metrics API
export const getMetrics = async (days: number = 30): Promise<ApiResponse<MetricsData>> => {
  const response = await api.get(`/metrics?days=${days}`);
  return response.data;
};

export const getWorkflowRuns = async (
  page: number = 1,
  limit: number = 20,
  filters?: {
    status?: string;
    conclusion?: string;
    workflow_name?: string;
    branch?: string;
    days?: number;
  }
): Promise<ApiResponse<WorkflowRunsResponse>> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(filters?.status && { status: filters.status }),
    ...(filters?.conclusion && { conclusion: filters.conclusion }),
    ...(filters?.workflow_name && { workflow_name: filters.workflow_name }),
    ...(filters?.branch && { branch: filters.branch }),
    ...(filters?.days && { days: filters.days.toString() }),
  });

  const response = await api.get(`/workflows?${params}`);
  return response.data;
};

export const getWorkflowRun = async (id: number): Promise<ApiResponse<any>> => {
  const response = await api.get(`/workflows/${id}`);
  return response.data;
};

export const getTrends = async (
  days: number = 30,
  interval: string = 'day'
): Promise<ApiResponse<TrendsData>> => {
  const response = await api.get(`/trends?days=${days}&interval=${interval}`);
  return response.data;
};

// Alerts API
export const getAlerts = async (
  page: number = 1,
  limit: number = 20,
  filters?: {
    type?: string;
    status?: string;
    workflow_run_id?: number;
  }
): Promise<ApiResponse<AlertsResponse>> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    ...(filters?.type && { type: filters.type }),
    ...(filters?.status && { status: filters.status }),
    ...(filters?.workflow_run_id && { workflow_run_id: filters.workflow_run_id.toString() }),
  });

  const response = await api.get(`/alerts?${params}`);
  return response.data;
};

export const sendTestAlert = async (recipient: string): Promise<ApiResponse<any>> => {
  const response = await api.post('/alerts/test', { recipient });
  return response.data;
};

export const retryAlert = async (id: number): Promise<ApiResponse<any>> => {
  const response = await api.post(`/alerts/${id}/retry`);
  return response.data;
};

export const getAlertConfig = async (): Promise<ApiResponse<any>> => {
  const response = await api.get('/alerts/config');
  return response.data;
};

// System API
export const getSyncStatus = async (): Promise<ApiResponse<SyncStatus>> => {
  const response = await api.get('/system/sync/status');
  return response.data;
};

export const forceSync = async (): Promise<ApiResponse<any>> => {
  const response = await api.post('/system/sync/force');
  return response.data;
};

export const testGitHubConnection = async (): Promise<ApiResponse<ConnectionTest>> => {
  const response = await api.get('/system/test/github');
  return response.data;
};

export const testEmailConnection = async (): Promise<ApiResponse<ConnectionTest>> => {
  const response = await api.get('/system/test/email');
  return response.data;
};

export default api;
