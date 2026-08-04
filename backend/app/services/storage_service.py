"""Azure Blob Storage integration.

Provides uploading and downloading of media assets to/from Azure Blob Storage
with comprehensive validation and error handling.
"""

import io
import logging
from datetime import datetime, timedelta, timezone

from azure.core.exceptions import (
    AzureError,
    ClientAuthenticationError,
    ResourceExistsError,
    ResourceNotFoundError,
    ServiceRequestError,
)
from azure.storage.blob import BlobServiceClient, ContentSettings

from app.config import get_settings

logger = logging.getLogger(__name__)

# Maximum upload size: 50 MB
MAX_UPLOAD_BYTES = 50 * 1024 * 1024
MIN_UPLOAD_BYTES = 100  # Reject empty/trivial files

ALLOWED_CONTENT_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/heic",
    "image/heif",
}


class StorageError(Exception):
    """Raised when an operation with Blob Storage fails."""

    def __init__(self, message: str, code: str = "STORAGE_ERROR"):
        self.code = code
        super().__init__(message)


class AzureBlobService:
    """Wrapper around Azure BlobServiceClient."""

    def __init__(self):
        self.settings = get_settings()
        self._initialized = False
        self.blob_service_client: BlobServiceClient | None = None

        try:
            if not self.settings.azure_storage_connection_string:
                raise StorageError(
                    "Azure storage connection string is not configured.",
                    code="STORAGE_NOT_CONFIGURED",
                )

            self.blob_service_client = BlobServiceClient.from_connection_string(
                self.settings.azure_storage_connection_string
            )

            for container in [
                self.settings.azure_container_proxies,
                self.settings.azure_container_originals,
                self.settings.azure_container_web,
            ]:
                self._ensure_container(container)

            self._initialized = True
            logger.info("Azure Blob Storage client initialized successfully.")

        except StorageError:
            raise
        except ClientAuthenticationError as e:
            logger.error("Azure authentication failed: %s", e)
            raise StorageError(
                "Azure storage authentication failed. Check your connection string.",
                code="STORAGE_AUTH_FAILED",
            ) from e
        except AzureError as e:
            logger.error("Failed to initialize Azure Blob Client: %s", e)
            raise StorageError(
                f"Could not connect to Azure Storage: {e}",
                code="STORAGE_CONNECTION_FAILED",
            ) from e

    def _ensure_container(self, container_name: str) -> None:
        """Create container if it does not exist."""
        if not self.blob_service_client:
            raise StorageError("Storage client not initialized.", code="STORAGE_NOT_INITIALIZED")

        try:
            client = self.blob_service_client.get_container_client(container_name)
            if not client.exists():
                client.create_container()
                logger.info("Created Azure container: %s", container_name)
        except ResourceExistsError:
            pass  # Race condition — container was created concurrently
        except AzureError as e:
            logger.error("Failed to ensure container %s: %s", container_name, e)
            raise StorageError(
                f"Failed to access storage container '{container_name}': {e}",
                code="STORAGE_CONTAINER_ERROR",
            ) from e

    @staticmethod
    def validate_upload(file_bytes: bytes, content_type: str = "image/jpeg") -> None:
        """Validate file bytes before upload."""
        if not file_bytes:
            raise StorageError("Cannot upload an empty file.", code="EMPTY_FILE")

        if len(file_bytes) < MIN_UPLOAD_BYTES:
            raise StorageError(
                "File is too small or corrupted.",
                code="FILE_TOO_SMALL",
            )

        if len(file_bytes) > MAX_UPLOAD_BYTES:
            raise StorageError(
                f"File exceeds maximum size of {MAX_UPLOAD_BYTES // (1024 * 1024)} MB.",
                code="FILE_TOO_LARGE",
            )

        normalized_type = content_type.lower().split(";")[0].strip()
        if normalized_type not in ALLOWED_CONTENT_TYPES:
            raise StorageError(
                f"Unsupported file type: {content_type}. Allowed: JPEG, PNG, WebP, HEIC.",
                code="INVALID_CONTENT_TYPE",
            )

    def upload_file(
        self,
        file_bytes: bytes,
        container_name: str,
        destination_blob_name: str,
        content_type: str = "image/jpeg",
    ) -> str:
        """Upload a file to Azure Blob Storage and return its URL."""
        if not self._initialized or not self.blob_service_client:
            raise StorageError("Storage service is not available.", code="STORAGE_NOT_INITIALIZED")

        self.validate_upload(file_bytes, content_type)

        try:
            blob_client = self.blob_service_client.get_blob_client(
                container=container_name,
                blob=destination_blob_name,
            )
            blob_client.upload_blob(
                file_bytes,
                overwrite=True,
                content_settings=ContentSettings(content_type=content_type),
            )
            logger.info("Uploaded blob: %s/%s (%d bytes)", container_name, destination_blob_name, len(file_bytes))
            return blob_client.url

        except ResourceNotFoundError as e:
            logger.error("Container not found during upload: %s", e)
            raise StorageError(
                f"Storage container '{container_name}' not found.",
                code="CONTAINER_NOT_FOUND",
            ) from e
        except ServiceRequestError as e:
            logger.error("Network error during upload to %s: %s", destination_blob_name, e)
            raise StorageError(
                "Network error while uploading. Please try again.",
                code="STORAGE_NETWORK_ERROR",
            ) from e
        except AzureError as e:
            logger.error("Failed to upload blob %s: %s", destination_blob_name, e)
            raise StorageError(
                f"Failed to upload file to cloud storage: {e}",
                code="UPLOAD_FAILED",
            ) from e

    def download_file(self, blob_url: str) -> bytes:
        """Download a file from Azure Blob Storage using its full URL."""
        if not self._initialized or not self.blob_service_client:
            raise StorageError("Storage service is not available.", code="STORAGE_NOT_INITIALIZED")

        if not blob_url:
            raise StorageError("No blob URL provided for download.", code="MISSING_BLOB_URL")

        try:
            from azure.storage.blob import BlobClient

            blob_client = BlobClient.from_blob_url(blob_url)
            auth_client = self.blob_service_client.get_blob_client(
                container=blob_client.container_name,
                blob=blob_client.blob_name,
            )
            download_stream = auth_client.download_blob()
            data = download_stream.readall()

            if not data:
                raise StorageError(
                    "Downloaded file is empty.",
                    code="EMPTY_DOWNLOAD",
                )
            return data

        except ResourceNotFoundError as e:
            logger.error("Blob not found: %s", blob_url)
            raise StorageError(
                "File not found in cloud storage. It may have been deleted.",
                code="BLOB_NOT_FOUND",
            ) from e
        except ServiceRequestError as e:
            logger.error("Network error downloading %s: %s", blob_url, e)
            raise StorageError(
                "Network error while downloading file.",
                code="STORAGE_NETWORK_ERROR",
            ) from e
        except StorageError:
            raise
        except AzureError as e:
            logger.error("Failed to download blob %s: %s", blob_url, e)
            raise StorageError(
                f"Failed to download file from cloud storage: {e}",
                code="DOWNLOAD_FAILED",
            ) from e

    def get_signed_url(self, blob_url: str) -> str | None:
        """Generate a 24-hour SAS URL for a private blob."""
        if not blob_url:
            return None

        try:
            from azure.storage.blob import BlobClient, generate_blob_sas, BlobSasPermissions

            blob_client = BlobClient.from_blob_url(blob_url)

            conn_dict = dict(
                kv.split("=", 1)
                for kv in self.settings.azure_storage_connection_string.split(";")
                if kv and "=" in kv
            )
            account_key = conn_dict.get("AccountKey")
            account_name = conn_dict.get("AccountName")

            if not account_key or not account_name:
                return blob_url

            sas_token = generate_blob_sas(
                account_name=account_name,
                container_name=blob_client.container_name,
                blob_name=blob_client.blob_name,
                account_key=account_key,
                permission=BlobSasPermissions(read=True),
                expiry=datetime.now(timezone.utc) + timedelta(hours=24),
            )

            return f"{blob_url}?{sas_token}"
        except Exception as e:
            logger.error("Failed to generate SAS token for %s: %s", blob_url, e)
            return blob_url

    def delete_file(self, blob_url: str) -> None:
        """Delete a blob from storage. Silently succeeds if blob doesn't exist."""
        if not blob_url or not self.blob_service_client:
            return

        try:
            from azure.storage.blob import BlobClient

            blob_client = BlobClient.from_blob_url(blob_url)
            auth_client = self.blob_service_client.get_blob_client(
                container=blob_client.container_name,
                blob=blob_client.blob_name,
            )
            auth_client.delete_blob()
            logger.info("Deleted blob: %s", blob_url)
        except ResourceNotFoundError:
            logger.warning("Blob already deleted: %s", blob_url)
        except AzureError as e:
            logger.error("Failed to delete blob %s: %s", blob_url, e)
            raise StorageError(
                f"Failed to delete file from cloud storage: {e}",
                code="DELETE_FAILED",
            ) from e


# Singleton — initialization errors are deferred to first use if connection string missing
try:
    azure_blob_service = AzureBlobService()
except StorageError as e:
    logger.critical("Azure Blob Service failed to initialize: %s", e)
    azure_blob_service = AzureBlobService.__new__(AzureBlobService)
    azure_blob_service._initialized = False
    azure_blob_service.blob_service_client = None
    azure_blob_service.settings = get_settings()
