const WorkflowRun = require('./WorkflowRun');
const Alert = require('./Alert');

// Define model relationships
// WorkflowRun has many Alerts
WorkflowRun.hasMany(Alert, {
  foreignKey: 'workflow_run_id',
  as: 'alerts'
});

// Alert belongs to WorkflowRun
Alert.belongsTo(WorkflowRun, {
  foreignKey: 'workflow_run_id',
  as: 'workflowRun'
});

module.exports = {
  WorkflowRun,
  Alert
};
