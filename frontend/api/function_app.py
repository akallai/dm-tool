import azure.functions as func
import logging
import os
import json
from azure.storage.blob import BlobServiceClient, ContentSettings

app = func.FunctionApp()

CONTAINER_NAME = "media"


def get_blob_service_client():
    """Get the blob service client using connection string from environment."""
    connection_string = os.environ.get("STORAGE_CONNECTION_STRING")
    if not connection_string:
        raise ValueError("STORAGE_CONNECTION_STRING environment variable not set")
    return BlobServiceClient.from_connection_string(connection_string)


@app.route(route="media", methods=["GET"], auth_level=func.AuthLevel.ANONYMOUS)
def list_media(req: func.HttpRequest) -> func.HttpResponse:
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


@app.route(route="media/{*filename}", methods=["GET"], auth_level=func.AuthLevel.ANONYMOUS)
def get_media(req: func.HttpRequest) -> func.HttpResponse:
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


@app.route(route="media/{*filename}", methods=["PUT"], auth_level=func.AuthLevel.ANONYMOUS)
def upload_media(req: func.HttpRequest) -> func.HttpResponse:
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


@app.route(route="media/{*filename}", methods=["DELETE"], auth_level=func.AuthLevel.ANONYMOUS)
def delete_media(req: func.HttpRequest) -> func.HttpResponse:
    """Delete a media file."""
    filename = req.route_params.get("filename")
    logging.info(f"Deleting media file: {filename}")

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

        # Delete the blob
        blob_client.delete_blob()

        return func.HttpResponse(
            json.dumps({"message": "File deleted successfully"}),
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
        logging.error(f"Error deleting media: {e}")
        return func.HttpResponse(
            json.dumps({"error": str(e)}),
            mimetype="application/json",
            status_code=500
        )


@app.route(route="health", methods=["GET"], auth_level=func.AuthLevel.ANONYMOUS)
def health_check(req: func.HttpRequest) -> func.HttpResponse:
    """Health check endpoint."""
    return func.HttpResponse(
        json.dumps({"status": "healthy"}),
        mimetype="application/json",
        status_code=200
    )
