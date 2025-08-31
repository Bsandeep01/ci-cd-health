const axios = require('axios');
const config = require('../config/config');
const logger = require('../config/logger');
const { Alert } = require('../models');
const emailService = require('./emailService');

class AlertService {
  constructor() {
    this.slackWebhook = config.slack.webhookUrl;
    this.slackChannel = config.slack.channel;
  }

  /**
   * Send workflow failure alert
   * @param {Object} workflowRun - Workflow run data
   * @param {string} recipient - Email recipient
   * @returns {Promise<Object>} Alert result
   */
  async sendWorkflowFailureAlert(workflowRun, recipient) {
    try {
      logger.info(`Sending workflow failure alert for run ${workflowRun.id}`);

      // Create alert record
      const alert = await Alert.create({
        type: 'email',
        status: 'pending',
        title: `Pipeline Failure: ${workflowRun.name} #${workflowRun.run_number}`,
        message: this.generateAlertMessage(workflowRun),
        recipient: recipient,
        workflow_run_id: workflowRun.id,
        workflow_name: workflowRun.name,
        branch: workflowRun.head_branch,
        commit_sha: workflowRun.head_sha,
        metadata: {
          duration: workflowRun.duration_minutes,
          actor: workflowRun.actor?.login,
          conclusion: workflowRun.conclusion
        }
      });

      // Send email
      const emailResult = await emailService.sendWorkflowFailureAlert(workflowRun, recipient);

      // Update alert status
      await alert.update({
        status: 'sent',
        sent_at: new Date(),
        metadata: {
          ...alert.metadata,
          messageId: emailResult.messageId,
          response: emailResult.response
        }
      });

      logger.info(`Workflow failure alert sent successfully: ${emailResult.messageId}`);
      return { success: true, alertId: alert.id, messageId: emailResult.messageId };

    } catch (error) {
      logger.error(`Failed to send workflow failure alert for run ${workflowRun.id}:`, error);

      // Update alert status if it exists
      if (alert) {
        await alert.update({
          status: 'failed',
          error_message: error.message,
          retry_count: alert.retry_count + 1
        });
      }

      throw error;
    }
  }

  /**
   * Send Slack alert
   * @param {Object} workflowRun - Workflow run data
   * @returns {Promise<Object>} Alert result
   */
  async sendSlackAlert(workflowRun) {
    if (!this.slackWebhook) {
      logger.warn('Slack webhook not configured, skipping Slack alert');
      return { success: false, reason: 'Slack not configured' };
    }

    try {
      logger.info(`Sending Slack alert for workflow run ${workflowRun.id}`);

      // Create alert record
      const alert = await Alert.create({
        type: 'slack',
        status: 'pending',
        title: `Pipeline Failure: ${workflowRun.name} #${workflowRun.run_number}`,
        message: this.generateAlertMessage(workflowRun),
        recipient: this.slackChannel,
        workflow_run_id: workflowRun.id,
        workflow_name: workflowRun.name,
        branch: workflowRun.head_branch,
        commit_sha: workflowRun.head_sha,
        metadata: {
          duration: workflowRun.duration_minutes,
          actor: workflowRun.actor?.login,
          conclusion: workflowRun.conclusion
        }
      });

      // Prepare Slack message
      const slackMessage = this.generateSlackMessage(workflowRun);

      // Send to Slack
      const response = await axios.post(this.slackWebhook, slackMessage, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      if (response.status === 200) {
        // Update alert status
        await alert.update({
          status: 'sent',
          sent_at: new Date(),
          metadata: {
            ...alert.metadata,
            slackResponse: response.data
          }
        });

        logger.info(`Slack alert sent successfully for run ${workflowRun.id}`);
        return { success: true, alertId: alert.id };
      } else {
        throw new Error(`Slack API returned status ${response.status}`);
      }

    } catch (error) {
      logger.error(`Failed to send Slack alert for run ${workflowRun.id}:`, error);

      // Update alert status if it exists
      if (alert) {
        await alert.update({
          status: 'failed',
          error_message: error.message,
          retry_count: alert.retry_count + 1
        });
      }

      throw error;
    }
  }

  /**
   * Send test alert
   * @param {string} recipient - Email recipient
   * @returns {Promise<Object>} Alert result
   */
  async sendTestAlert(recipient) {
    try {
      logger.info(`Sending test alert to ${recipient}`);

      // Create alert record
      const alert = await Alert.create({
        type: 'email',
        status: 'pending',
        title: 'CI/CD Dashboard Test Alert',
        message: 'This is a test alert to verify the alert system is working correctly.',
        recipient: recipient,
        metadata: {
          test: true,
          timestamp: new Date().toISOString()
        }
      });

      // Send test email
      const emailResult = await emailService.sendTestAlert(recipient);

      // Update alert status
      await alert.update({
        status: 'sent',
        sent_at: new Date(),
        metadata: {
          ...alert.metadata,
          messageId: emailResult.messageId,
          response: emailResult.response
        }
      });

      logger.info(`Test alert sent successfully: ${emailResult.messageId}`);
      return { success: true, alertId: alert.id, messageId: emailResult.messageId };

    } catch (error) {
      logger.error(`Failed to send test alert to ${recipient}:`, error);

      // Update alert status if it exists
      if (alert) {
        await alert.update({
          status: 'failed',
          error_message: error.message,
          retry_count: alert.retry_count + 1
        });
      }

      throw error;
    }
  }

  /**
   * Get alert history
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Array of alerts
   */
  async getAlertHistory(options = {}) {
    try {
      const where = {};
      
      if (options.type) {
        where.type = options.type;
      }
      
      if (options.status) {
        where.status = options.status;
      }

      if (options.workflow_run_id) {
        where.workflow_run_id = options.workflow_run_id;
      }

      const alerts = await Alert.findAll({
        where,
        order: [['created_at', 'DESC']],
        limit: options.limit || 50,
        offset: options.offset || 0
      });

      return alerts;
    } catch (error) {
      logger.error('Failed to get alert history:', error);
      throw error;
    }
  }

  /**
   * Retry failed alerts
   * @param {number} alertId - Alert ID to retry
   * @returns {Promise<Object>} Retry result
   */
  async retryAlert(alertId) {
    try {
      const alert = await Alert.findByPk(alertId);
      
      if (!alert) {
        throw new Error('Alert not found');
      }

      if (alert.status !== 'failed') {
        throw new Error('Alert is not in failed status');
      }

      if (alert.retry_count >= 3) {
        throw new Error('Maximum retry attempts reached');
      }

      // Reset alert status
      await alert.update({
        status: 'pending',
        error_message: null
      });

      // Retry based on alert type
      if (alert.type === 'email') {
        return await this.sendWorkflowFailureAlert(
          {
            id: alert.workflow_run_id,
            name: alert.workflow_name,
            run_number: alert.metadata?.run_number,
            head_branch: alert.branch,
            head_sha: alert.commit_sha,
            actor: { login: alert.metadata?.actor },
            conclusion: alert.metadata?.conclusion,
            duration_minutes: alert.metadata?.duration,
            created_at: alert.created_at
          },
          alert.recipient
        );
      } else if (alert.type === 'slack') {
        return await this.sendSlackAlert({
          id: alert.workflow_run_id,
          name: alert.workflow_name,
          run_number: alert.metadata?.run_number,
          head_branch: alert.branch,
          head_sha: alert.commit_sha,
          actor: { login: alert.metadata?.actor },
          conclusion: alert.metadata?.conclusion,
          duration_minutes: alert.metadata?.duration,
          created_at: alert.created_at
        });
      }

    } catch (error) {
      logger.error(`Failed to retry alert ${alertId}:`, error);
      throw error;
    }
  }

  /**
   * Generate alert message
   * @param {Object} workflowRun - Workflow run data
   * @returns {string} Alert message
   */
  generateAlertMessage(workflowRun) {
    const duration = workflowRun.duration_minutes ? `${workflowRun.duration_minutes} minutes` : 'Unknown';
    const branch = workflowRun.head_branch || 'Unknown';
    const commitSha = workflowRun.head_sha ? workflowRun.head_sha.substring(0, 8) : 'Unknown';
    const actor = workflowRun.actor?.login || 'Unknown';

    return `Pipeline Failure Alert

Workflow: ${workflowRun.name} #${workflowRun.run_number}
Status: Failed
Branch: ${branch}
Commit: ${commitSha}
Triggered by: ${actor}
Duration: ${duration}
Started: ${new Date(workflowRun.created_at).toLocaleString()}

Repository: ${config.github.owner}/${config.github.repo}`;
  }

  /**
   * Generate Slack message
   * @param {Object} workflowRun - Workflow run data
   * @returns {Object} Slack message object
   */
  generateSlackMessage(workflowRun) {
    const duration = workflowRun.duration_minutes ? `${workflowRun.duration_minutes} minutes` : 'Unknown';
    const branch = workflowRun.head_branch || 'Unknown';
    const commitSha = workflowRun.head_sha ? workflowRun.head_sha.substring(0, 8) : 'Unknown';
    const actor = workflowRun.actor?.login || 'Unknown';

    return {
      channel: this.slackChannel,
      text: `🚨 Pipeline Failure Alert`,
      attachments: [
        {
          color: '#dc3545',
          title: `${workflowRun.name} #${workflowRun.run_number}`,
          title_link: workflowRun.html_url || '#',
          fields: [
            {
              title: 'Status',
              value: 'Failed',
              short: true
            },
            {
              title: 'Branch',
              value: branch,
              short: true
            },
            {
              title: 'Commit',
              value: commitSha,
              short: true
            },
            {
              title: 'Triggered by',
              value: actor,
              short: true
            },
            {
              title: 'Duration',
              value: duration,
              short: true
            },
            {
              title: 'Started',
              value: new Date(workflowRun.created_at).toLocaleString(),
              short: true
            }
          ],
          footer: `${config.github.owner}/${config.github.repo}`,
          ts: Math.floor(new Date(workflowRun.created_at).getTime() / 1000)
        }
      ]
    };
  }
}

module.exports = new AlertService();
