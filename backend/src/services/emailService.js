const nodemailer = require('nodemailer');
const config = require('../config/config');
const logger = require('../config/logger');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initializeTransporter();
  }

  /**
   * Initialize email transporter
   */
  initializeTransporter() {
    try {
      this.transporter = nodemailer.createTransporter({
        service: config.email.service,
        host: config.email.host,
        port: config.email.port,
        secure: config.email.secure,
        auth: {
          user: config.email.user,
          pass: config.email.password,
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      logger.info('Email transporter initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize email transporter:', error);
      throw error;
    }
  }

  /**
   * Test email configuration
   * @returns {Promise<boolean>} Test result
   */
  async testConnection() {
    try {
      await this.transporter.verify();
      logger.info('Email connection test successful');
      return true;
    } catch (error) {
      logger.error('Email connection test failed:', error);
      return false;
    }
  }

  /**
   * Send email alert
   * @param {Object} options - Email options
   * @param {string} options.to - Recipient email
   * @param {string} options.subject - Email subject
   * @param {string} options.html - Email HTML content
   * @param {string} options.text - Email text content
   * @returns {Promise<Object>} Send result
   */
  async sendEmail(options) {
    try {
      const mailOptions = {
        from: config.email.from,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text || this.stripHtml(options.html)
      };

      const result = await this.transporter.sendMail(mailOptions);
      logger.info(`Email sent successfully to ${options.to}: ${result.messageId}`);
      
      return {
        success: true,
        messageId: result.messageId,
        response: result.response
      };
    } catch (error) {
      logger.error(`Failed to send email to ${options.to}:`, error);
      throw error;
    }
  }

  /**
   * Send workflow failure alert
   * @param {Object} workflowRun - Workflow run data
   * @param {string} recipient - Email recipient
   * @returns {Promise<Object>} Send result
   */
  async sendWorkflowFailureAlert(workflowRun, recipient) {
    const subject = `🚨 Pipeline Failure: ${workflowRun.name} #${workflowRun.run_number}`;
    
    const html = this.generateWorkflowFailureEmail(workflowRun);
    const text = this.generateWorkflowFailureText(workflowRun);

    return this.sendEmail({
      to: recipient,
      subject,
      html,
      text
    });
  }

  /**
   * Send test alert
   * @param {string} recipient - Email recipient
   * @returns {Promise<Object>} Send result
   */
  async sendTestAlert(recipient) {
    const subject = '🧪 CI/CD Dashboard Test Alert';
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">CI/CD Dashboard Test Alert</h2>
        <p>This is a test email to verify that the CI/CD Dashboard alert system is working correctly.</p>
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Test Details:</strong></p>
          <ul>
            <li>Timestamp: ${new Date().toISOString()}</li>
            <li>Service: CI/CD Dashboard Backend</li>
            <li>Environment: ${config.app.nodeEnv}</li>
          </ul>
        </div>
        <p>If you received this email, the alert system is configured correctly.</p>
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
          This is an automated message from the CI/CD Dashboard. Please do not reply to this email.
        </p>
      </div>
    `;

    const text = `CI/CD Dashboard Test Alert\n\nThis is a test email to verify that the CI/CD Dashboard alert system is working correctly.\n\nTest Details:\n- Timestamp: ${new Date().toISOString()}\n- Service: CI/CD Dashboard Backend\n- Environment: ${config.app.nodeEnv}\n\nIf you received this email, the alert system is configured correctly.`;

    return this.sendEmail({
      to: recipient,
      subject,
      html,
      text
    });
  }

  /**
   * Generate HTML email for workflow failure
   * @param {Object} workflowRun - Workflow run data
   * @returns {string} HTML content
   */
  generateWorkflowFailureEmail(workflowRun) {
    const duration = workflowRun.duration_minutes ? `${workflowRun.duration_minutes} minutes` : 'Unknown';
    const branch = workflowRun.head_branch || 'Unknown';
    const commitSha = workflowRun.head_sha ? workflowRun.head_sha.substring(0, 8) : 'Unknown';
    const actor = workflowRun.actor?.login || 'Unknown';

    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #dc3545; color: white; padding: 20px; border-radius: 5px 5px 0 0;">
          <h1 style="margin: 0; font-size: 24px;">🚨 Pipeline Failure</h1>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 0 0 5px 5px;">
          <h2 style="color: #333; margin-top: 0;">${workflowRun.name} #${workflowRun.run_number}</h2>
          
          <div style="background-color: white; padding: 15px; border-radius: 5px; margin: 15px 0; border-left: 4px solid #dc3545;">
            <p style="margin: 0;"><strong>Status:</strong> <span style="color: #dc3545;">Failed</span></p>
            <p style="margin: 5px 0;"><strong>Branch:</strong> ${branch}</p>
            <p style="margin: 5px 0;"><strong>Commit:</strong> ${commitSha}</p>
            <p style="margin: 5px 0;"><strong>Triggered by:</strong> ${actor}</p>
            <p style="margin: 5px 0;"><strong>Duration:</strong> ${duration}</p>
            <p style="margin: 5px 0;"><strong>Started:</strong> ${new Date(workflowRun.created_at).toLocaleString()}</p>
          </div>
          
          <div style="margin: 20px 0;">
            <a href="${workflowRun.html_url || '#'}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View Details on GitHub
            </a>
          </div>
          
          <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 15px 0;">
            <h3 style="margin-top: 0; color: #856404;">Next Steps</h3>
            <ul style="color: #856404;">
              <li>Check the GitHub Actions logs for detailed error information</li>
              <li>Review recent code changes that might have caused the failure</li>
              <li>Fix the issue and push a new commit to trigger a new build</li>
              <li>Monitor the next build to ensure it passes</li>
            </ul>
          </div>
        </div>
        
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
          This is an automated alert from the CI/CD Dashboard. Please do not reply to this email.<br>
          Repository: ${config.github.owner}/${config.github.repo}
        </p>
      </div>
    `;
  }

  /**
   * Generate text email for workflow failure
   * @param {Object} workflowRun - Workflow run data
   * @returns {string} Text content
   */
  generateWorkflowFailureText(workflowRun) {
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

View Details: ${workflowRun.html_url || 'N/A'}

Next Steps:
- Check the GitHub Actions logs for detailed error information
- Review recent code changes that might have caused the failure
- Fix the issue and push a new commit to trigger a new build
- Monitor the next build to ensure it passes

This is an automated alert from the CI/CD Dashboard.
Repository: ${config.github.owner}/${config.github.repo}`;
  }

  /**
   * Strip HTML tags from text
   * @param {string} html - HTML content
   * @returns {string} Plain text
   */
  stripHtml(html) {
    return html.replace(/<[^>]*>/g, '');
  }
}

module.exports = new EmailService();
