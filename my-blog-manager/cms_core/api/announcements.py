import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Body, Query, HTTPException
from bson import ObjectId
from bson.errors import InvalidId
from cms_core.database import get_announcements_collection
from pydantic import BaseModel
from typing import Optional

router = APIRouter()


class AnnouncementCreate(BaseModel):
    content: str
    status: str = "draft"


class AnnouncementUpdate(BaseModel):
    content: Optional[str] = None
    status: Optional[str] = None


def _serialize(doc: dict) -> dict:
    doc["id"] = str(doc.pop("_id"))
    if "publish_time" in doc and doc["publish_time"]:
        doc["publish_time"] = doc["publish_time"].isoformat()
    if "created_at" in doc and doc["created_at"]:
        doc["created_at"] = doc["created_at"].isoformat()
    if "updated_at" in doc and doc["updated_at"]:
        doc["updated_at"] = doc["updated_at"].isoformat()
    return doc


@router.get("/published")
async def list_published():
    try:
        col = get_announcements_collection()
        docs = list(
            col.find({"status": "published"})
            .sort("publish_time", -1)
        )
        return {"success": True, "data": [_serialize(d) for d in docs]}
    except Exception as e:
        return {"success": False, "message": f"获取公告失败: {str(e)}"}


@router.get("/admin/all")
async def admin_list_all(
    status: str = Query(default="all"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
):
    try:
        col = get_announcements_collection()
        query = {}
        if status != "all":
            query["status"] = status

        total = col.count_documents(query)
        docs = list(
            col.find(query)
            .sort("created_at", -1)
            .skip((page - 1) * page_size)
            .limit(page_size)
        )

        return {
            "success": True,
            "data": [_serialize(d) for d in docs],
            "total": total,
        }
    except Exception as e:
        return {"success": False, "message": f"获取公告列表失败: {str(e)}"}


@router.post("/admin/create")
async def create_announcement(payload: AnnouncementCreate):
    try:
        now = datetime.now(timezone.utc)
        doc = {
            "content": payload.content,
            "status": payload.status,
            "publish_time": None,
            "created_at": now,
            "updated_at": now,
        }

        if payload.status == "published":
            doc["publish_time"] = now

        col = get_announcements_collection()
        result = col.insert_one(doc)
        doc["_id"] = result.inserted_id

        return {"success": True, "message": "公告创建成功", "data": _serialize(doc)}
    except Exception as e:
        return {"success": False, "message": f"创建公告失败: {str(e)}"}


@router.put("/admin/update/{announcement_id}")
async def update_announcement(announcement_id: str, payload: AnnouncementUpdate):
    try:
        if not ObjectId.is_valid(announcement_id):
            return {"success": False, "message": "无效的公告 ID"}

        col = get_announcements_collection()
        update_fields: dict = {"updated_at": datetime.now(timezone.utc)}

        if payload.content is not None:
            update_fields["content"] = payload.content

        if payload.status is not None:
            if payload.status not in ("draft", "published"):
                return {"success": False, "message": "无效的状态，仅支持 draft 或 published"}
            update_fields["status"] = payload.status

            if payload.status == "published":
                existing = col.find_one({"_id": ObjectId(announcement_id)})
                if existing and existing.get("status") != "published":
                    update_fields["publish_time"] = datetime.now(timezone.utc)

        result = col.update_one(
            {"_id": ObjectId(announcement_id)},
            {"$set": update_fields},
        )

        if result.matched_count == 0:
            return {"success": False, "message": "公告不存在"}

        return {"success": True, "message": "公告更新成功"}
    except InvalidId:
        return {"success": False, "message": "无效的公告 ID 格式"}
    except Exception as e:
        return {"success": False, "message": f"更新公告失败: {str(e)}"}


@router.delete("/admin/{announcement_id}")
async def delete_announcement(announcement_id: str):
    try:
        if not ObjectId.is_valid(announcement_id):
            return {"success": False, "message": "无效的公告 ID"}

        col = get_announcements_collection()
        result = col.delete_one({"_id": ObjectId(announcement_id)})

        if result.deleted_count == 0:
            return {"success": False, "message": "公告不存在"}

        return {"success": True, "message": "公告已删除"}
    except InvalidId:
        return {"success": False, "message": "无效的公告 ID 格式"}
    except Exception as e:
        return {"success": False, "message": f"删除公告失败: {str(e)}"}


@router.get("/admin/stats")
async def get_announcement_stats():
    try:
        col = get_announcements_collection()
        stats = {
            "total": col.count_documents({}),
            "published": col.count_documents({"status": "published"}),
            "draft": col.count_documents({"status": "draft"}),
        }
        return {"success": True, "data": stats}
    except Exception as e:
        return {"success": False, "message": f"获取统计失败: {str(e)}"}
