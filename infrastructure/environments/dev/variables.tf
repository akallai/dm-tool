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
