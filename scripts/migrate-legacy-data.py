"""
Migrate legacy local JSON exports into Azure Blob Storage.

This script converts wiki and random-generator JSON files from the old
localStorage-based app format into the current server-backed blob format
used by DM Tool.

Usage:
    py scripts/migrate-legacy-data.py \
        --user-id <USER_ID> \
        --wiki <path/to/wiki.json> <name> \
        --random-table <path/to/random-generator.json> <name>

Examples:
    # Migrate a single wiki
    py scripts/migrate-legacy-data.py \
        --user-id 295c79323ebc4e22b2cb2e48cbf80193 \
        --wiki "C:/exports/Regelwiki.json" "Regelwiki"

    # Migrate multiple wikis and a random table
    py scripts/migrate-legacy-data.py \
        --user-id 295c79323ebc4e22b2cb2e48cbf80193 \
        --wiki "C:/exports/Regelwiki.json" "Regelwiki" \
        --wiki "C:/exports/wiki.json" "Kampagnen-Wiki" \
        --random-table "C:/exports/random-generator.json" "MYZ Zufallstabellen"

    # Dry run (shows what would be uploaded without uploading)
    py scripts/migrate-legacy-data.py \
        --user-id 295c79323ebc4e22b2cb2e48cbf80193 \
        --wiki "C:/exports/wiki.json" "Wiki" \
        --dry-run

Prerequisites:
    pip install azure-storage-blob

Connection string:
    Set the STORAGE_CONNECTION_STRING environment variable, or the script
    will try to read it from frontend/api/local.settings.json.
"""

import argparse
import json
import os
import sys
import uuid

def get_connection_string():
    """Resolve the Azure Storage connection string."""
    conn = os.environ.get("STORAGE_CONNECTION_STRING")
    if conn:
        return conn

    # Try local.settings.json
    settings_path = os.path.join(
        os.path.dirname(__file__), "..", "frontend", "api", "local.settings.json"
    )
    if os.path.exists(settings_path):
        with open(settings_path, "r", encoding="utf-8") as f:
            settings = json.load(f)
        conn = settings.get("Values", {}).get("STORAGE_CONNECTION_STRING")
        if conn:
            return conn

    print("ERROR: No connection string found.")
    print("Set STORAGE_CONNECTION_STRING env var or add it to frontend/api/local.settings.json")
    sys.exit(1)


def upload_json(container, blob_path, data):
    """Upload a Python dict as a JSON blob."""
    from azure.storage.blob import ContentSettings

    content = json.dumps(data, ensure_ascii=False)
    container.upload_blob(
        blob_path,
        content.encode("utf-8"),
        content_settings=ContentSettings(content_type="application/json"),
        overwrite=True,
    )


def migrate_wiki(container, user_id, file_path, name, dry_run=False):
    """Migrate a legacy wiki JSON file.

    Expected input format:
        { "articles": [ { "id": "...", "title": "...", "content": "<html>", "children": [...] } ] }

    Produces:
        users/{user_id}/wikis/{wikiId}/meta.json  -> { "name": "...", "createdAt": <ms> }
        users/{user_id}/wikis/{wikiId}/data.json   -> { "name": "...", "articles": [...] }
    """
    with open(file_path, "r", encoding="utf-8") as f:
        legacy = json.load(f)

    if "articles" not in legacy:
        print(f"  ERROR: {file_path} has no 'articles' key — skipping")
        return

    wiki_id = str(uuid.uuid4())
    created_at = int(os.path.getmtime(file_path) * 1000)

    meta = {"name": name, "createdAt": created_at}
    data = {"name": name, "articles": legacy["articles"]}

    meta_path = f"users/{user_id}/wikis/{wiki_id}/meta.json"
    data_path = f"users/{user_id}/wikis/{wiki_id}/data.json"

    article_count = count_articles(legacy["articles"])

    if dry_run:
        print(f"  [DRY RUN] Would upload: {meta_path}")
        print(f"  [DRY RUN] Would upload: {data_path} ({article_count} articles)")
    else:
        upload_json(container, meta_path, meta)
        print(f"  OK: {meta_path}")
        upload_json(container, data_path, data)
        print(f"  OK: {data_path} ({article_count} articles)")

    print(f"  Wiki \"{name}\" -> ID: {wiki_id}")


def migrate_random_table(container, user_id, file_path, name, dry_run=False):
    """Migrate a legacy random-generator JSON file.

    Expected input format:
        {
          "mappings": [ { "key": "...", "itemsText": "...", "value": "", "category": "..." } ],
          "mappingCategories": [ { "key": "...", "value": "..." } ],
          "useWeightedSelection": true,
          "lastResult": "...",
          "lastKey": "..."
        }

    Produces:
        users/{user_id}/random-tables/{tableId}/meta.json  -> { "name": "...", "createdAt": <ms> }
        users/{user_id}/random-tables/{tableId}/data.json  -> { "name": "...", "mappings": [...], ... }
    """
    with open(file_path, "r", encoding="utf-8") as f:
        legacy = json.load(f)

    if "mappings" not in legacy:
        print(f"  ERROR: {file_path} has no 'mappings' key — skipping")
        return

    table_id = str(uuid.uuid4())
    created_at = int(os.path.getmtime(file_path) * 1000)

    # Strip extra fields from mappings (old format had "value" and "category")
    clean_mappings = [
        {"key": m["key"], "itemsText": m["itemsText"]} for m in legacy["mappings"]
    ]

    meta = {"name": name, "createdAt": created_at}
    data = {
        "name": name,
        "mappings": clean_mappings,
        "mappingCategories": legacy.get("mappingCategories", []),
        "useWeightedSelection": legacy.get("useWeightedSelection", True),
    }

    meta_path = f"users/{user_id}/random-tables/{table_id}/meta.json"
    data_path = f"users/{user_id}/random-tables/{table_id}/data.json"

    if dry_run:
        print(f"  [DRY RUN] Would upload: {meta_path}")
        print(f"  [DRY RUN] Would upload: {data_path} ({len(clean_mappings)} tables)")
    else:
        upload_json(container, meta_path, meta)
        print(f"  OK: {meta_path}")
        upload_json(container, data_path, data)
        print(f"  OK: {data_path} ({len(clean_mappings)} tables)")

    print(f"  Random Table \"{name}\" -> ID: {table_id}")


def count_articles(articles):
    """Recursively count articles including children."""
    count = len(articles)
    for a in articles:
        if a.get("children"):
            count += count_articles(a["children"])
    return count


def main():
    parser = argparse.ArgumentParser(
        description="Migrate legacy DM Tool JSON exports to Azure Blob Storage."
    )
    parser.add_argument(
        "--user-id",
        required=True,
        help="Target user ID (from x-ms-client-principal-id header or Azure AD object ID)",
    )
    parser.add_argument(
        "--wiki",
        nargs=2,
        action="append",
        metavar=("FILE", "NAME"),
        help="Wiki JSON file and display name (can be repeated)",
    )
    parser.add_argument(
        "--random-table",
        nargs=2,
        action="append",
        metavar=("FILE", "NAME"),
        help="Random table JSON file and display name (can be repeated)",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Show what would be uploaded without actually uploading",
    )

    args = parser.parse_args()

    if not args.wiki and not args.random_table:
        parser.error("Provide at least one --wiki or --random-table to migrate.")

    conn_str = get_connection_string()

    if not args.dry_run:
        from azure.storage.blob import BlobServiceClient

        blob_service = BlobServiceClient.from_connection_string(conn_str)
        container = blob_service.get_container_client("media")
    else:
        container = None
        print("DRY RUN — no data will be uploaded\n")

    if args.wiki:
        for file_path, name in args.wiki:
            print(f"Migrating wiki: {name}")
            migrate_wiki(container, args.user_id, file_path, name, args.dry_run)
            print()

    if args.random_table:
        for file_path, name in args.random_table:
            print(f"Migrating random table: {name}")
            migrate_random_table(container, args.user_id, file_path, name, args.dry_run)
            print()

    print("Migration complete!")


if __name__ == "__main__":
    main()
