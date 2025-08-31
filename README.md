# CI/CD Pipeline Health Dashboard

A comprehensive dashboard for monitoring GitHub Actions pipeline executions with real-time metrics, alerting, and containerized deployment.

## Features

- 📊 **Real-time Metrics**: Success/failure rates, average build times, last build status
- 🔔 **Alert System**: Email notifications for pipeline failures
- 📈 **Visual Analytics**: Interactive charts and trend analysis
- 🐳 **Containerized**: Easy local testing with Docker
- ⚙️ **Configurable**: Environment-based configuration
- 🔄 **Auto-sync**: Periodic data synchronization from GitHub Actions

## Tech Stack

- **Backend**: Node.js with Express.js
- **Frontend**: React with TypeScript
- **Database**: SQLite (local) / PostgreSQL (production)
- **Containerization**: Docker & Docker Compose
- **Charts**: Chart.js / Recharts
- **Styling**: Tailwind CSS

## Quick Start

### Prerequisites

- Docker and Docker Compose
- GitHub Personal Access Token
- Email service credentials

### Setup

1. **Clone and navigate to the project:**
   ```bash
   cd ci-cd-dashboard
   ```

2. **Configure environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start the application:**
   ```bash
   docker-compose up --build
   ```

4. **Access the dashboard:**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## Configuration

### Required Environment Variables

```bash
# GitHub Configuration
GITHUB_TOKEN=your_github_personal_access_token
GITHUB_OWNER=your_github_username_or_org
GITHUB_REPO=your_repository_name

# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password
EMAIL_FROM=your_email@gmail.com

# Optional: Slack Integration
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
SLACK_CHANNEL=#ci-cd-alerts
```

### GitHub Token Setup

1. Go to GitHub Settings → Developer settings → Personal access tokens
2. Generate a new token with `repo` and `workflow` permissions
3. Add the token to your `.env` file

## Project Structure

```
ci-cd-dashboard/
├── backend/                 # Node.js API server
├── frontend/               # React dashboard
├── data/                   # SQLite database files
├── docs/                   # Documentation
├── docker-compose.yml      # Docker orchestration
├── .env.example           # Environment template
└── README.md              # This file
```

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/metrics` - Pipeline metrics
- `GET /api/workflows` - Workflow runs
- `GET /api/alerts` - Alert history
- `POST /api/alerts/test` - Test alert

## Development

### Local Development

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend
cd frontend
npm install
npm start
```

### Production Deployment

```bash
# Build and deploy
docker-compose -f docker-compose.prod.yml up --build
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## License

MIT License - see LICENSE file for details
