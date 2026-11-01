"""
MongoDB Connection Configuration Module
Handles real MongoDB (Atlas/Local) with automatic fallback to mongomock.
"""
import os
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError

DB_NAME = "learnify_ml_db"

def get_db():
    uri = os.getenv("MONGODB_URI", "mongodb://127.0.0.1:27017")
    try:
        client = MongoClient(uri, serverSelectionTimeoutMS=2000)
        # Test connection
        client.admin.command('ping')
        print(f"✅ Connected to MongoDB at {uri} (Database: {DB_NAME})")
        db = client[DB_NAME]
        return db, client, False
    except (ConnectionFailure, ServerSelectionTimeoutError) as e:
        print(f"⚠️ Local MongoDB daemon not reachable at {uri} ({e}).")
        print("🚀 Utilizing mongomock for in-memory MongoDB execution with zero setup barrier...")
        import mongomock
        mock_client = mongomock.MongoClient()
        mock_db = mock_client[DB_NAME]
        return mock_db, mock_client, True
