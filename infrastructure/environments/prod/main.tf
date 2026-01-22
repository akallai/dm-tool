terraform {
  required_version = ">= 1.5.0"

  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 3.85"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }
}

provider "azurerm" {
  features {
    resource_group {
      prevent_deletion_if_contains_resources = false
    }
  }
}

provider "random" {}

# Generate a random suffix for globally unique names
resource "random_string" "suffix" {
  length  = 6
  special = false
  upper   = false
}

locals {
  environment = "prod"
  project     = "dmtool"

  # Resource naming with random suffix for uniqueness
  resource_prefix      = "${local.project}${local.environment}"
  storage_account_name = "${local.resource_prefix}${random_string.suffix.result}"

  common_tags = {
    Environment = local.environment
    Project     = local.project
    ManagedBy   = "Terraform"
  }

  # CORS origins - adjust for your production domain
  cors_allowed_origins = var.cors_allowed_origins
}

# Resource Group
resource "azurerm_resource_group" "main" {
  name     = "rg-${local.project}-${local.environment}"
  location = var.location
  tags     = local.common_tags
}

# Storage Account
module "storage" {
  source = "../../modules/storage"

  storage_account_name = local.storage_account_name
  resource_group_name  = azurerm_resource_group.main.name
  location             = azurerm_resource_group.main.location
  cors_allowed_origins = local.cors_allowed_origins
  tags                 = local.common_tags
}

# Static Web App (with managed functions in api/ folder)
module "static_web_app" {
  source = "../../modules/static-web-app"

  static_web_app_name = "swa-${local.project}-${local.environment}"
  resource_group_name = azurerm_resource_group.main.name
  location            = var.static_web_app_location
  sku_tier            = var.static_web_app_sku
  tags                = local.common_tags

  app_settings = {
    STORAGE_CONNECTION_STRING = module.storage.primary_connection_string
  }
}

# Outputs
output "resource_group_name" {
  description = "Name of the resource group"
  value       = azurerm_resource_group.main.name
}

output "storage_account_name" {
  description = "Name of the storage account"
  value       = module.storage.storage_account_name
}

output "storage_blob_endpoint" {
  description = "Primary blob endpoint"
  value       = module.storage.primary_blob_endpoint
}

output "static_web_app_url" {
  description = "URL of the Static Web App"
  value       = module.static_web_app.static_web_app_url
}

output "static_web_app_api_key" {
  description = "API key for Static Web App deployment (use in GitHub Actions)"
  value       = module.static_web_app.api_key
  sensitive   = true
}
