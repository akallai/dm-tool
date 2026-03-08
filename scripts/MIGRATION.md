# Data Migration Guide

This guide explains how to migrate data from the old localStorage-based DM Tool into the current Azure-backed version.

## Background

The old version of DM Tool stored wikis and random tables in the browser's localStorage. If you exported those as JSON files, you can import them into the current server-backed system using the migration script.

## Prerequisites

- Python 3.10+
- `azure-storage-blob` package: `pip install azure-storage-blob`
- Azure Storage connection string (one of):
  - Set as `STORAGE_CONNECTION_STRING` environment variable
  - Or present in `frontend/api/local.settings.json`

## Finding your User ID

The user ID is the Azure AD Object ID of the target user. You can find it by:
1. Opening the Azure Portal → Azure Active Directory → Users
2. Searching for the user and copying their **Object ID**
3. Or checking the `x-ms-client-principal-id` header in browser dev tools while logged into the app

## Supported data types

| Type | Old format | What gets created |
|---|---|---|
| Wiki | `{ "articles": [...] }` | `wikis/{id}/meta.json` + `wikis/{id}/data.json` |
| Random Table | `{ "mappings": [...], "mappingCategories": [...], ... }` | `random-tables/{id}/meta.json` + `random-tables/{id}/data.json` |

## Usage

Run from the repository root:

```bash
py scripts/migrate-legacy-data.py \
    --user-id <AZURE_AD_OBJECT_ID> \
    --wiki <path-to-wiki.json> <display-name> \
    --random-table <path-to-random-table.json> <display-name>
```

### Examples

**Migrate a single wiki:**
```bash
py scripts/migrate-legacy-data.py \
    --user-id 295c79323ebc4e22b2cb2e48cbf80193 \
    --wiki "C:/exports/Regelwiki.json" "Regelwiki"
```

**Migrate multiple items at once:**
```bash
py scripts/migrate-legacy-data.py \
    --user-id 295c79323ebc4e22b2cb2e48cbf80193 \
    --wiki "C:/exports/Regelwiki.json" "Regelwiki" \
    --wiki "C:/exports/wiki.json" "Kampagnen-Wiki" \
    --random-table "C:/exports/random-generator.json" "MYZ Zufallstabellen"
```

**Dry run (preview without uploading):**
```bash
py scripts/migrate-legacy-data.py \
    --user-id 295c79323ebc4e22b2cb2e48cbf80193 \
    --wiki "C:/exports/wiki.json" "Wiki" \
    --dry-run
```

## What the script does

1. Reads each JSON file from disk
2. Generates a new UUID for each wiki / random table
3. Transforms the data into the format the app expects:
   - **Wiki**: wraps the articles array in `{ "name": "...", "articles": [...] }` and creates a `meta.json` with name and timestamp
   - **Random Table**: extracts `mappings` (stripping legacy `value`/`category` fields), `mappingCategories`, and `useWeightedSelection`, then creates `meta.json` + `data.json`
4. Uploads the blobs to `users/{userId}/wikis/{id}/` or `users/{userId}/random-tables/{id}/` in the `media` container

## After migration

The migrated wikis and random tables will appear in the app's selector dialogs. You can attach them to widgets from there — no workspace state changes are needed.

## Limitations

- **Wiki images** are not migrated by this script. If your old wiki articles reference images, those images need to be uploaded separately to `wikis/{wikiId}/images/`.
- **Audio files** for the music widget are not covered. Use a similar blob upload approach targeting `audio/{widgetId}/{mappingId}/`.
- The script always creates **new** entries (new UUIDs). It does not update or overwrite existing wikis/tables.
