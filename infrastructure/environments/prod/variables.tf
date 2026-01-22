variable "location" {
  description = "Azure region for resources"
  type        = string
  default     = "westeurope"
}

variable "static_web_app_location" {
  description = "Azure region for Static Web App (limited regions available)"
  type        = string
  default     = "westeurope"
}

variable "static_web_app_sku" {
  description = "SKU tier for Static Web App (Free or Standard)"
  type        = string
  default     = "Free"
}

variable "cors_allowed_origins" {
  description = "List of allowed CORS origins for production"
  type        = list(string)
  default     = ["https://*.azurestaticapps.net"]
}
