import os
from pymongo import MongoClient
from pymongo.collection import Collection

MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017")
MONGO_DB_NAME = os.environ.get("MONGO_DB_NAME", "nowin_blog")

_client: MongoClient | None = None


def get_client() -> MongoClient:
    global _client
    if _client is None:
        _client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
    return _client


def get_db():
    return get_client()[MONGO_DB_NAME]


def get_comments_collection() -> Collection:
    return get_db()["comments"]


def get_guest_moments_collection() -> Collection:
    return get_db()["guest_moments"]


def get_announcements_collection() -> Collection:
    return get_db()["announcements"]
