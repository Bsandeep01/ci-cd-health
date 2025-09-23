#!/bin/bash
set -euo pipefail

# Variables supplied via templatefile from Terraform
APP_REPO_URL="${app_repo_url}"
APP_REPO_BRANCH="${app_repo_branch}"
APP_SETUP_TYPE="${app_setup_type}"
COMPOSE_FILE_PATH="${compose_file_path}"
WORKING_DIR="${working_dir}"
BACKEND_PORT="${backend_port}"
FRONTEND_PORT="${frontend_port}"
EXTRA_USER_COMMANDS="${extra_user_commands}"

echo "==> System update and basic tools"
dnf update -y
dnf install -y git

echo "==> Install Docker"
dnf install -y docker
systemctl enable docker
systemctl start docker

echo "==> Install Docker Compose"
DOCKER_COMPOSE_VERSION="2.27.0"
curl -SL "https://github.com/docker/compose/releases/download/v${DOCKER_COMPOSE_VERSION}/docker-compose-linux-x86_64" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

usermod -aG docker ec2-user || true

mkdir -p /opt/app
cd /opt/app

if [[ -n "$APP_REPO_URL" ]]; then
  echo "==> Cloning application repository: $APP_REPO_URL (branch: $APP_REPO_BRANCH)"
  git clone --branch "$APP_REPO_BRANCH" --depth 1 "$APP_REPO_URL" repo || true
  cd repo
else
  echo "==> No app_repo_url provided; creating placeholder"
  mkdir -p repo && cd repo
fi

if [[ "$WORKING_DIR" != "." ]]; then
  cd "$WORKING_DIR"
fi

echo "==> App setup type: $APP_SETUP_TYPE"
if [[ "$APP_SETUP_TYPE" == "compose" ]]; then
  echo "==> Launching via docker-compose ($COMPOSE_FILE_PATH)"
  if [[ ! -f "$COMPOSE_FILE_PATH" ]]; then
    echo "docker-compose file not found at $COMPOSE_FILE_PATH; creating a simple one"
    cat > docker-compose.yml <<'EOF'
version: "3.8"
services:
  backend:
    build: ./backend
    container_name: ci-cd-dashboard-backend
    ports:
      - "3000:3000"
  frontend:
    build: ./frontend
    container_name: ci-cd-dashboard-frontend
    ports:
      - "80:80"
EOF
    COMPOSE_FILE_PATH="docker-compose.yml"
  fi
  /usr/local/bin/docker-compose -f "$COMPOSE_FILE_PATH" up -d --build
else
  echo "==> Manual run path: building and starting containers"
  # Backend
  if [[ -d "backend" ]]; then
    docker build -t ci-cd-dashboard-backend:latest ./backend
    docker run -d --name ci-cd-dashboard-backend -p "${BACKEND_PORT}:3000" ci-cd-dashboard-backend:latest || true
  fi
  # Frontend
  if [[ -d "frontend" ]]; then
    docker build -t ci-cd-dashboard-frontend:latest ./frontend
    docker run -d --name ci-cd-dashboard-frontend -p "${FRONTEND_PORT}:80" ci-cd-dashboard-frontend:latest || true
  fi
fi

if [[ -n "$EXTRA_USER_COMMANDS" ]]; then
  echo "==> Running extra user commands"
  bash -c "$EXTRA_USER_COMMANDS"
fi

echo "==> Completed user data provisioning"


