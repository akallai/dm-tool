variable "static_web_app_name" {
  description = "Name of the Static Web App"
  type        = string
}

variable "resource_group_name" {
  description = "Name of the resource group"
  type        = string
}

variable "location" {
  description = "Azure region for resources (Static Web Apps have limited regions)"
  type        = string
  default     = "westeurope"
}

variable "sku_tier" {
  description = "SKU tier for the Static Web App (Free or Standard)"
  type        = string
  default     = "Free"

  validation {
    condition     = contains(["Free", "Standard"], var.sku_tier)
    error_message = "SKU tier must be either 'Free' or 'Standard'."
  }
}

variable "app_settings" {
  description = "Application settings for the Static Web App"
  type        = map(string)
  default     = {}
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
