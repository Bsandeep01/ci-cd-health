# Technical Design Document
## CI/CD Pipeline Health Dashboard

### 1. System Architecture

#### 1.1 High-Level Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend│    │  Node.js Backend│    │   SQLite DB     │
│   (Port 3000)   │◄──►│   (Port 5000)   │◄──►│   (Local file)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │  GitHub API     │
                       │  (Actions Data) │
                       └─────────────────┘
```

#### 1.2 Component Architecture
- **Frontend**: React SPA with TypeScript
- **Backend**: Node.js Express API server
- **Database**: SQLite with Sequelize ORM
- **Containerization**: Docker with docker-compose
- **External Services**: GitHub API, SMTP Email Service

### 2. Technology Stack

#### 2.1 Backend Technologies
- **Runtime**: Node.js 18.x
- **Framework**: Express.js 4.x
- **Database ORM**: Sequelize 6.x
- **Database**: SQLite 3.x (development), PostgreSQL (production)
- **Email**: Nodemailer 6.x
- **Logging**: Winston 3.x
- **Validation**: Joi 17.x
- **Scheduling**: node-cron 3.x
- **HTTP Client**: Axios 1.x

#### 2.2 Frontend Technologies
- **Framework**: React 18.x with TypeScript
- **Routing**: React Router DOM 6.x
- **HTTP Client**: Axios 1.x
- **Charts**: Chart.js 4.x with react-chartjs-2
- **Build Tool**: Create React App 5.x

#### 2.3 Infrastructure
- **Containerization**: Docker 20.x
- **Orchestration**: Docker Compose 2.x
- **Web Server**: Nginx (for frontend)
- **Process Management**: PM2 (optional for production)

### 3. Database Design

#### 3.1 Database Schema

##### WorkflowRuns Table
```sql
CREATE TABLE workflow_runs (
  id BIGINT PRIMARY KEY,
  workflow_id BIGINT NOT NULL,
  name VARCHAR(255) NOT NULL,
  head_branch VARCHAR(255) NOT NULL,
  head_sha VARCHAR(255) NOT NULL,
  run_number INTEGER NOT NULL,
  status ENUM('queued', 'in_progress', 'completed', 'waiting') NOT NULL,
  conclusion ENUM('success', 'failure', 'cancelled', 'skipped', 'timed_out'),
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  run_started_at DATETIME,
  duration_minutes DECIMAL(10,2),
  is_success BOOLEAN DEFAULT FALSE,
  is_failure BOOLEAN DEFAULT FALSE,
  is_cancelled BOOLEAN DEFAULT FALSE,
  is_skipped BOOLEAN DEFAULT FALSE,
  is_timed_out BOOLEAN DEFAULT FALSE,
  actor JSON,
  triggering_actor JSON,
  head_commit JSON,
  repository JSON,
  created_at_timestamp DATETIME,
  updated_at_timestamp DATETIME
);
```

##### Alerts Table
```sql
CREATE TABLE alerts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type ENUM('email', 'slack', 'webhook') NOT NULL,
  status ENUM('pending', 'sent', 'failed') NOT NULL DEFAULT 'pending',
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  recipient VARCHAR(255),
  workflow_run_id BIGINT,
  workflow_name VARCHAR(255),
  branch VARCHAR(255),
  commit_sha VARCHAR(255),
  error_message TEXT,
  sent_at DATETIME,
  retry_count INTEGER DEFAULT 0,
  metadata JSON,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
);
```

#### 3.2 Indexes
- `workflow_runs(workflow_id)`
- `workflow_runs(status)`
- `workflow_runs(conclusion)`
- `workflow_runs(created_at)`
- `workflow_runs(is_success)`
- `workflow_runs(is_failure)`
- `alerts(type)`
- `alerts(status)`
- `alerts(workflow_run_id)`
- `alerts(created_at)`

### 4. API Design

#### 4.1 RESTful Endpoints

##### Health Check
```
GET /health
Response: { status: 'OK', timestamp: string, uptime: number }
```

##### Metrics
```
GET /api/metrics?days=30
Response: {
  success: boolean,
  data: {
    summary: MetricsSummary,
    lastBuild: WorkflowRun,
    workflowBreakdown: WorkflowBreakdown,
    recentActivity: RecentActivity[]
  }
}
```

##### Workflow Runs
```
GET /api/workflows?page=1&limit=20&status=completed&conclusion=failure
Response: {
  success: boolean,
  data: {
    workflowRuns: WorkflowRun[],
    pagination: Pagination
  }
}
```

##### Alerts
```
GET /api/alerts?page=1&limit=20&type=email&status=sent
Response: {
  success: boolean,
  data: {
    alerts: Alert[],
    pagination: Pagination
  }
}
```

##### System Operations
```
POST /api/alerts/test
POST /api/system/sync/force
GET /api/system/sync/status
GET /api/system/test/github
GET /api/system/test/email
```

#### 4.2 Data Models

##### WorkflowRun
```typescript
interface WorkflowRun {
  id: number;
  workflow_id: number;
  name: string;
  head_branch: string;
  head_sha: string;
  run_number: number;
  status: 'queued' | 'in_progress' | 'completed' | 'waiting';
  conclusion: 'success' | 'failure' | 'cancelled' | 'skipped' | 'timed_out' | null;
  created_at: string;
  updated_at: string;
  run_started_at: string | null;
  duration_minutes: number | null;
  is_success: boolean;
  is_failure: boolean;
  is_cancelled: boolean;
  is_skipped: boolean;
  is_timed_out: boolean;
  actor?: { login: string };
  triggering_actor?: { login: string };
}
```

##### Alert
```typescript
interface Alert {
  id: number;
  type: 'email' | 'slack' | 'webhook';
  status: 'pending' | 'sent' | 'failed';
  title: string;
  message: string;
  recipient: string | null;
  workflow_run_id: number | null;
  workflow_name: string | null;
  branch: string | null;
  commit_sha: string | null;
  error_message: string | null;
  sent_at: string | null;
  retry_count: number;
  metadata: any;
  created_at: string;
  updated_at: string;
}
```

### 5. Service Layer Design

#### 5.1 Backend Services

##### GitHubService
- **Purpose**: Interact with GitHub Actions API
- **Methods**:
  - `getWorkflowRuns(options)`: Fetch workflow runs
  - `getWorkflowRun(id)`: Get specific workflow run
  - `getWorkflows()`: Get available workflows
  - `testConnection()`: Test GitHub API connectivity
  - `transformWorkflowRun(data)`: Transform GitHub data to internal format

##### EmailService
- **Purpose**: Handle email notifications
- **Methods**:
  - `sendEmail(options)`: Send generic email
  - `sendWorkflowFailureAlert(workflowRun, recipient)`: Send failure alert
  - `sendTestAlert(recipient)`: Send test email
  - `testConnection()`: Test email configuration

##### AlertService
- **Purpose**: Manage alert lifecycle
- **Methods**:
  - `sendWorkflowFailureAlert(workflowRun, recipient)`: Create and send alert
  - `sendSlackAlert(workflowRun)`: Send Slack notification
  - `getAlertHistory(options)`: Get alert history
  - `retryAlert(id)`: Retry failed alert

##### DataSyncService
- **Purpose**: Synchronize data from GitHub
- **Methods**:
  - `startDataSync()`: Start periodic sync
  - `syncWorkflowData()`: Sync workflow data
  - `cleanupOldData()`: Clean up old data
  - `getSyncStatus()`: Get sync status

#### 5.2 Frontend Services

##### ApiService
- **Purpose**: Handle API communication
- **Methods**:
  - `getMetrics(days)`: Fetch dashboard metrics
  - `getWorkflowRuns(page, limit, filters)`: Fetch workflow runs
  - `getAlerts(page, limit, filters)`: Fetch alerts
  - `sendTestAlert(recipient)`: Send test alert

### 6. Security Design

#### 6.1 Authentication & Authorization
- GitHub Personal Access Token for API access
- Environment variable-based configuration
- Input validation and sanitization
- CORS configuration for frontend-backend communication

#### 6.2 Data Security
- Secure storage of sensitive credentials
- Database connection security
- HTTPS for production deployments
- Regular security updates

#### 6.3 Error Handling
- Comprehensive error logging
- User-friendly error messages
- Graceful degradation
- Input validation

### 7. Performance Design

#### 7.1 Database Optimization
- Efficient indexing strategy
- Query optimization
- Connection pooling
- Data pagination

#### 7.2 Caching Strategy
- In-memory caching for frequently accessed data
- Database query result caching
- Static asset caching (frontend)

#### 7.3 API Optimization
- Response compression
- Request/response size limits
- Rate limiting
- Efficient data serialization

### 8. Monitoring & Logging

#### 8.1 Logging Strategy
- Structured logging with Winston
- Log levels: error, warn, info, debug
- Log rotation and retention
- Centralized log collection

#### 8.2 Health Monitoring
- Health check endpoints
- Service status monitoring
- Performance metrics
- Error tracking

#### 8.3 Alerting
- System health alerts
- Performance degradation alerts
- Error rate monitoring
- Resource usage alerts

### 9. Deployment Architecture

#### 9.1 Container Strategy
```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Compose                           │
├─────────────────┬─────────────────┬─────────────────────────┤
│   Frontend      │    Backend      │      Database           │
│   (Nginx)       │   (Node.js)     │     (SQLite)            │
│   Port: 3000    │   Port: 5000    │    (Volume)             │
└─────────────────┴─────────────────┴─────────────────────────┘
```

#### 9.2 Environment Configuration
- Development: Local Docker containers
- Staging: Docker containers with test data
- Production: Docker containers with production settings

#### 9.3 Deployment Process
1. Build Docker images
2. Run database migrations
3. Start services with health checks
4. Verify system functionality
5. Monitor system health

### 10. Scalability Considerations

#### 10.1 Horizontal Scaling
- Stateless backend design
- Database connection pooling
- Load balancer support
- Microservices architecture ready

#### 10.2 Vertical Scaling
- Resource monitoring
- Performance optimization
- Database optimization
- Caching strategies

#### 10.3 Future Enhancements
- Kubernetes deployment
- Service mesh integration
- Advanced monitoring
- Auto-scaling capabilities

### 11. Testing Strategy

#### 11.1 Unit Testing
- Backend service tests
- API endpoint tests
- Database model tests
- Utility function tests

#### 11.2 Integration Testing
- API integration tests
- Database integration tests
- External service tests
- End-to-end tests

#### 11.3 Performance Testing
- Load testing
- Stress testing
- Database performance tests
- API response time tests

### 12. Maintenance & Operations

#### 12.1 Backup Strategy
- Database backup procedures
- Configuration backup
- Log file management
- Disaster recovery plan

#### 12.2 Update Procedures
- Dependency updates
- Security patches
- Feature updates
- Database migrations

#### 12.3 Monitoring & Alerting
- System health monitoring
- Performance monitoring
- Error tracking
- User experience monitoring
