const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const WorkflowRun = sequelize.define('WorkflowRun', {
  id: {
    type: DataTypes.BIGINT,
    primaryKey: true,
    allowNull: false,
    comment: 'GitHub workflow run ID'
  },
  workflow_id: {
    type: DataTypes.BIGINT,
    allowNull: false,
    comment: 'GitHub workflow ID'
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Workflow name'
  },
  head_branch: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Branch name'
  },
  head_sha: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'Commit SHA'
  },
  run_number: {
    type: DataTypes.INTEGER,
    allowNull: false,
    comment: 'Run number'
  },
  status: {
    type: DataTypes.ENUM('queued', 'in_progress', 'completed', 'waiting'),
    allowNull: false,
    comment: 'Workflow status'
  },
  conclusion: {
    type: DataTypes.ENUM('success', 'failure', 'cancelled', 'skipped', 'timed_out'),
    allowNull: true,
    comment: 'Workflow conclusion'
  },
  created_at: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: 'GitHub created timestamp'
  },
  updated_at: {
    type: DataTypes.DATE,
    allowNull: false,
    comment: 'GitHub updated timestamp'
  },
  run_started_at: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'When the run started'
  },
  jobs_url: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'GitHub jobs API URL'
  },
  logs_url: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'GitHub logs API URL'
  },
  check_suite_url: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'GitHub check suite URL'
  },
  artifacts_url: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'GitHub artifacts API URL'
  },
  cancel_url: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'GitHub cancel API URL'
  },
  rerun_url: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'GitHub rerun API URL'
  },
  workflow_url: {
    type: DataTypes.STRING,
    allowNull: false,
    comment: 'GitHub workflow API URL'
  },
  head_commit: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Head commit information'
  },
  repository: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Repository information'
  },
  head_repository: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Head repository information'
  },
  actor: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Actor information'
  },
  triggering_actor: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Triggering actor information'
  },
  run_attempt: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: 'Run attempt number'
  },
  referenced_workflows: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Referenced workflows'
  },
  run_started_at_timestamp: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Parsed run started timestamp'
  },
  duration_minutes: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
    comment: 'Duration in minutes'
  },
  is_success: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Whether the run was successful'
  },
  is_failure: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Whether the run failed'
  },
  is_cancelled: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Whether the run was cancelled'
  },
  is_skipped: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Whether the run was skipped'
  },
  is_timed_out: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
    comment: 'Whether the run timed out'
  }
}, {
  tableName: 'workflow_runs',
  indexes: [
    {
      fields: ['workflow_id']
    },
    {
      fields: ['status']
    },
    {
      fields: ['conclusion']
    },
    {
      fields: ['created_at']
    },
    {
      fields: ['is_success']
    },
    {
      fields: ['is_failure']
    }
  ]
});

module.exports = WorkflowRun;
