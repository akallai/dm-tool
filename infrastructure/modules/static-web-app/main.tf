resource "azurerm_static_web_app" "main" {
  name                = var.static_web_app_name
  resource_group_name = var.resource_group_name
  location            = var.location
  sku_tier            = var.sku_tier
  sku_size            = var.sku_tier == "Free" ? "Free" : "Standard"

  app_settings = var.app_settings

  tags = var.tags
}
