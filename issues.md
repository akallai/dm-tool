# Deployment Testing Findings

## Test Results

### API Endpoints
| Endpoint | Status | Notes |
|----------|--------|-------|
| GET /api/health | PASS | Returns `{"status": "healthy"}` |
| PUT /api/media/workspace%2Fstate.json | PASS | Returns 201, creates blob |
| GET /api/media/workspace%2Fstate.json | PASS | Returns 200 with correct data |
| GET /api/media?prefix=... | PASS | Lists files correctly |
| DELETE /api/media/workspace%2Fstate.json | PASS | Returns 200, deletes blob |

### Workspace Persistence
| Feature | Status | Notes |
|---------|--------|-------|
| Save workspace state | PASS | No error banner after adding widgets |
| Load workspace state on reload | PASS | Tabs, widgets, positions persist |
| Background image persistence | PASS | Background survives reload |
| Multiple tabs | PASS | "Main Tab" and "Tab 2" both persist |

### Widget Types Tested
| Widget | Status | Notes |
|--------|--------|-------|
| Notepad | PARTIAL | Widget loads/persists. "New File"/"Open File" use File System Access API (`showSaveFilePicker`) — requires real user interaction, not a bug |
| Dice Tool | PASS | All dice buttons render, custom notation field works |
| Wiki | PARTIAL | Widget loads/persists. "New Wiki" also uses `showSaveFilePicker` — by design (local-file-first widget) |
| Name Generator | PASS | Category/type dropdowns work, Generate produces names |
| Combat Tracker | PASS | Round counter, Add/Next Turn/Sort/Reset buttons work |
| Image/PDF Viewer | PASS | Widget loads, Upload File and Browse Library buttons work |
| Media Browser | PASS | Shared tab lists D&D/Mutant Jahr folders with file counts. My Files tab shows upload option |

### Widgets Not Tested (time constraint)
- Music Widget
- Random Generator
- Daytime Tracker
- LLM Chat
- Hex Map
- Countdown

## Deployment Notes

1. **Terraform SWA token can become stale.** Always get a fresh token:
   ```bash
   az staticwebapp secrets list --name swa-dmtool-dev --resource-group rg-dmtool-dev --query "properties.apiKey" -o tsv
   ```

2. **SWA CLI v2.0.7 exits code 0 even on failed deploy.** Use `--dry-run` to verify.

3. **Python packages MUST be pre-installed for SWA deployment.** The GitHub Actions workflow (`Azure/static-web-apps-deploy@v1`) may handle this automatically, but SWA CLI does not. Add a pre-deploy step to install packages targeting Linux.

4. **The `.python_packages` directory is gitignored** — it must be generated before each SWA CLI deploy. Consider adding a deploy script or CI step.
