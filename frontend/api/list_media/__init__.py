import azure.functions as func
import logging
import json
import sys
import os

# Add parent directory to path for shared imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from shared import get_blob_service_client, CONTAINER_NAME


def main(req: func.HttpRequest) -> func.HttpResponse:
    """List all media files in the storage container."""
    logging.info("Listing media files")

    try:
        blob_service = get_blob_service_client()
        container_client = blob_service.get_container_client(CONTAINER_NAME)

        # Get optional prefix filter from query params
        prefix = req.params.get("prefix", "")

        blobs = []
        for blob in container_client.list_blobs(name_starts_with=prefix):
            blobs.append({
                "name": blob.name,
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
