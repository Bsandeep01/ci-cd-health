variable "project_name" {
  description = "Project name used for tagging and naming"
  type        = string
  default     = "ci-cd-dashboard"
}

variable "environment" {
  description = "Environment name (e.g., dev, prod)"
  type        = string
  default     = "dev"
}

variable "aws_region" {
  description = "AWS region to deploy resources in"
  type        = string
  default     = "us-east-1"
}

variable "extra_tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}

variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidr" {
  description = "CIDR block for the public subnet"
  type        = string
  default     = "10.0.1.0/24"
}

variable "public_subnet_az" {
  description = "Availability Zone for the public subnet (leave empty for automatic)"
  type        = string
  default     = ""
}

variable "enable_http" {
  description = "Whether to open port 80"
  type        = bool
  default     = true
}

variable "allow_http_cidrs" {
  description = "CIDR blocks allowed to access HTTP"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "enable_https" {
  description = "Whether to open port 443"
  type        = bool
  default     = false
}

variable "allow_https_cidrs" {
  description = "CIDR blocks allowed to access HTTPS"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "enable_ssh" {
  description = "Whether to open port 22"
  type        = bool
  default     = false
}

variable "allow_ssh_cidrs" {
  description = "CIDR blocks allowed to access SSH"
  type        = list(string)
  default     = ["0.0.0.0/0"]
}

variable "instance_type" {
  description = "EC2 instance type"
  type        = string
  default     = "t3.small"
}

variable "volume_size_gb" {
  description = "Root volume size in GB"
  type        = number
  default     = 20
}

variable "ami_id" {
  description = "Override AMI ID (leave empty to use Amazon Linux 2023)"
  type        = string
  default     = ""
}

variable "key_pair_name" {
  description = "EC2 key pair name (leave empty to skip SSH key association)"
  type        = string
  default     = ""
}

variable "enable_ssm" {
  description = "Attach IAM role to enable AWS SSM Session Manager"
  type        = bool
  default     = true
}

variable "app_repo_url" {
  description = "Git repository URL to clone on the instance"
  type        = string
  default     = ""
}

variable "app_repo_branch" {
  description = "Git branch to checkout"
  type        = string
  default     = "main"
}

variable "app_setup_type" {
  description = "How to run the app: 'compose' or 'manual'"
  type        = string
  default     = "compose"
  validation {
    condition     = contains(["compose", "manual"], var.app_setup_type)
    error_message = "app_setup_type must be 'compose' or 'manual'."
  }
}

variable "compose_file_path" {
  description = "Path to docker-compose file relative to repo root (used when app_setup_type=compose)"
  type        = string
  default     = "docker-compose.yml"
}

variable "working_dir" {
  description = "Relative path inside the repo where commands should run"
  type        = string
  default     = "."
}

variable "backend_port" {
  description = "Backend container exposed port"
  type        = number
  default     = 3000
}

variable "frontend_port" {
  description = "Frontend container exposed port"
  type        = number
  default     = 80
}

variable "extra_user_commands" {
  description = "Additional commands appended to user data script"
  type        = string
  default     = ""
}


