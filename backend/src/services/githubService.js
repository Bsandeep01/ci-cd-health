const axios = require('axios');
const config = require('../config/config');
const logger = require('../config/logger');

class GitHubService {
  constructor() {
    this.api = axios.create({
      baseURL: config.github.apiUrl,
      headers: {
        'Authorization': `token ${config.github.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'CI-CD-Dashboard/1.0.0'
      },
      timeout: 30000
    });

    // Add response interceptor for logging
    this.api.interceptors.response.use(
      (response) => {
        logger.debug(`GitHub API ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`);
        return response;
      },
      (error) => {
        logger.error(`GitHub API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url} - ${error.response?.status} ${error.response?.statusText}`);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get workflow runs for a repository
   * @param {Object} options - Query options
   * @param {string} options.actor - Filter by user who triggered the workflow
   * @param {string} options.branch - Filter by branch
   * @param {string} options.event - Filter by event type
   * @param {string} options.status - Filter by status
   * @param {number} options.per_page - Number of results per page (max 100)
   * @param {number} options.page - Page number
   * @returns {Promise<Array>} Array of workflow runs
   */
  async getWorkflowRuns(options = {}) {
    try {
      const params = {
        per_page: options.per_page || 100,
        page: options.page || 1,
        ...(options.actor && { actor: options.actor }),
        ...(options.branch && { branch: options.branch }),
        ...(options.event && { event: options.event }),
        ...(options.status && { status: options.status })
      };

      const response = await this.api.get(
        `/repos/${config.github.owner}/${config.github.repo}/actions/runs`,
        { params }
      );

      return response.data;
    } catch (error) {
      logger.error('Failed to fetch workflow runs:', error.message);
      throw error;
    }
  }

  /**
   * Get a specific workflow run
   * @param {number} runId - Workflow run ID
   * @returns {Promise<Object>} Workflow run details
   */
  async getWorkflowRun(runId) {
    try {
      const response = await this.api.get(
        `/repos/${config.github.owner}/${config.github.repo}/actions/runs/${runId}`
      );

      return response.data;
    } catch (error) {
      logger.error(`Failed to fetch workflow run ${runId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get jobs for a workflow run
   * @param {number} runId - Workflow run ID
   * @returns {Promise<Array>} Array of jobs
   */
  async getWorkflowRunJobs(runId) {
    try {
      const response = await this.api.get(
        `/repos/${config.github.owner}/${config.github.repo}/actions/runs/${runId}/jobs`
      );

      return response.data;
    } catch (error) {
      logger.error(`Failed to fetch jobs for workflow run ${runId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get workflows for a repository
   * @returns {Promise<Array>} Array of workflows
   */
  async getWorkflows() {
    try {
      const response = await this.api.get(
        `/repos/${config.github.owner}/${config.github.repo}/actions/workflows`
      );

      return response.data;
    } catch (error) {
      logger.error('Failed to fetch workflows:', error.message);
      throw error;
    }
  }

  /**
   * Get workflow runs for a specific workflow
   * @param {number} workflowId - Workflow ID
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of workflow runs
   */
  async getWorkflowRunsByWorkflow(workflowId, options = {}) {
    try {
      const params = {
        per_page: options.per_page || 100,
        page: options.page || 1,
        ...(options.actor && { actor: options.actor }),
        ...(options.branch && { branch: options.branch }),
        ...(options.event && { event: options.event }),
        ...(options.status && { status: options.status })
      };

      const response = await this.api.get(
        `/repos/${config.github.owner}/${config.github.repo}/actions/workflows/${workflowId}/runs`,
        { params }
      );

      return response.data;
    } catch (error) {
      logger.error(`Failed to fetch workflow runs for workflow ${workflowId}:`, error.message);
      throw error;
    }
  }

  /**
   * Get repository information
   * @returns {Promise<Object>} Repository details
   */
  async getRepository() {
    try {
      const response = await this.api.get(
        `/repos/${config.github.owner}/${config.github.repo}`
      );

      return response.data;
    } catch (error) {
      logger.error('Failed to fetch repository information:', error.message);
      throw error;
    }
  }

  /**
   * Test GitHub API connection
   * @returns {Promise<boolean>} Connection status
   */
  async testConnection() {
    try {
      await this.getRepository();
      return true;
    } catch (error) {
      logger.error('GitHub API connection test failed:', error.message);
      return false;
    }
  }

  /**
   * Calculate duration for a workflow run
   * @param {Object} workflowRun - Workflow run object
   * @returns {number|null} Duration in minutes
   */
  calculateDuration(workflowRun) {
    if (!workflowRun.run_started_at || !workflowRun.updated_at) {
      return null;
    }

    const startTime = new Date(workflowRun.run_started_at);
    const endTime = new Date(workflowRun.updated_at);
    const durationMs = endTime.getTime() - startTime.getTime();
    
    return Math.round((durationMs / (1000 * 60)) * 100) / 100; // Convert to minutes with 2 decimal places
  }

  /**
   * Transform GitHub workflow run to our database format
   * @param {Object} workflowRun - GitHub workflow run object
   * @returns {Object} Transformed workflow run
   */
  transformWorkflowRun(workflowRun) {
    const duration = this.calculateDuration(workflowRun);
    
    return {
      id: workflowRun.id,
      workflow_id: workflowRun.workflow_id,
      name: workflowRun.name,
      head_branch: workflowRun.head_branch,
      head_sha: workflowRun.head_sha,
      run_number: workflowRun.run_number,
      status: workflowRun.status,
      conclusion: workflowRun.conclusion,
      created_at: workflowRun.created_at,
      updated_at: workflowRun.updated_at,
      run_started_at: workflowRun.run_started_at,
      jobs_url: workflowRun.jobs_url,
      logs_url: workflowRun.logs_url,
      check_suite_url: workflowRun.check_suite_url,
      artifacts_url: workflowRun.artifacts_url,
      cancel_url: workflowRun.cancel_url,
      rerun_url: workflowRun.rerun_url,
      workflow_url: workflowRun.workflow_url,
      head_commit: workflowRun.head_commit,
      repository: workflowRun.repository,
      head_repository: workflowRun.head_repository,
      actor: workflowRun.actor,
      triggering_actor: workflowRun.triggering_actor,
      run_attempt: workflowRun.run_attempt,
      referenced_workflows: workflowRun.referenced_workflows,
      run_started_at_timestamp: workflowRun.run_started_at,
      duration_minutes: duration,
      is_success: workflowRun.conclusion === 'success',
      is_failure: workflowRun.conclusion === 'failure',
      is_cancelled: workflowRun.conclusion === 'cancelled',
      is_skipped: workflowRun.conclusion === 'skipped',
      is_timed_out: workflowRun.conclusion === 'timed_out'
    };
  }
}

module.exports = new GitHubService();
