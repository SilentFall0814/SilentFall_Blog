import hashlib
from datetime import datetime, timezone
from fastapi import APIRouter, Request, Query, Depends
from bson import ObjectId
from cms_core.database import get_comments_collection
from cms_core.security import get_current_admin, sanitize_payload, sanitize_nosql_field

router = APIRouter()


def _gravatar_url(email: str, size: int = 80) -> str:
    email = email.strip().lower()
    h = hashlib.md5(email.encode()).hexdigest()
    return f"https://cravatar.cn/avatar/{h}?d=mp&s={size}"


def _serialize(doc: dict) -> dict:
    doc["id"] = str(doc.pop("_id"))
    return doc


@router.get("/list")
async def list_comments(page_id: str = Query(...), status: str = Query(default="approved")):
    col = get_comments_collection()
    query: dict = {"page_id": page_id}
    if status != "all":
        query["status"] = status
    docs = list(col.find(query).sort("created_at", 1))
    return {"success": True, "data": [_serialize(d) for d in docs]}


@router.get("/all")
async def list_all_comments(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    status: str = Query(default="all"),
    _=Depends(get_current_admin),
):
    col = get_comments_collection()
    query: dict = {}
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
        "page": page,
        "page_size": page_size,
    }


@router.post("/create")
async def create_comment(request: Request):
    raw_payload = await request.json()
    payload = sanitize_payload(raw_payload)
    page_id = sanitize_nosql_field(payload.get("page_id", ""), max_length=200)
    author = sanitize_nosql_field(payload.get("author", ""), max_length=100)
    email = sanitize_nosql_field(payload.get("email", ""), max_length=200)
    content = sanitize_nosql_field(payload.get("content", ""), max_length=2000)
    reply_to = sanitize_nosql_field((payload.get("reply_to") or ""), max_length=200) or None

    if not page_id or not author or not content:
        return {"success": False, "message": "页面标识、昵称和评论内容不能为空"}

    now = datetime.now(timezone.utc)
    doc = {
        "page_id": page_id,
        "author": author,
        "email": email,
        "avatar": _gravatar_url(email) if email else "",
        "content": content,
        "reply_to": reply_to,
        "status": "pending",
        "likes": 0,
        "created_at": now,
        "updated_at": now,
        "ip": request.client.host if request.client else "",
        "user_agent": request.headers.get("user-agent", ""),
    }

    col = get_comments_collection()
    result = col.insert_one(doc)
    doc["_id"] = result.inserted_id

    return {"success": True, "data": _serialize(doc)}


@router.post("/like/{comment_id}")
async def like_comment(comment_id: str):
    clean_id = sanitize_nosql_field(comment_id, max_length=50)
    if not ObjectId.is_valid(clean_id):
        return {"success": False, "message": "无效的评论 ID"}
    col = get_comments_collection()
    result = col.update_one({"_id": ObjectId(clean_id)}, {"$inc": {"likes": 1}})
    if result.matched_count == 0:
        return {"success": False, "message": "评论不存在"}
    return {"success": True}


@router.put("/status/{comment_id}")
async def update_comment_status(comment_id: str, request: Request, _=Depends(get_current_admin)):
    raw_payload = await request.json()
    payload = sanitize_payload(raw_payload)
    new_status = sanitize_nosql_field(payload.get("status", ""), max_length=50)
    if new_status not in ("approved", "pending", "hidden"):
        return {"success": False, "message": "无效的状态值"}

    if not ObjectId.is_valid(comment_id):
        return {"success": False, "message": "无效的评论 ID"}

    col = get_comments_collection()
    result = col.update_one(
        {"_id": ObjectId(comment_id)},
        {"$set": {"status": new_status, "updated_at": datetime.now(timezone.utc)}},
    )
    if result.matched_count == 0:
        return {"success": False, "message": "评论不存在"}
    return {"success": True, "message": f"评论状态已更新为 {new_status}"}


@router.delete("/{comment_id}")
async def delete_comment(comment_id: str, _=Depends(get_current_admin)):
    if not ObjectId.is_valid(comment_id):
        return {"success": False, "message": "无效的评论 ID"}
    col = get_comments_collection()
    result = col.delete_one({"_id": ObjectId(comment_id)})
    if result.deleted_count == 0:
        return {"success": False, "message": "评论不存在"}
    return {"success": True, "message": "评论已删除"}


@router.get("/stats")
async def comment_stats(_=Depends(get_current_admin)):
    col = get_comments_collection()
    return {
        "success": True,
        "data": {
            "total": col.count_documents({}),
            "approved": col.count_documents({"status": "approved"}),
            "pending": col.count_documents({"status": "pending"}),
            "hidden": col.count_documents({"status": "hidden"}),
        },
    }
