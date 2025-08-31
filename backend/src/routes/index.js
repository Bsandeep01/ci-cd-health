const express = require('express');
const metricsController = require('../controllers/metricsController');
const alertController = require('../controllers/alertController');
const { dataSyncService } = require('../services/dataSyncService');

const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'CI/CD Dashboard API'
  });
});

// Metrics routes
router.get('/metrics', metricsController.getMetrics);
router.get('/workflows', metricsController.getWorkflowRuns);
router.get('/workflows/:id', metricsController.getWorkflowRun);
router.get('/trends', metricsController.getTrends);

// Alert routes
router.get('/alerts', alertController.getAlerts);
router.post('/alerts/test', alertController.sendTestAlert);
router.post('/alerts/:id/retry', alertController.retryAlert);
router.get('/alerts/config', alertController.getAlertConfig);

// System routes
router.get('/system/sync/status', (req, res) => {
  const status = dataSyncService.getSyncStatus();
  res.json({
    success: true,
    data: status
  });
});

router.post('/system/sync/force', async (req, res) => {
  try {
    await dataSyncService.forceSync();
    res.json({
      success: true,
      message: 'Force sync initiated successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to initiate force sync',
      message: error.message
    });
  }
});

router.get('/system/test/github', async (req, res) => {
  try {
    const isConnected = await dataSyncService.testGitHubConnection();
    res.json({
      success: true,
      data: {
        connected: isConnected
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to test GitHub connection',
      message: error.message
    });
  }
});

router.get('/system/test/email', async (req, res) => {
  try {
    const isConnected = await dataSyncService.testEmailConnection();
    res.json({
      success: true,
      data: {
        connected: isConnected
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to test email connection',
      message: error.message
    });
  }
});

module.exports = router;
