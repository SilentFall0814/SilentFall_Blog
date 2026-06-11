import os
import logging
from pymongo import MongoClient
from pymongo.collection import Collection
from pymongo.errors import PyMongoError

MONGO_URI = os.environ.get("MONGO_URI", "mongodb://localhost:27017")
MONGO_DB_NAME = os.environ.get("MONGO_DB_NAME", "silentfall_blog")

_client: MongoClient | None = None
_logger = logging.getLogger("silentfall.cms.database")


def _mask_mongo_uri(uri: str) -> str:
    """隐藏连接串中的账号密码，避免日志泄露敏感信息。"""
    if "@" not in uri or "://" not in uri:
        return uri
    scheme, rest = uri.split("://", 1)
    credentials, host_part = rest.split("@", 1)
    if ":" not in credentials:
        return f"{scheme}://***@{host_part}"
    username = credentials.split(":", 1)[0]
    return f"{scheme}://{username}:***@{host_part}"


def get_client() -> MongoClient:
    global _client
    if _client is None:
        try:
            _client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
            _client.admin.command("ping")
            _logger.info(
                "MongoDB 连接成功，数据库=%s，地址=%s",
                MONGO_DB_NAME,
                _mask_mongo_uri(MONGO_URI),
            )
        except PyMongoError as exc:
            _logger.exception(
                "MongoDB 连接失败，数据库=%s，地址=%s",
                MONGO_DB_NAME,
                _mask_mongo_uri(MONGO_URI),
            )
            raise RuntimeError("MongoDB 连接失败，请检查连接串、账号权限与服务状态") from exc
    return _client


def get_db():
    return get_client()[MONGO_DB_NAME]


def validate_database_connection() -> None:
    """启动时主动检查数据库连接，便于线上快速定位配置问题。"""
    get_client()


def get_comments_collection() -> Collection:
    return get_db()["comments"]


def get_guest_moments_collection() -> Collection:
    return get_db()["guest_moments"]


def get_announcements_collection() -> Collection:
    return get_db()["announcements"]
