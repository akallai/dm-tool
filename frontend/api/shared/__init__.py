import os
import base64
import json
import hashlib
from azure.storage.blob import BlobServiceClient

CONTAINER_NAME = "media"


def get_blob_service_client():
    """Get the blob service client using connection string from environment."""
    connection_string = os.environ.get("STORAGE_CONNECTION_STRING")
    if not connection_string:
        raise ValueError("STORAGE_CONNECTION_STRING environment variable not set")
    return BlobServiceClient.from_connection_string(connection_string)


def get_user_id(req) -> str:
    """Extract user ID from the SWA x-ms-client-principal header.

    Returns a stable, filesystem-safe user identifier.
    Falls back to 'anonymous' for local development without auth.
    """
    header = req.headers.get("x-ms-client-principal")
    if not header:
        return "anonymous"

    try:
        decoded = base64.b64decode(header)
        principal = json.loads(decoded)
        user_id = principal.get("userId", "")
        if user_id:
            return user_id
    except Exception:
        pass

    return "anonymous"


def user_blob_path(req, filename: str) -> str:
    """Prefix a blob path with the authenticated user's ID."""
    user_id = get_user_id(req)
    return f"users/{user_id}/{filename}"


def user_blob_prefix(req, prefix: str = "") -> str:
    """Get a user-scoped prefix for listing blobs."""
    user_id = get_user_id(req)
    return f"users/{user_id}/{prefix}"
