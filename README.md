# DM Tool

A digital toolkit for Game Masters running tabletop RPG sessions.

## Repository Structure

```
dm-tool/
├── frontend/          # Angular 19 web application
│   ├── src/           # Angular source code
│   └── api/           # Python Azure Functions (managed functions)
└── infrastructure/    # Terraform configurations for Azure
```

## Quick Start

### Local Development
```bash
cd frontend
npm install
npm start              # Dev server at http://localhost:4200
```

### Full Stack (with API)
```bash
# Terminal 1: Angular dev server
cd frontend && npm start

# Terminal 2: SWA CLI with API
cd frontend && swa start http://localhost:4200 --api-location ./api
# Opens http://localhost:4280 (frontend + API at /api/*)
```

### Deployment
```bash
cd frontend
npm run build
swa deploy ./dist/dm-tool/browser --api-location ./api --api-language python --api-version 3.11 --env production --deployment-token <TOKEN>
```

Get deployment token: `cd infrastructure/environments/dev && terraform output -raw static_web_app_api_key`

## Infrastructure

Azure Static Web App + Storage Account provisioned via Terraform.

```bash
cd infrastructure/environments/dev
terraform init
terraform plan
terraform apply
```

## License

MIT
