import azure.functions as func
import logging
import json
import sys
import os

# Add parent directory to path for shared imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from shared import get_blob_service_client, CONTAINER_NAME


def main(req: func.HttpRequest) -> func.HttpResponse:
    """Get a specific media file by filename."""
    filename = req.route_params.get("filename")
    logging.info(f"Getting media file: {filename}")

    if not filename:
        return func.HttpResponse(
            json.dumps({"error": "Filename is required"}),
            mimetype="application/json",
            status_code=400
        )

    try:
        blob_service = get_blob_service_client()
        container_client = blob_service.get_container_client(CONTAINER_NAME)
        blob_client = container_client.get_blob_client(filename)

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
