# DM Tool API

Python Azure Functions for media storage operations.

## Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check (public) |
| GET | `/api/media` | List all media files |
| GET | `/api/media/{filename}` | Get a specific file |
| PUT | `/api/media/{filename}` | Upload a file |
| DELETE | `/api/media/{filename}` | Delete a file |

## Authentication

All endpoints except `/api/health` require authentication via Microsoft Entra ID.

## Configuration

### Required Environment Variables

Set these in the Azure Static Web App configuration:

| Variable | Description |
|----------|-------------|
| `STORAGE_CONNECTION_STRING` | Azure Storage connection string |

### Setting Up in Azure Portal

1. Go to your Static Web App resource
2. Navigate to **Configuration** > **Application settings**
3. Add `STORAGE_CONNECTION_STRING` with the value from your Storage Account

To get the connection string:
```bash
az storage account show-connection-string \
  --name <storage-account-name> \
  --resource-group <resource-group-name> \
  --query connectionString -o tsv
```

## Local Development

1. Install dependencies:
   ```bash
   cd frontend/api
   pip install -r requirements.txt
   ```

2. Install Azure Functions Core Tools:
   ```bash
   npm install -g azure-functions-core-tools@4
   ```

3. Create `local.settings.json` (copy from template and add your connection string):
   ```json
   {
     "IsEncrypted": false,
     "Values": {
       "AzureWebJobsStorage": "",
       "FUNCTIONS_WORKER_RUNTIME": "python",
       "STORAGE_CONNECTION_STRING": "<your-connection-string>"
     }
   }
   ```

4. Start the functions locally:
   ```bash
   func start
   ```

5. Run with SWA CLI for full local development:
   ```bash
   npm install -g @azure/static-web-apps-cli
   swa start http://localhost:4200 --api-location ./api
   ```

## Usage Examples

### List files
```bash
curl https://your-app.azurestaticapps.net/api/media
```

### Upload a file
```bash
curl -X PUT \
  -H "Content-Type: image/png" \
  --data-binary @image.png \
  https://your-app.azurestaticapps.net/api/media/images/my-image.png
```

### Download a file
```bash
curl https://your-app.azurestaticapps.net/api/media/images/my-image.png -o downloaded.png
```

### Delete a file
```bash
curl -X DELETE https://your-app.azurestaticapps.net/api/media/images/my-image.png
```
