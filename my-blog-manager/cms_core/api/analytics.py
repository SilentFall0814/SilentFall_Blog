from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Request
from cms_core.database import get_comments_collection, get_guest_moments_collection, get_db

router = APIRouter()


def _safe_count(collection, query=None):
    """安全计数，集合不存在时返回0"""
    try:
        if query:
            return collection.count_documents(query)
        return collection.count_documents({})
    except Exception:
        return 0


def _safe_aggregate(collection, pipeline):
    """安全聚合，集合不存在时返回空列表"""
    try:
        return list(collection.aggregate(pipeline))
    except Exception:
        return []


def _safe_distinct(collection, field, query=None):
    """安全去重查询"""
    try:
        if query:
            return collection.distinct(field, query)
        return collection.distinct(field)
    except Exception:
        return []


@router.get("/overview")
async def get_overview(request: Request):
    """获取博客运行概览数据：PV、UV、评论数、说说数等"""
    db = get_db()
    comments_col = get_comments_collection()
    moments_col = get_guest_moments_collection()

    comments_count = _safe_count(comments_col, {"status": "approved"})
    pending_comments = _safe_count(comments_col, {"status": "pending"})
    guest_moments_count = _safe_count(moments_col, {"status": "approved"})
    pending_moments = _safe_count(moments_col, {"status": "pending"})

    page_views_col = db["page_views"]
    total_pv = _safe_count(page_views_col)
    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    today_pv = _safe_count(page_views_col, {"timestamp": {"$gte": today}})

    unique_visitors_col = db["unique_visitors"]
    total_uv = _safe_count(unique_visitors_col)
    today_uv = _safe_count(unique_visitors_col, {"date": today.strftime("%Y-%m-%d")})

    return {
        "success": True,
        "data": {
            "total_pv": total_pv,
            "total_uv": total_uv,
            "today_pv": today_pv,
            "today_uv": today_uv,
            "comments_count": comments_count,
            "pending_comments": pending_comments,
            "guest_moments_count": guest_moments_count,
            "pending_moments": pending_moments,
        },
    }


@router.get("/trend")
async def get_trend(days: int = 14):
    """获取近N天的访问趋势数据"""
    db = get_db()
    page_views_col = db["page_views"]
    unique_visitors_col = db["unique_visitors"]

    now = datetime.now(timezone.utc)
    trend = []

    for i in range(days - 1, -1, -1):
        date = (now - timedelta(days=i)).strftime("%Y-%m-%d")
        day_start = datetime.strptime(date, "%Y-%m-%d").replace(tzinfo=timezone.utc)
        day_end = day_start + timedelta(days=1)

        pv = _safe_count(page_views_col, {"timestamp": {"$gte": day_start, "$lt": day_end}})
        uv = _safe_count(unique_visitors_col, {"date": date})

        trend.append({
            "date": date,
            "pv": pv,
            "uv": uv,
        })

    return {"success": True, "data": trend}


@router.get("/ip_locations")
async def get_ip_locations():
    """获取访问IP归属地统计"""
    db = get_db()
    page_views_col = db["page_views"]

    pipeline = [
        {"$match": {"location": {"$ne": None, "$ne": ""}}},
        {"$group": {"_id": "$location", "count": {"$sum": 1}}},
        {"$sort": {"count": -1}},
        {"$limit": 10},
    ]

    results = _safe_aggregate(page_views_col, pipeline)
    locations = [{"city": r["_id"], "count": r["count"]} for r in results]

    return {"success": True, "data": locations}


@router.get("/online")
async def get_online_count():
    """获取当前在线人数（基于最近5分钟活跃记录）"""
    db = get_db()
    page_views_col = db["page_views"]

    five_min_ago = datetime.now(timezone.utc) - timedelta(minutes=5)
    online = len(_safe_distinct(page_views_col, "ip", {"timestamp": {"$gte": five_min_ago}}))

    return {"success": True, "data": {"online": online}}


@router.post("/record")
async def record_visit(request: Request):
    """记录一次页面访问"""
    body = await request.json()
    page_id = body.get("page_id", "/")
    ip = request.client.host if request.client else ""
    user_agent = request.headers.get("user-agent", "")

    db = get_db()
    now = datetime.now(timezone.utc)

    page_views_col = db["page_views"]
    try:
        page_views_col.insert_one({
            "page_id": page_id,
            "ip": ip,
            "user_agent": user_agent,
            "location": "",
            "timestamp": now,
        })
    except Exception:
        pass

    unique_visitors_col = db["unique_visitors"]
    today = now.strftime("%Y-%m-%d")
    try:
        unique_visitors_col.update_one(
            {"ip": ip, "date": today},
            {"$setOnInsert": {"ip": ip, "date": today, "first_visit": now}},
            upsert=True,
        )
    except Exception:
        pass

    return {"success": True}


@router.get("/latency")
async def measure_latency():
    """测量服务器响应延迟"""
    import time
    start = time.time()
    try:
        db = get_db()
        db.command("ping")
    except Exception:
        pass
    elapsed = int((time.time() - start) * 1000)
    return {"success": True, "data": {"latency_ms": elapsed}}
