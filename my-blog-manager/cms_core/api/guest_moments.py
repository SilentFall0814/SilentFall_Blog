import hashlib
from datetime import datetime, timezone
from fastapi import APIRouter, Request, Query, Body
from bson import ObjectId
from cms_core.database import get_guest_moments_collection
from pydantic import BaseModel
from typing import Optional

router = APIRouter()

class GuestMomentSubmit(BaseModel):
    author: str
    email: Optional[str] = ""
    content: str
    location: Optional[str] = ""

def _gravatar_url(email: str, size: int = 80) -> str:
    if not email or not email.strip():
        return f"https://cravatar.cn/avatar/default?d=mp&s={size}"
    email = email.strip().lower()
    h = hashlib.md5(email.encode()).hexdigest()
    return f"https://cravatar.cn/avatar/{h}?d=mp&s={size}"

def _serialize(doc: dict) -> dict:
    doc["id"] = str(doc.pop("_id"))
    return doc

@router.post("/submit")
async def submit_guest_moment(payload: GuestMomentSubmit, request: Request):
    """访客提交说说"""
    now = datetime.now(timezone.utc)
    doc = {
        "author": payload.author,
        "email": payload.email,
        "avatar": _gravatar_url(payload.email),
        "content": payload.content,
        "location": payload.location,
        "status": "pending", # 默认为待审核
        "created_at": now,
        "updated_at": now,
        "ip": request.client.host if request.client else "",
    }
    
    col = get_guest_moments_collection()
    result = col.insert_one(doc)
    doc["_id"] = result.inserted_id
    
    return {"success": True, "message": "提交成功，请等待博主审核", "data": _serialize(doc)}

@router.get("/list_approved")
async def list_approved_guest_moments():
    """获取已审核通过的访客说说（给前台用）"""
    col = get_guest_moments_collection()
    docs = list(col.find({"status": "approved"}).sort("created_at", -1))
    return {"success": True, "data": [_serialize(d) for d in docs]}

@router.get("/admin/all")
async def admin_list_all_guest_moments(
    status: str = Query(default="all"),
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100)
):
    """管理员获取所有访客说说"""
    col = get_guest_moments_collection()
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
        "total": total
    }

@router.put("/admin/status/{moment_id}")
async def update_guest_moment_status(moment_id: str, payload: dict = Body(...)):
    """审核操作"""
    new_status = payload.get("status")
    if new_status not in ("approved", "pending", "rejected"):
        return {"success": False, "message": "无效的状态"}
        
    col = get_guest_moments_collection()
    result = col.update_one(
        {"_id": ObjectId(moment_id)},
        {"$set": {"status": new_status, "updated_at": datetime.now(timezone.utc)}}
    )
    
    if result.matched_count == 0:
        return {"success": False, "message": "说说不存在"}
        
    return {"success": True, "message": f"已更新为 {new_status}"}

@router.delete("/admin/{moment_id}")
async def delete_guest_moment(moment_id: str):
    """彻底删除"""
    col = get_guest_moments_collection()
    result = col.delete_one({"_id": ObjectId(moment_id)})

    if result.deleted_count == 0:
        return {"success": False, "message": "说说不存在"}

    return {"success": True, "message": "已彻底删除"}


@router.get("/admin/stats")
async def get_guest_moment_stats():
    """获取访客说说统计数据"""
    col = get_guest_moments_collection()
    stats = {
        "total": col.count_documents({}),
        "approved": col.count_documents({"status": "approved"}),
        "pending": col.count_documents({"status": "pending"}),
        "rejected": col.count_documents({"status": "rejected"}),
    }
    return {"success": True, "data": stats}
