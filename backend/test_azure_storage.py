import sys
import os

# This lets the script find your app's config
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from azure.storage.blob import BlobServiceClient
from dotenv import load_dotenv

load_dotenv()

CONNECTION_STRING = os.getenv("AZURE_STORAGE_CONNECTION_STRING")

def test_azure():
    print("Connecting to Azure...")
    
    try:
        client = BlobServiceClient.from_connection_string(CONNECTION_STRING)
        
        # ── Test 1: Can we see our containers? ──────────────────────────
        print("\n Listing containers:")
        containers = list(client.list_containers())
        for c in containers:
            print(f"   found: {c['name']}")
        
        if not containers:
            print("   No containers found — did you create proxies/originals/web?")
            return

        # ── Test 2: Can we upload a file? ───────────────────────────────
        print("\n Uploading test file to 'proxies'...")
        blob_client = client.get_blob_client(
            container="proxies",
            blob="test/hello.txt"
        )
        blob_client.upload_blob(b"Hello from FastSend!", overwrite=True)
        print("   Upload successful!")

        # ── Test 3: Can we read it back? ─────────────────────────────────
        print("\n Reading it back...")
        data = blob_client.download_blob().readall()
        print(f"   Content: {data.decode()}")

        # ── Test 4: Can we delete it? ────────────────────────────────────
        print("\n Cleaning up test file...")
        blob_client.delete_blob()
        print("   Deleted successfully!")

        print("\n All tests passed! Azure Blob Storage is working correctly.")

    except Exception as e:
        print(f"\n Something went wrong: {e}")
        print("\n Common causes:")
        print("   - AZURE_STORAGE_CONNECTION_STRING not in your .env file")
        print("   - Connection string was copied incorrectly (check for missing characters)")
        print("   - Container names don't match exactly (must be lowercase)")

if __name__ == "__main__":
    test_azure()