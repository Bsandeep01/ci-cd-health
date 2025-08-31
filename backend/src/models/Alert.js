const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Alert = sequelize.define('Alert', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    comment: 'Alert ID'
  },
  type: {
    type: DataTypes.ENUM('email', 'slack', 'webhook'),
    allowNull: false,
    comment: 'Alert type'
  },
  status: {
    type: DataTypes.ENUM('pending', 'sent', 'failed'),
    allowNull: false,
    defaultValue: 'pending',
    comment: 'Alert status'
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Alert title'
  },
  message: {
    type: DataTypes.TEXT,
    allowNull: false,
    comment: 'Alert message'
  },
  recipient: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Alert recipient (email, channel, etc.)'
  },
  workflow_run_id: {
    type: DataTypes.BIGINT,
    allowNull: true,
    comment: 'Related workflow run ID'
  },
  workflow_name: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Workflow name'
  },
  branch: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Branch name'
  },
  commit_sha: {
    type: DataTypes.STRING,
    allowNull: true,
    comment: 'Commit SHA'
  },
  error_message: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Error message if alert failed'
  },
  sent_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When the alert was sent'
  },
  retry_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0,
    comment: 'Number of retry attempts'
  },
  metadata: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Additional alert metadata'
  }
}, {
  tableName: 'alerts',
  indexes: [
    {
      fields: ['type']
    },
    {
      fields: ['status']
    },
    {
      fields: ['workflow_run_id']
    },
    {
      fields: ['created_at']
    },
    {
      fields: ['sent_at']
    }
  ]
});

module.exports = Alert;
