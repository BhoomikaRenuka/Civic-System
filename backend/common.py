from pymongo import MongoClient, ASCENDING, DESCENDING
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError


def initialize_database():
    try:
        client = MongoClient('mongodb://localhost:27017/', serverSelectionTimeoutMS=5000)
        client.admin.command('ping')

        db = client['civic_issues']
        users_collection = db['users']
        issues_collection = db['issues']
        notifications_collection = db['notifications']

        try:
            users_collection.create_index([("email", ASCENDING)], unique=True, background=True)
            users_collection.create_index([("role", ASCENDING)], background=True)
            issues_collection.create_index([("user_id", ASCENDING)], background=True)
            issues_collection.create_index([("status", ASCENDING)], background=True)
            issues_collection.create_index([("category", ASCENDING)], background=True)
            issues_collection.create_index([("created_at", DESCENDING)], background=True)
            issues_collection.create_index([("location.address", "text")], background=True)
            notifications_collection.create_index([("user_id", ASCENDING)], background=True)
            notifications_collection.create_index([("read", ASCENDING)], background=True)
            notifications_collection.create_index([("created_at", DESCENDING)], background=True)
        except Exception:
            pass

        return client, db, users_collection, issues_collection, notifications_collection
    except (ConnectionFailure, ServerSelectionTimeoutError):
        raise

