const { Op } = require('sequelize');
const { WorkflowRun } = require('../models');
const logger = require('../config/logger');

class MetricsController {
  /**
   * Get overall pipeline metrics
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getMetrics(req, res) {
    try {
      const { days = 30 } = req.query;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));

      // Get workflow runs for the specified period
      const workflowRuns = await WorkflowRun.findAll({
        where: {
          created_at: {
            [Op.gte]: startDate
          }
        },
        order: [['created_at', 'DESC']]
      });

      // Calculate metrics
      const totalRuns = workflowRuns.length;
      const successfulRuns = workflowRuns.filter(run => run.is_success).length;
      const failedRuns = workflowRuns.filter(run => run.is_failure).length;
      const cancelledRuns = workflowRuns.filter(run => run.is_cancelled).length;
      const skippedRuns = workflowRuns.filter(run => run.is_skipped).length;

      // Calculate success/failure rates
      const successRate = totalRuns > 0 ? (successfulRuns / totalRuns) * 100 : 0;
      const failureRate = totalRuns > 0 ? (failedRuns / totalRuns) * 100 : 0;

      // Calculate average build time
      const runsWithDuration = workflowRuns.filter(run => run.duration_minutes !== null);
      const averageBuildTime = runsWithDuration.length > 0 
        ? runsWithDuration.reduce((sum, run) => sum + run.duration_minutes, 0) / runsWithDuration.length
        : 0;

      // Get last build status
      const lastBuild = workflowRuns[0] || null;

      // Get workflow breakdown
      const workflowBreakdown = {};
      workflowRuns.forEach(run => {
        if (!workflowBreakdown[run.name]) {
          workflowBreakdown[run.name] = {
            total: 0,
            success: 0,
            failure: 0,
            cancelled: 0,
            skipped: 0,
            averageDuration: 0
          };
        }
        
        workflowBreakdown[run.name].total++;
        if (run.is_success) workflowBreakdown[run.name].success++;
        if (run.is_failure) workflowBreakdown[run.name].failure++;
        if (run.is_cancelled) workflowBreakdown[run.name].cancelled++;
        if (run.is_skipped) workflowBreakdown[run.name].skipped++;
      });

      // Calculate average duration for each workflow
      Object.keys(workflowBreakdown).forEach(workflowName => {
        const workflowRuns = workflowRuns.filter(run => run.name === workflowName && run.duration_minutes !== null);
        if (workflowRuns.length > 0) {
          workflowBreakdown[workflowName].averageDuration = 
            workflowRuns.reduce((sum, run) => sum + run.duration_minutes, 0) / workflowRuns.length;
        }
      });

      // Get recent activity (last 10 runs)
      const recentActivity = workflowRuns.slice(0, 10).map(run => ({
        id: run.id,
        name: run.name,
        run_number: run.run_number,
        status: run.status,
        conclusion: run.conclusion,
        branch: run.head_branch,
        commit_sha: run.head_sha?.substring(0, 8),
        duration_minutes: run.duration_minutes,
        created_at: run.created_at,
        updated_at: run.updated_at,
        actor: run.actor?.login,
        is_success: run.is_success,
        is_failure: run.is_failure
      }));

      const metrics = {
        summary: {
          totalRuns,
          successfulRuns,
          failedRuns,
          cancelledRuns,
          skippedRuns,
          successRate: Math.round(successRate * 100) / 100,
          failureRate: Math.round(failureRate * 100) / 100,
          averageBuildTime: Math.round(averageBuildTime * 100) / 100
        },
        lastBuild: lastBuild ? {
          id: lastBuild.id,
          name: lastBuild.name,
          run_number: lastBuild.run_number,
          status: lastBuild.status,
          conclusion: lastBuild.conclusion,
          branch: lastBuild.head_branch,
          commit_sha: lastBuild.head_sha?.substring(0, 8),
          duration_minutes: lastBuild.duration_minutes,
          created_at: lastBuild.created_at,
          updated_at: lastBuild.updated_at,
          actor: lastBuild.actor?.login,
          is_success: lastBuild.is_success,
          is_failure: lastBuild.is_failure
        } : null,
        workflowBreakdown,
        recentActivity,
        period: {
          days: parseInt(days),
          startDate,
          endDate: new Date()
        }
      };

      res.json({
        success: true,
        data: metrics
      });

    } catch (error) {
      logger.error('Error getting metrics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get metrics',
        message: error.message
      });
    }
  }

  /**
   * Get workflow runs with pagination
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getWorkflowRuns(req, res) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        status, 
        conclusion, 
        workflow_name,
        branch,
        days = 30
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));

      // Build where clause
      const where = {
        created_at: {
          [Op.gte]: startDate
        }
      };

      if (status) where.status = status;
      if (conclusion) where.conclusion = conclusion;
      if (workflow_name) where.name = { [Op.like]: `%${workflow_name}%` };
      if (branch) where.head_branch = { [Op.like]: `%${branch}%` };

      // Get workflow runs
      const { count, rows: workflowRuns } = await WorkflowRun.findAndCountAll({
        where,
        order: [['created_at', 'DESC']],
        limit: parseInt(limit),
        offset
      });

      // Transform data for response
      const transformedRuns = workflowRuns.map(run => ({
        id: run.id,
        workflow_id: run.workflow_id,
        name: run.name,
        run_number: run.run_number,
        status: run.status,
        conclusion: run.conclusion,
        head_branch: run.head_branch,
        head_sha: run.head_sha,
        duration_minutes: run.duration_minutes,
        created_at: run.created_at,
        updated_at: run.updated_at,
        actor: run.actor?.login,
        triggering_actor: run.triggering_actor?.login,
        is_success: run.is_success,
        is_failure: run.is_failure,
        is_cancelled: run.is_cancelled,
        is_skipped: run.is_skipped,
        is_timed_out: run.is_timed_out
      }));

      res.json({
        success: true,
        data: {
          workflowRuns: transformedRuns,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total: count,
            totalPages: Math.ceil(count / parseInt(limit)),
            hasNext: offset + parseInt(limit) < count,
            hasPrev: parseInt(page) > 1
          }
        }
      });

    } catch (error) {
      logger.error('Error getting workflow runs:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get workflow runs',
        message: error.message
      });
    }
  }

  /**
   * Get specific workflow run details
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getWorkflowRun(req, res) {
    try {
      const { id } = req.params;

      const workflowRun = await WorkflowRun.findByPk(id);

      if (!workflowRun) {
        return res.status(404).json({
          success: false,
          error: 'Workflow run not found'
        });
      }

      const runData = {
        id: workflowRun.id,
        workflow_id: workflowRun.workflow_id,
        name: workflowRun.name,
        run_number: workflowRun.run_number,
        status: workflowRun.status,
        conclusion: workflowRun.conclusion,
        head_branch: workflowRun.head_branch,
        head_sha: workflowRun.head_sha,
        duration_minutes: workflowRun.duration_minutes,
        created_at: workflowRun.created_at,
        updated_at: workflowRun.updated_at,
        run_started_at: workflowRun.run_started_at,
        actor: workflowRun.actor,
        triggering_actor: workflowRun.triggering_actor,
        head_commit: workflowRun.head_commit,
        repository: workflowRun.repository,
        is_success: workflowRun.is_success,
        is_failure: workflowRun.is_failure,
        is_cancelled: workflowRun.is_cancelled,
        is_skipped: workflowRun.is_skipped,
        is_timed_out: workflowRun.is_timed_out
      };

      res.json({
        success: true,
        data: runData
      });

    } catch (error) {
      logger.error('Error getting workflow run:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get workflow run',
        message: error.message
      });
    }
  }

  /**
   * Get workflow trends over time
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getTrends(req, res) {
    try {
      const { days = 30, interval = 'day' } = req.query;
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));

      // Get workflow runs for the specified period
      const workflowRuns = await WorkflowRun.findAll({
        where: {
          created_at: {
            [Op.gte]: startDate
          }
        },
        order: [['created_at', 'ASC']]
      });

      // Group by interval (day, week, month)
      const trends = this.groupByInterval(workflowRuns, interval);

      res.json({
        success: true,
        data: {
          trends,
          period: {
            days: parseInt(days),
            interval,
            startDate,
            endDate: new Date()
          }
        }
      });

    } catch (error) {
      logger.error('Error getting trends:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get trends',
        message: error.message
      });
    }
  }

  /**
   * Group workflow runs by time interval
   * @param {Array} workflowRuns - Array of workflow runs
   * @param {string} interval - Time interval (day, week, month)
   * @returns {Object} Grouped data
   */
  groupByInterval(workflowRuns, interval) {
    const groups = {};

    workflowRuns.forEach(run => {
      let key;
      const date = new Date(run.created_at);

      switch (interval) {
        case 'day':
          key = date.toISOString().split('T')[0];
          break;
        case 'week':
          const weekStart = new Date(date);
          weekStart.setDate(date.getDate() - date.getDay());
          key = weekStart.toISOString().split('T')[0];
          break;
        case 'month':
          key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
          break;
        default:
          key = date.toISOString().split('T')[0];
      }

      if (!groups[key]) {
        groups[key] = {
          date: key,
          total: 0,
          success: 0,
          failure: 0,
          cancelled: 0,
          skipped: 0,
          averageDuration: 0,
          durations: []
        };
      }

      groups[key].total++;
      if (run.is_success) groups[key].success++;
      if (run.is_failure) groups[key].failure++;
      if (run.is_cancelled) groups[key].cancelled++;
      if (run.is_skipped) groups[key].skipped++;
      if (run.duration_minutes !== null) {
        groups[key].durations.push(run.duration_minutes);
      }
    });

    // Calculate average duration for each group
    Object.keys(groups).forEach(key => {
      if (groups[key].durations.length > 0) {
        groups[key].averageDuration = 
          groups[key].durations.reduce((sum, duration) => sum + duration, 0) / groups[key].durations.length;
      }
      delete groups[key].durations;
    });

    return Object.values(groups).sort((a, b) => a.date.localeCompare(b.date));
  }
}

module.exports = new MetricsController();
