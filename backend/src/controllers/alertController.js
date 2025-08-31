const alertService = require('../services/alertService');
const config = require('../config/config');
const logger = require('../config/logger');

class AlertController {
  /**
   * Get alert history
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getAlerts(req, res) {
    try {
      const { 
        page = 1, 
        limit = 20, 
        type, 
        status,
        workflow_run_id 
      } = req.query;

      const offset = (parseInt(page) - 1) * parseInt(limit);

      const alerts = await alertService.getAlertHistory({
        type,
        status,
        workflow_run_id,
        limit: parseInt(limit),
        offset
      });

      res.json({
        success: true,
        data: {
          alerts,
          pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            hasNext: alerts.length === parseInt(limit)
          }
        }
      });

    } catch (error) {
      logger.error('Error getting alerts:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get alerts',
        message: error.message
      });
    }
  }

  /**
   * Send test alert
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async sendTestAlert(req, res) {
    try {
      const { recipient } = req.body;

      if (!recipient) {
        return res.status(400).json({
          success: false,
          error: 'Recipient email is required'
        });
      }

      const result = await alertService.sendTestAlert(recipient);

      res.json({
        success: true,
        data: result,
        message: 'Test alert sent successfully'
      });

    } catch (error) {
      logger.error('Error sending test alert:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to send test alert',
        message: error.message
      });
    }
  }

  /**
   * Retry failed alert
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async retryAlert(req, res) {
    try {
      const { id } = req.params;

      if (!id) {
        return res.status(400).json({
          success: false,
          error: 'Alert ID is required'
        });
      }

      const result = await alertService.retryAlert(parseInt(id));

      res.json({
        success: true,
        data: result,
        message: 'Alert retry initiated successfully'
      });

    } catch (error) {
      logger.error('Error retrying alert:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to retry alert',
        message: error.message
      });
    }
  }

  /**
   * Get alert configuration
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getAlertConfig(req, res) {
    try {
      const config = {
        email: {
          enabled: true,
          service: process.env.EMAIL_SERVICE,
          host: process.env.EMAIL_HOST,
          port: process.env.EMAIL_PORT,
          user: process.env.EMAIL_USER,
          from: process.env.EMAIL_FROM
        },
        slack: {
          enabled: !!process.env.SLACK_WEBHOOK_URL,
          webhookUrl: process.env.SLACK_WEBHOOK_URL ? '***configured***' : null,
          channel: process.env.SLACK_CHANNEL
        },
        thresholds: {
          failureThreshold: parseFloat(process.env.ALERT_FAILURE_THRESHOLD) || 0.8
        }
      };

      res.json({
        success: true,
        data: config
      });

    } catch (error) {
      logger.error('Error getting alert config:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get alert configuration',
        message: error.message
      });
    }
  }
}

module.exports = new AlertController();
