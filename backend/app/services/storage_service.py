"""Azure Blob Storage integration.

Provides uploading and downloading of media assets to/from Azure Blob Storage.
"""

import io
import logging
from azure.storage.blob import BlobServiceClient
from azure.core.exceptions import AzureError

from app.config import get_settings

logger = logging.getLogger(__name__)

class StorageError(Exception):
    """Raised when an operation with Blob Storage fails."""
    pass


class AzureBlobService:
    """Wrapper around Azure BlobServiceClient."""

    def __init__(self):
        self.settings = get_settings()
        try:
            self.blob_service_client = BlobServiceClient.from_connection_string(
                self.settings.azure_storage_connection_string
            )
            self.container_name = self.settings.azure_container_name
            # Ensure container exists (for simple local dev)
            self.container_client = self.blob_service_client.get_container_client(self.container_name)
            if not self.container_client.exists():
                self.container_client.create_container()
        except AzureError as e:
            logger.error(f"Failed to initialize Azure Blob Client: {e}")
            raise StorageError(f"Could not connect to Azure Storage: {e}")

    def upload_file(self, file_bytes: bytes, destination_blob_name: str, content_type: str = "image/jpeg") -> str:
        """Uploads a file to Azure Blob Storage and returns its URL.

        Args:
            file_bytes: Raw bytes of the file to upload.
            destination_blob_name: Path/name inside the blob container.
            content_type: MIME type of the file.

        Returns:
            The full URL to the uploaded blob.
        """
        try:
            blob_client = self.blob_service_client.get_blob_client(
                container=self.container_name, 
                blob=destination_blob_name
            )
            blob_client.upload_blob(
                file_bytes, 
                overwrite=True,
                content_settings={'content_type': content_type}
            )
            return blob_client.url
        except AzureError as e:
            logger.error(f"Failed to upload to blob {destination_blob_name}: {e}")
            raise StorageError(f"Failed to upload file to Azure: {e}")

    def download_file(self, blob_url: str) -> bytes:
        """Downloads a file from Azure Blob Storage.

        Args:
            blob_url: Full URL to the blob.

        Returns:
            Raw bytes of the downloaded file.
        """
        try:
            # We can extract the blob name from the URL or just use from_blob_url
            blob_client = self.blob_service_client.get_blob_client(
                container=self.container_name,
                blob=blob_url.split(f"{self.container_name}/")[-1]
            )
            download_stream = blob_client.download_blob()
            return download_stream.readall()
        except AzureError as e:
            logger.error(f"Failed to download blob {blob_url}: {e}")
            raise StorageError(f"Failed to download file from Azure: {e}")

# Singleton instance to be used across the app
azure_blob_service = AzureBlobService()
