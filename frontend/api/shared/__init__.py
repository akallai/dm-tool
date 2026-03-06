import os
import base64
import json
from urllib.parse import unquote
from azure.storage.blob import BlobServiceClient

CONTAINER_NAME = "media"


def get_blob_service_client():
    """Get the blob service client using connection string from environment."""
    connection_string = os.environ.get("STORAGE_CONNECTION_STRING")
    if not connection_string:
        raise ValueError("STORAGE_CONNECTION_STRING environment variable not set")
    return BlobServiceClient.from_connection_string(connection_string)


def get_user_id(req) -> str:
    """Extract user ID from SWA auth headers.

    SWA sends x-ms-client-principal-id directly, and also
    x-ms-client-principal as a base64 JSON payload.
    Falls back to 'anonymous' for local development without auth.
    """
    # Direct header (most reliable, set by SWA runtime in production)
    principal_id = req.headers.get("x-ms-client-principal-id")
    if principal_id:
        return principal_id

    # Fallback: decode the base64 principal payload
    header = req.headers.get("x-ms-client-principal")
    if header:
        try:
            decoded = base64.b64decode(header)
            principal = json.loads(decoded)
            user_id = principal.get("userId", "")
            if user_id:
                return user_id
        except Exception:
            pass

    # Fallback: frontend-supplied header (for SWA CLI local dev)
    app_user_id = req.headers.get("x-app-user-id")
    if app_user_id:
        return app_user_id

    return "anonymous"


def user_blob_path(req, filename: str) -> str:
    """Prefix a blob path with the authenticated user's ID."""
    user_id = get_user_id(req)
    filename = unquote(filename)
    return f"users/{user_id}/{filename}"


def user_blob_prefix(req, prefix: str = "") -> str:
    """Get a user-scoped prefix for listing blobs."""
    user_id = get_user_id(req)
    prefix = unquote(prefix)
    return f"users/{user_id}/{prefix}"


def shared_blob_path(filename: str) -> str:
    """Return a blob path without user prefix (for shared content)."""
    return unquote(filename)


def shared_blob_prefix(prefix: str = "") -> str:
    """Return a prefix without user scope (for shared content)."""
    return unquote(prefix)
