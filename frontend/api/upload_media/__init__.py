import azure.functions as func
import logging
import json
import sys
import os
from azure.storage.blob import ContentSettings

# Add parent directory to path for shared imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from shared import get_blob_service_client, CONTAINER_NAME


def main(req: func.HttpRequest) -> func.HttpResponse:
    """Upload a media file."""
    filename = req.route_params.get("filename")
    logging.info(f"Uploading media file: {filename}")

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

        # Get content type from header or guess from filename
        content_type = req.headers.get("Content-Type", "application/octet-stream")

        # Upload the blob
        blob_client.upload_blob(
            req.get_body(),
            overwrite=True,
            content_settings=ContentSettings(content_type=content_type)
        )

        return func.HttpResponse(
            json.dumps({
                "message": "File uploaded successfully",
                "filename": filename
            }),
            mimetype="application/json",
            status_code=201
        )

    except ValueError as e:
        logging.error(f"Configuration error: {e}")
        return func.HttpResponse(
            json.dumps({"error": "Storage not configured"}),
            mimetype="application/json",
            status_code=500
        )
    except Exception as e:
        logging.error(f"Error uploading media: {e}")
        return func.HttpResponse(
            json.dumps({"error": str(e)}),
            mimetype="application/json",
            status_code=500
        )
