variable "region" {
  type        = string
  description = "AWS region resources will be deployed in."
  default     = "eu-central-1"
}

variable "app_name" {
  type        = string
  description = "The name of the app in this fargate cluster."
}

variable "cert_arn" {
  type        = string
  description = "ARN path to certificate resource"
  default     = ""
}

variable "domain_name" {
  type        = string
  description = "Application DNS"
  default     = "my.domain.com"
}

variable "ACCOUNT" {
  type        = string
  description = "Email address for account"
}

variable "KEY" {
  type        = string
  description = "Email account API key"
}

variable "CSRF" {
  type        = string
  description = "CSRF header token"
}

# AWS keys
variable "aws_access_key" {
  type        = string
  description = "AWS secret access key ID"
}
variable "aws_secret_key" {
  type        = string
  description = "AWS secret access key value"
}

# Default tags
variable "default_tags" {
  type        = map(string)
  description = "Default tags for Terraform owned resources"
  default = {
    Owner = "Terraform"
  }
}
