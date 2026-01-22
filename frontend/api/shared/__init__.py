import os
from azure.storage.blob import BlobServiceClient

CONTAINER_NAME = "media"


def get_blob_service_client():
    """Get the blob service client using connection string from environment."""
    connection_string = os.environ.get("STORAGE_CONNECTION_STRING")
    if not connection_string:
        raise ValueError("STORAGE_CONNECTION_STRING environment variable not set")
    return BlobServiceClient.from_connection_string(connection_string)
