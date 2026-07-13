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


from datetime import datetime, timedelta, timezone

class AzureBlobService:
    """Wrapper around Azure BlobServiceClient."""

    def __init__(self):
        self.settings = get_settings()
        try:
            self.blob_service_client = BlobServiceClient.from_connection_string(
                self.settings.azure_storage_connection_string
            )
            
            # Ensure containers exist for resilience
            for container in [
                self.settings.azure_container_proxies, 
                self.settings.azure_container_originals, 
                self.settings.azure_container_web
            ]:
                client = self.blob_service_client.get_container_client(container)
                if not client.exists():
                    client.create_container()
                    
        except AzureError as e:
            logger.error(f"Failed to initialize Azure Blob Client: {e}")
            raise StorageError(f"Could not connect to Azure Storage: {e}")

    def upload_file(self, file_bytes: bytes, container_name: str, destination_blob_name: str, content_type: str = "image/jpeg") -> str:
        """Uploads a file to Azure Blob Storage and returns its public-facing URL structure.

        Args:
            file_bytes: Raw bytes of the file to upload.
            container_name: The container to upload to.
            destination_blob_name: Path/name inside the blob container.
            content_type: MIME type of the file.

        Returns:
            The raw URL to the uploaded blob.
        """
        try:
            blob_client = self.blob_service_client.get_blob_client(
                container=container_name, 
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
        """Downloads a file from Azure Blob Storage using its full URL.

        Args:
            blob_url: Full URL to the blob.

        Returns:
            Raw bytes of the downloaded file.
        """
        try:
            from azure.storage.blob import BlobClient
            blob_client = BlobClient.from_blob_url(blob_url)
            # Reattach the credential so we have access to download it
            auth_client = self.blob_service_client.get_blob_client(
                container=blob_client.container_name, 
                blob=blob_client.blob_name
            )
            download_stream = auth_client.download_blob()
            return download_stream.readall()
        except AzureError as e:
            logger.error(f"Failed to download blob {blob_url}: {e}")
            raise StorageError(f"Failed to download file from Azure: {e}")

    def get_signed_url(self, blob_url: str) -> str | None:
        """Generates a 24-hour Shared Access Signature (SAS) URL for a private blob.
        
        Args:
            blob_url: The raw blob URL.
            
        Returns:
            A URL string with the SAS token appended, or None if blob_url is empty.
        """
        if not blob_url:
            return None
            
        try:
            from azure.storage.blob import BlobClient, generate_blob_sas, BlobSasPermissions
            
            blob_client = BlobClient.from_blob_url(blob_url)
            
            # Extract account key and name from the connection string
            # BlobServiceClient doesn't cleanly expose the raw key, so we parse it or use credential
            conn_dict = dict(kv.split("=", 1) for kv in self.settings.azure_storage_connection_string.split(";") if kv)
            account_key = conn_dict.get("AccountKey")
            account_name = conn_dict.get("AccountName")
            
            if not account_key or not account_name:
                # If using something like DefaultAzureCredential or Azurite emulator without keys
                # we just return the URL, assuming it's public or emulator
                return blob_url
                
            sas_token = generate_blob_sas(
                account_name=account_name,
                container_name=blob_client.container_name,
                blob_name=blob_client.blob_name,
                account_key=account_key,
                permission=BlobSasPermissions(read=True),
                expiry=datetime.now(timezone.utc) + timedelta(hours=24)
            )
            
            return f"{blob_url}?{sas_token}"
        except Exception as e:
            logger.error(f"Failed to generate SAS token for {blob_url}: {e}")
            return blob_url

# Singleton instance to be used across the app
azure_blob_service = AzureBlobService()
