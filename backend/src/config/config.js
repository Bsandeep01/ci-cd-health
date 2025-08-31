const Joi = require('joi');

// Environment variable validation schema
const envSchema = Joi.object({
  // GitHub Configuration
  GITHUB_TOKEN: Joi.string().required(),
  GITHUB_OWNER: Joi.string().required(),
  GITHUB_REPO: Joi.string().required(),

  // Database Configuration
  DATABASE_URL: Joi.string().default('sqlite://./data/pipeline_health.db'),

  // Email Configuration
  EMAIL_SERVICE: Joi.string().default('gmail'),
  EMAIL_HOST: Joi.string().default('smtp.gmail.com'),
  EMAIL_PORT: Joi.number().default(587),
  EMAIL_USER: Joi.string().required(),
  EMAIL_PASSWORD: Joi.string().required(),
  EMAIL_FROM: Joi.string().email().required(),

  // Slack Configuration (Optional)
  SLACK_WEBHOOK_URL: Joi.string().uri().optional(),
  SLACK_CHANNEL: Joi.string().optional(),

  // Application Configuration
  NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
  PORT: Joi.number().default(5000),
  FRONTEND_URL: Joi.string().uri().default('http://localhost:3000'),
  DATA_SYNC_INTERVAL: Joi.number().default(300000), // 5 minutes
  ALERT_FAILURE_THRESHOLD: Joi.number().min(0).max(1).default(0.8),
  DATA_RETENTION_DAYS: Joi.number().default(30),

  // Docker Configuration
  DOCKER_NETWORK: Joi.string().default('ci-cd-network'),
}).unknown();

// Validate environment variables
const { error, value: envVars } = envSchema.validate(process.env);

if (error) {
  throw new Error(`Environment validation error: ${error.message}`);
}

// Configuration object
const config = {
  github: {
    token: envVars.GITHUB_TOKEN,
    owner: envVars.GITHUB_OWNER,
    repo: envVars.GITHUB_REPO,
    apiUrl: 'https://api.github.com',
  },

  database: {
    url: envVars.DATABASE_URL,
    dialect: envVars.DATABASE_URL.includes('sqlite') ? 'sqlite' : 'postgres',
    logging: envVars.NODE_ENV === 'development',
  },

  email: {
    service: envVars.EMAIL_SERVICE,
    host: envVars.EMAIL_HOST,
    port: envVars.EMAIL_PORT,
    user: envVars.EMAIL_USER,
    password: envVars.EMAIL_PASSWORD,
    from: envVars.EMAIL_FROM,
    secure: envVars.EMAIL_PORT === 465,
  },

  slack: {
    webhookUrl: envVars.SLACK_WEBHOOK_URL,
    channel: envVars.SLACK_CHANNEL,
    enabled: !!envVars.SLACK_WEBHOOK_URL,
  },

  app: {
    port: envVars.PORT,
    nodeEnv: envVars.NODE_ENV,
    frontendUrl: envVars.FRONTEND_URL,
    dataSyncInterval: envVars.DATA_SYNC_INTERVAL,
    alertFailureThreshold: envVars.ALERT_FAILURE_THRESHOLD,
    dataRetentionDays: envVars.DATA_RETENTION_DAYS,
    dockerNetwork: envVars.DOCKER_NETWORK,
  },

  // Feature flags
  features: {
    emailAlerts: true,
    slackAlerts: !!envVars.SLACK_WEBHOOK_URL,
    dataRetention: true,
    realTimeUpdates: true,
  },
};

module.exports = config;
