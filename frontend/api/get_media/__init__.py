import azure.functions as func
import logging
import json
import sys
import os

# Add parent directory to path for shared imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from shared import get_blob_service_client, CONTAINER_NAME, user_blob_path, shared_blob_path, user_blob_prefix, shared_blob_prefix


def _list_media(req: func.HttpRequest) -> func.HttpResponse:
    """List media files (handles GET /api/media when catch-all route matches)."""
    try:
        blob_service = get_blob_service_client()
        container_client = blob_service.get_container_client(CONTAINER_NAME)

        scope = req.params.get("scope", "user")
        raw_prefix = req.params.get("prefix", "")

        if scope == "shared":
            prefix = shared_blob_prefix(raw_prefix)
            strip_len = 0
        else:
            prefix = user_blob_prefix(req, raw_prefix)
            strip_len = len(user_blob_prefix(req))

        blobs = []
        for blob in container_client.list_blobs(name_starts_with=prefix):
            blobs.append({
                "name": blob.name[strip_len:],
                "size": blob.size,
                "content_type": blob.content_settings.content_type if blob.content_settings else None,
                "last_modified": blob.last_modified.isoformat() if blob.last_modified else None,
            })

        return func.HttpResponse(
            json.dumps({"files": blobs}),
            mimetype="application/json",
            status_code=200
        )
    except ValueError as e:
        logging.error(f"Configuration error: {e}")
        return func.HttpResponse(
            json.dumps({"error": "Storage not configured"}),
            mimetype="application/json",
            status_code=500
        )
    except Exception as e:
        logging.error(f"Error listing media: {e}")
        return func.HttpResponse(
            json.dumps({"error": str(e)}),
            mimetype="application/json",
            status_code=500
        )


def main(req: func.HttpRequest) -> func.HttpResponse:
    """Get a specific media file by filename."""
    filename = req.route_params.get("filename", "")
    logging.info(f"Getting media file: {filename}")

    if not filename:
        return _list_media(req)

    try:
        blob_service = get_blob_service_client()
        container_client = blob_service.get_container_client(CONTAINER_NAME)
        scope = req.params.get("scope", "user")
        if scope == "shared":
            blob_path = shared_blob_path(filename)
        else:
            blob_path = user_blob_path(req, filename)
        blob_client = container_client.get_blob_client(blob_path)

        # Check if blob exists
        if not blob_client.exists():
            return func.HttpResponse(
                json.dumps({"error": "File not found"}),
                mimetype="application/json",
                status_code=404
            )

        # Download the blob
        blob_data = blob_client.download_blob()
        properties = blob_client.get_blob_properties()
        content_type = properties.content_settings.content_type or "application/octet-stream"

        return func.HttpResponse(
            blob_data.readall(),
            mimetype=content_type,
            status_code=200
        )

    except ValueError as e:
        logging.error(f"Configuration error: {e}")
        return func.HttpResponse(
            json.dumps({"error": "Storage not configured"}),
            mimetype="application/json",
            status_code=500
        )
    except Exception as e:
        logging.error(f"Error getting media: {e}")
        return func.HttpResponse(
            json.dumps({"error": str(e)}),
            mimetype="application/json",
            status_code=500
        )
