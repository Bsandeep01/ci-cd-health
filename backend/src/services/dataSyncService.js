const cron = require('node-cron');
const { Op } = require('sequelize');
const config = require('../config/config');
const logger = require('../config/logger');
const { WorkflowRun, Alert } = require('../models');
const githubService = require('./githubService');
const emailService = require('./emailService');
const alertService = require('./alertService');

class DataSyncService {
  constructor() {
    this.isRunning = false;
    this.lastSyncTime = null;
    this.syncInterval = null;
  }

  /**
   * Start the data sync service
   */
  startDataSync() {
    if (this.isRunning) {
      logger.warn('Data sync service is already running');
      return;
    }

    this.isRunning = true;
    logger.info('Starting data sync service');

    // Initial sync
    this.syncWorkflowData();

    // Schedule periodic sync (every 5 minutes by default)
    const intervalMinutes = Math.floor(config.app.dataSyncInterval / 60000);
    this.syncInterval = cron.schedule(`*/${intervalMinutes} * * * *`, () => {
      this.syncWorkflowData();
    }, {
      scheduled: true,
      timezone: 'UTC'
    });

    logger.info(`Data sync scheduled to run every ${intervalMinutes} minutes`);
  }

  /**
   * Stop the data sync service
   */
  stopDataSync() {
    if (!this.isRunning) {
      logger.warn('Data sync service is not running');
      return;
    }

    this.isRunning = false;
    if (this.syncInterval) {
      this.syncInterval.stop();
      this.syncInterval = null;
    }

    logger.info('Data sync service stopped');
  }

  /**
   * Sync workflow data from GitHub
   */
  async syncWorkflowData() {
    if (!this.isRunning) {
      return;
    }

    try {
      logger.info('Starting workflow data sync');
      const startTime = Date.now();

      // Fetch recent workflow runs
      const workflowRuns = await githubService.getWorkflowRuns({
        per_page: 100,
        status: 'completed'
      });

      logger.info(`Fetched ${workflowRuns.workflow_runs?.length || 0} workflow runs from GitHub`);

      if (workflowRuns.workflow_runs && workflowRuns.workflow_runs.length > 0) {
        await this.processWorkflowRuns(workflowRuns.workflow_runs);
      }

      // Clean up old data
      await this.cleanupOldData();

      this.lastSyncTime = new Date();
      const duration = Date.now() - startTime;
      logger.info(`Workflow data sync completed in ${duration}ms`);
    } catch (error) {
      logger.error('Error during workflow data sync:', error);
    }
  }

  /**
   * Process workflow runs and store in database
   * @param {Array} workflowRuns - Array of workflow runs from GitHub
   */
  async processWorkflowRuns(workflowRuns) {
    let newRuns = 0;
    let updatedRuns = 0;
    let failedRuns = 0;

    for (const workflowRun of workflowRuns) {
      try {
        const transformedRun = githubService.transformWorkflowRun(workflowRun);
        
        // Check if workflow run already exists
        const existingRun = await WorkflowRun.findByPk(workflowRun.id);
        
        if (existingRun) {
          // Update existing run
          await existingRun.update(transformedRun);
          updatedRuns++;
          
          // Check if this is a new failure that needs alerting
          if (transformedRun.is_failure && !existingRun.is_failure) {
            await this.handleWorkflowFailure(transformedRun);
          }
        } else {
          // Create new run
          await WorkflowRun.create(transformedRun);
          newRuns++;
          
          // Check if this is a failure that needs alerting
          if (transformedRun.is_failure) {
            await this.handleWorkflowFailure(transformedRun);
          }
        }
      } catch (error) {
        logger.error(`Error processing workflow run ${workflowRun.id}:`, error);
        failedRuns++;
      }
    }

    logger.info(`Processed workflow runs: ${newRuns} new, ${updatedRuns} updated, ${failedRuns} failed`);
  }

  /**
   * Handle workflow failure and send alerts
   * @param {Object} workflowRun - Workflow run data
   */
  async handleWorkflowFailure(workflowRun) {
    try {
      logger.info(`Handling failure for workflow run ${workflowRun.id}: ${workflowRun.name} #${workflowRun.run_number}`);

      // Check if we should send alerts based on failure threshold
      const recentRuns = await WorkflowRun.findAll({
        where: {
          workflow_id: workflowRun.workflow_id,
          created_at: {
            [Op.gte]: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
          }
        },
        order: [['created_at', 'DESC']],
        limit: 10
      });

      const failureRate = recentRuns.filter(run => run.is_failure).length / recentRuns.length;

      if (failureRate > config.app.alertFailureThreshold) {
        logger.warn(`High failure rate detected for workflow ${workflowRun.name}: ${(failureRate * 100).toFixed(1)}%`);
      }

      // Send email alert
      if (config.features.emailAlerts) {
        await alertService.sendWorkflowFailureAlert(workflowRun, config.email.from);
      }

      // Send Slack alert if configured
      if (config.features.slackAlerts && config.slack.enabled) {
        await alertService.sendSlackAlert(workflowRun);
      }

    } catch (error) {
      logger.error(`Error handling workflow failure for run ${workflowRun.id}:`, error);
    }
  }

  /**
   * Clean up old data based on retention policy
   */
  async cleanupOldData() {
    try {
      const retentionDate = new Date();
      retentionDate.setDate(retentionDate.getDate() - config.app.dataRetentionDays);

      // Delete old workflow runs
      const deletedRuns = await WorkflowRun.destroy({
        where: {
          created_at: {
            [Op.lt]: retentionDate
          }
        }
      });

      // Delete old alerts
      const deletedAlerts = await Alert.destroy({
        where: {
          created_at: {
            [Op.lt]: retentionDate
          }
        }
      });

      if (deletedRuns > 0 || deletedAlerts > 0) {
        logger.info(`Cleanup completed: ${deletedRuns} workflow runs and ${deletedAlerts} alerts deleted`);
      }
    } catch (error) {
      logger.error('Error during data cleanup:', error);
    }
  }

  /**
   * Get sync status
   * @returns {Object} Sync status information
   */
  getSyncStatus() {
    return {
      isRunning: this.isRunning,
      lastSyncTime: this.lastSyncTime,
      syncInterval: config.app.dataSyncInterval,
      nextSyncTime: this.lastSyncTime ? 
        new Date(this.lastSyncTime.getTime() + config.app.dataSyncInterval) : 
        null
    };
  }

  /**
   * Force immediate sync
   */
  async forceSync() {
    logger.info('Force sync requested');
    await this.syncWorkflowData();
  }

  /**
   * Test GitHub connection
   * @returns {Promise<boolean>} Connection status
   */
  async testGitHubConnection() {
    try {
      const isConnected = await githubService.testConnection();
      logger.info(`GitHub connection test: ${isConnected ? 'SUCCESS' : 'FAILED'}`);
      return isConnected;
    } catch (error) {
      logger.error('GitHub connection test failed:', error);
      return false;
    }
  }

  /**
   * Test email connection
   * @returns {Promise<boolean>} Connection status
   */
  async testEmailConnection() {
    try {
      const isConnected = await emailService.testConnection();
      logger.info(`Email connection test: ${isConnected ? 'SUCCESS' : 'FAILED'}`);
      return isConnected;
    } catch (error) {
      logger.error('Email connection test failed:', error);
      return false;
    }
  }
}

// Create singleton instance
const dataSyncService = new DataSyncService();

// Export functions for external use
module.exports = {
  startDataSync: () => dataSyncService.startDataSync(),
  stopDataSync: () => dataSyncService.stopDataSync(),
  forceSync: () => dataSyncService.forceSync(),
  getSyncStatus: () => dataSyncService.getSyncStatus(),
  testGitHubConnection: () => dataSyncService.testGitHubConnection(),
  testEmailConnection: () => dataSyncService.testEmailConnection(),
  dataSyncService
};
