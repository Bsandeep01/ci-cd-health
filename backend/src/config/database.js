const { Sequelize } = require('sequelize');
const path = require('path');
const config = require('./config');
const logger = require('./logger');

// Parse database URL to get storage path for SQLite
const getStoragePath = (databaseUrl) => {
  if (databaseUrl.includes('sqlite://')) {
    const storagePath = databaseUrl.replace('sqlite://', '');
    return path.resolve(__dirname, '../../..', storagePath);
  }
  return null;
};

// Create Sequelize instance
const sequelize = new Sequelize(config.database.url, {
  dialect: config.database.dialect,
  logging: config.database.logging ? logger.debug.bind(logger) : false,
  storage: getStoragePath(config.database.url),
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true,
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
  retry: {
    max: 3,
  },
});

// Database initialization
const initialize = async () => {
  try {
    // Test database connection
    await sequelize.authenticate();
    logger.info('Database connection established successfully');

    // Sync database models
    await sequelize.sync({ alter: true });
    logger.info('Database models synchronized');

    return sequelize;
  } catch (error) {
    logger.error('Database initialization failed:', error);
    throw error;
  }
};

// Close database connection
const close = async () => {
  try {
    await sequelize.close();
    logger.info('Database connection closed');
  } catch (error) {
    logger.error('Error closing database connection:', error);
    throw error;
  }
};

// Health check
const healthCheck = async () => {
  try {
    await sequelize.authenticate();
    return { status: 'healthy', timestamp: new Date().toISOString() };
  } catch (error) {
    logger.error('Database health check failed:', error);
    return { status: 'unhealthy', error: error.message, timestamp: new Date().toISOString() };
  }
};

module.exports = {
  sequelize,
  initialize,
  close,
  healthCheck,
};
