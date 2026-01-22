# DM Tool Infrastructure

Terraform configurations for deploying DM Tool to Azure.

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Azure Resource Group                         │
│                                                                  │
│  ┌──────────────────────────────────┐                           │
│  │       Static Web App             │                           │
│  │         (Free Tier)              │                           │
│  │                                  │                           │
│  │  ┌────────────┐  ┌────────────┐  │                           │
│  │  │  Angular   │  │  Managed   │  │                           │
│  │  │  Frontend  │  │  Functions │  │                           │
│  │  │            │  │  (api/)    │  │                           │
│  │  └────────────┘  └─────┬──────┘  │                           │
│  │                        │         │                           │
│  │  Built-in Auth (Microsoft)       │                           │
│  └──────────────────────────────────┘                           │
│                           │                                      │
│                           ▼                                      │
│            ┌──────────────────────────┐                          │
│            │    Storage Account       │                          │
│            │    (LRS, Cool Tier)      │                          │
│            │                          │                          │
│            │  - media/ (blobs)        │                          │
│            │  - Lifecycle policies    │                          │
│            └──────────────────────────┘                          │
└─────────────────────────────────────────────────────────────────┘
```

## Cost Estimate

| Resource | Tier | Monthly Cost |
|----------|------|--------------|
| Static Web App | Free | $0 |
| Managed Functions | Included | $0 |
| Storage Account | LRS Cool | ~$0.50-1.50 |
| **Total** | | **~$1/month** |

## Prerequisites

- [Terraform](https://www.terraform.io/downloads) >= 1.5.0
- [Azure CLI](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli)
- [Node.js](https://nodejs.org/) >= 18
- [SWA CLI](https://github.com/Azure/static-web-apps-cli): `npm install -g @azure/static-web-apps-cli`
- An Azure subscription

---

## Part 1: Infrastructure Provisioning

### Step 1: Authenticate with Azure

```bash
az login
az account set --subscription "Your Subscription Name"
```

### Step 2: Create Terraform State Storage (One-time setup)

```bash
az group create -n rg-terraform-state -l westeurope
az storage account create -n tfstatedmtool -g rg-terraform-state -l westeurope --sku Standard_LRS
az storage container create -n tfstate --account-name tfstatedmtool
```

### Step 3: Provision Infrastructure

**Development Environment:**
```bash
cd infrastructure/environments/dev
terraform init
terraform plan
terraform apply
```

**Production Environment:**
```bash
cd infrastructure/environments/prod
terraform init
terraform plan
terraform apply
```

### Step 4: Get Deployment Token

Save the deployment token for later use:

```bash
# From the environment directory (dev or prod)
terraform output -raw static_web_app_api_key
```

---

## Part 2: Application Deployment

### Option A: Deploy from Local Computer (SWA CLI)

#### 1. Install SWA CLI

```bash
npm install -g @azure/static-web-apps-cli
```

#### 2. Build the Application

```bash
cd frontend
npm install
npm run build
```

#### 3. Deploy to Azure

**Deploy to Production:**
```bash
swa deploy ./dist/dm-tool --api-location ./api --env production --deployment-token <YOUR_TOKEN>
```

**Deploy to Preview (staging):**
```bash
swa deploy ./dist/dm-tool --api-location ./api --env preview --deployment-token <YOUR_TOKEN>
```

> **Note:** Replace `<YOUR_TOKEN>` with the deployment token from Step 4 above.

### Option B: Deploy via Azure CLI

```bash
cd frontend
npm run build

az staticwebapp upload \
  --app-name swa-dmtool-dev \
  --resource-group rg-dmtool-dev \
  --source ./dist/dm-tool \
  --api-location ./api
```

### Option C: Deploy via GitHub Actions (CI/CD)

1. Add the deployment token as a GitHub secret:
   ```bash
   gh secret set AZURE_STATIC_WEB_APPS_API_TOKEN --body "<YOUR_TOKEN>"
   ```

2. Push to the configured branch (GitHub Actions will deploy automatically)

---

## Part 3: Local Development

### Run Frontend Only

```bash
cd frontend
npm start
# Opens http://localhost:4200
```

### Run Frontend + API (Full Stack)

**Terminal 1 - Start Angular dev server:**
```bash
cd frontend
npm start
```

**Terminal 2 - Start SWA CLI with API:**
```bash
cd frontend
swa start http://localhost:4200 --api-location ./api
# Opens http://localhost:4280 (with API at /api/*)
```

### Local API Configuration

For local API development, create `frontend/api/local.settings.json`:

```json
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "",
    "FUNCTIONS_WORKER_RUNTIME": "python",
    "STORAGE_CONNECTION_STRING": "<your-storage-connection-string>"
  }
}
```

Get the connection string:
```bash
az storage account show-connection-string \
  --name <storage-account-name> \
  --resource-group rg-dmtool-dev \
  --query connectionString -o tsv
```

---

## Directory Structure

```
infrastructure/
├── README.md                    # This file
├── .gitignore                   # Git ignore rules
│
├── environments/
│   ├── dev/                     # Development environment
│   │   ├── main.tf              # Main configuration
│   │   ├── variables.tf         # Variable definitions
│   │   └── backend.tf           # State backend config
│   └── prod/                    # Production environment
│       ├── main.tf
│       ├── variables.tf
│       └── backend.tf
│
├── modules/
│   ├── static-web-app/          # Static Web App module
│   │   ├── main.tf
│   │   ├── variables.tf
│   │   └── outputs.tf
│   └── storage/                 # Storage Account module
│       ├── main.tf
│       ├── variables.tf
│       └── outputs.tf
│
└── shared/                      # Shared configurations
    ├── providers.tf
    └── versions.tf
```

## Modules

### Storage (`modules/storage`)

Creates an Azure Storage Account with:
- StorageV2 (General Purpose v2)
- LRS replication (cheapest)
- Cool access tier (cost-optimized)
- `media` blob container
- Lifecycle policy: Cool → Archive after 90 days
- CORS configured for frontend access

### Static Web App (`modules/static-web-app`)

Creates Azure Static Web App with:
- Free tier (100GB bandwidth, SSL, CDN)
- Managed Functions support (via `api/` folder)
- Built-in authentication (Microsoft Entra ID)
- Auto-configured `STORAGE_CONNECTION_STRING`

## Configuration

### Terraform Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `location` | Azure region | `westeurope` |
| `static_web_app_location` | SWA region | `westeurope` |
| `static_web_app_sku` | Free or Standard | `Free` |
| `cors_allowed_origins` | CORS origins (prod only) | `["https://*.azurestaticapps.net"]` |

### Custom Variables

Create a `terraform.tfvars` file (gitignored) for custom values:

```hcl
# infrastructure/environments/dev/terraform.tfvars
location = "northeurope"
```

## Terraform Outputs

| Output | Description |
|--------|-------------|
| `resource_group_name` | Resource group name |
| `storage_account_name` | Storage account name |
| `storage_blob_endpoint` | Blob storage URL |
| `static_web_app_url` | Frontend URL |
| `static_web_app_api_key` | Deployment token (sensitive) |

View all outputs:
```bash
terraform output
```

Get specific output:
```bash
terraform output -raw static_web_app_api_key
terraform output -raw static_web_app_url
```

## Authentication

Static Web Apps supports built-in authentication with Microsoft Entra ID (free).

Routes are configured in `frontend/staticwebapp.config.json`:
- `/api/health` - Public (no auth required)
- `/api/*` - Requires authentication

## Destroying Resources

```bash
cd infrastructure/environments/dev  # or prod
terraform destroy
```

## Troubleshooting

### "Storage account name already exists"
Storage account names must be globally unique. The random suffix should handle this. If it fails, run `terraform apply` again for a new random suffix.

### "Static Web App region not available"
Static Web Apps are available in limited regions. Try: `westus2`, `centralus`, `eastus2`, `westeurope`, `eastasia`.

### "Insufficient permissions"
Ensure your Azure account has Contributor or Owner role on the subscription.

### API not deployed
Make sure to include `--api-location ./api` when deploying:
```bash
swa deploy ./dist/dm-tool --api-location ./api --env production --deployment-token <token>
```

### Deploying to wrong environment
- `--env production` → Production URL
- `--env preview` → Preview/staging URL (default)

Always specify `--env production` for production deployments.
