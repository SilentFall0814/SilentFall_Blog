from datetime import datetime, timedelta, timezone
import json
import re
from fastapi import APIRouter, Request, Depends
from cms_core.database import get_comments_collection, get_guest_moments_collection, get_db
from cms_core.security import get_current_admin, sanitize_payload, sanitize_nosql_field
import urllib.request
import urllib.error

router = APIRouter()

# 缓存：避免重复查询同一 IP
_ip_cache: dict = {}


def _ip_to_location(ip: str) -> dict:
    """
    将 IP 地址解析为地理位置（国家、省份、城市）。
    使用淘宝免费 IP 定位 API（无需 Key，国内稳定）。
    """
    # 排除内网 IP
    if not ip or ip.startswith("127.") or ip.startswith("192.168.") or ip.startswith("10.") or ip.startswith("172."):
        return {"country": "内网", "province": "", "city": ""}

    # 缓存命中
    if ip in _ip_cache:
        return _ip_cache[ip]

    try:
        url = f"https://ip.taobao.com/outGetIpInfo?ip={ip}&accessKey=alibaba-inc"
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        with urllib.request.urlopen(req, timeout=2) as resp:
            data = json.loads(resp.read().decode("utf-8"))

        if data.get("code") == 0 and data.get("data"):
            d = data["data"]
            result = {
                "country": d.get("country", ""),
                "province": d.get("region", ""),
                "city": d.get("city", ""),
            }
            _ip_cache[ip] = result
            return result
    except Exception:
        pass

    return {"country": "", "province": "", "city": ""}


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

    # 统计文章总数（从 drafts 集合获取已发布文章数）
    drafts_col = db["drafts"]
    total_article_count = _safe_count(drafts_col, {"status": "published"}) if drafts_col is not None else 0

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
            "total_article_count": total_article_count,
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
    """记录一次页面访问（自动解析 IP 地理位置）"""
    raw_payload = await request.json()
    payload = sanitize_payload(raw_payload)
    page_id = sanitize_nosql_field(payload.get("page_id", "/"), max_length=500)
    page_title = sanitize_nosql_field(payload.get("page_title", ""), max_length=500)
    ip = request.client.host if request.client else ""
    user_agent = request.headers.get("user-agent", "")

    db = get_db()
    now = datetime.now(timezone.utc)

    # 解析 IP 地理位置
    location_info = _ip_to_location(ip)
    country = location_info["country"]
    province = location_info["province"]
    city = location_info["city"]

    # 组合城市字符串作为 location
    location_str = city if city else (province if province else country)

    # 1. 记录页面浏览
    page_views_col = db["page_views"]
    try:
        page_views_col.insert_one({
            "page_id": page_id,
            "page_title": page_title,
            "ip": ip,
            "user_agent": user_agent,
            "location": location_str,
            "country": country,
            "province": province,
            "city": city,
            "timestamp": now,
        })
    except Exception:
        pass

    # 2. 维护访客集合（新增或更新 last_visit 和地理信息）
    unique_visitors_col = db["unique_visitors"]
    today = now.strftime("%Y-%m-%d")
    try:
        unique_visitors_col.update_one(
            {"ip": ip, "date": today},
            {
                "$setOnInsert": {
                    "ip": ip,
                    "date": today,
                    "first_visit": now,
                    "country": country,
                    "province": province,
                    "city": city,
                    "isBlocked": False,
                },
                "$set": {
                    "last_visit": now,
                    "country": country,
                    "province": province,
                    "city": city,
                },
            },
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


@router.get("/article_top10")
async def get_article_top10():
    """获取文章阅读量 TOP10（按 page_id 聚合浏览量）"""
    db = get_db()
    page_views_col = db["page_views"]

    pipeline = [
        {"$match": {"page_id": {"$ne": None, "$ne": ""}}},
        {"$group": {"_id": "$page_id", "viewCount": {"$sum": 1}}},
        {"$sort": {"viewCount": -1}},
        {"$limit": 10},
    ]

    results = _safe_aggregate(page_views_col, pipeline)

    # 尝试从 drafts 集合获取文章标题
    drafts_col = db["drafts"]
    articles_map = {}
    try:
        for doc in drafts_col.find({"status": "published"}, {"slug": 1, "title": 1}):
            if doc.get("slug"):
                articles_map[doc["slug"]] = doc.get("title", doc["slug"])
    except Exception:
        pass

    items = []
    for r in results:
        page_id = r["_id"]
        # 尝试匹配文章标题，否则用 page_id 作为标题
        title = articles_map.get(page_id, page_id)
        items.append({"title": title, "viewCount": r["viewCount"]})

    return {"success": True, "data": items}


@router.get("/province_distribution")
async def get_province_distribution():
    """获取访客省份分布（按 province 字段聚合，兜底用 location，再兜底用 IP）"""
    db = get_db()
    page_views_col = db["page_views"]

    # 优先按 province 字段聚合
    pipeline = [
        {"$match": {"province": {"$ne": None, "$ne": ""}}},
        {"$group": {"_id": "$province", "value": {"$sum": 1}}},
        {"$sort": {"value": -1}},
        {"$limit": 10},
    ]

    results = _safe_aggregate(page_views_col, pipeline)
    items = [{"name": r["_id"], "value": r["value"]} for r in results]

    # 兜底：按 location 聚合
    if not items:
        loc_pipeline = [
            {"$match": {"location": {"$ne": None, "$ne": ""}}},
            {"$group": {"_id": "$location", "value": {"$sum": 1}}},
            {"$sort": {"value": -1}},
            {"$limit": 10},
        ]
        loc_results = _safe_aggregate(page_views_col, loc_pipeline)
        items = [{"name": r["_id"], "value": r["value"]} for r in loc_results]

    # 最终兜底：按 IP 聚合
    if not items:
        ip_pipeline = [
            {"$group": {"_id": "$ip", "value": {"$sum": 1}}},
            {"$sort": {"value": -1}},
            {"$limit": 10},
        ]
        ip_results = _safe_aggregate(page_views_col, ip_pipeline)
        items = [{"name": f"IP: {r['_id']}", "value": r["value"]} for r in ip_results]

    return {"success": True, "data": items}


@router.get("/visitors")
async def get_visitors(
    request: Request,
    page: int = 1,
    pageSize: int = 15,
    country: str = "",
    province: str = "",
    city: str = "",
    status: str = "",
):
    """分页获取访客列表"""
    db = get_db()
    unique_visitors_col = db["unique_visitors"]
    page_views_col = db["page_views"]

    # 构建查询条件
    query = {}
    if country:
        query["country"] = {"$regex": country, "$options": "i"}
    if province:
        query["province"] = {"$regex": province, "$options": "i"}
    if city:
        query["city"] = {"$regex": city, "$options": "i"}
    if status == "1":
        query["isBlocked"] = True
    elif status == "0":
        query["isBlocked"] = {"$ne": True}

    try:
        total = unique_visitors_col.count_documents(query)
    except Exception:
        total = 0

    skip = (page - 1) * pageSize
    try:
        docs = list(unique_visitors_col.find(query).sort("first_visit", -1).skip(skip).limit(pageSize))
    except Exception:
        docs = []

    records = []
    for doc in docs:
        ip = doc.get("ip", "")
        # 统计该 IP 的总浏览次数
        try:
            total_views = page_views_col.count_documents({"ip": ip})
        except Exception:
            total_views = 0

        records.append({
            "id": str(doc.get("_id", "")),
            "ip": ip,
            "country": doc.get("country", ""),
            "province": doc.get("province", ""),
            "city": doc.get("city", ""),
            "totalViews": total_views,
            "isBlocked": doc.get("isBlocked", False),
            "firstVisitTime": doc.get("first_visit", "").isoformat() if isinstance(doc.get("first_visit"), datetime) else str(doc.get("first_visit", "")),
            "lastVisitTime": doc.get("last_visit", "").isoformat() if isinstance(doc.get("last_visit"), datetime) else str(doc.get("last_visit", "")),
            "expiresAt": doc.get("expires_at", "").isoformat() if isinstance(doc.get("expires_at"), datetime) else str(doc.get("expires_at", "")) if doc.get("expires_at") else None,
        })

    return {"success": True, "data": {"records": records, "total": total}}


@router.put("/visitors/block")
async def block_visitors(request: Request, _=Depends(get_current_admin)):
    """封禁访客"""
    raw_payload = await request.json()
    payload = sanitize_payload(raw_payload)
    ids = payload.get("ids", [])

    db = get_db()
    unique_visitors_col = db["unique_visitors"]
    from bson import ObjectId

    try:
        for vid in ids:
            clean_id = sanitize_nosql_field(str(vid), max_length=50)
            if not ObjectId.is_valid(clean_id):
                continue
            unique_visitors_col.update_one(
                {"_id": ObjectId(clean_id)},
                {"$set": {"isBlocked": True, "blocked_at": datetime.now(timezone.utc)}},
            )
    except Exception:
        pass

    return {"success": True, "message": "封禁成功"}


@router.put("/visitors/unblock")
async def unblock_visitors(request: Request, _=Depends(get_current_admin)):
    """解封访客"""
    raw_payload = await request.json()
    payload = sanitize_payload(raw_payload)
    ids = payload.get("ids", [])

    db = get_db()
    unique_visitors_col = db["unique_visitors"]
    from bson import ObjectId

    try:
        for vid in ids:
            clean_id = sanitize_nosql_field(str(vid), max_length=50)
            if not ObjectId.is_valid(clean_id):
                continue
            unique_visitors_col.update_one(
                {"_id": ObjectId(clean_id)},
                {"$set": {"isBlocked": False, "unblocked_at": datetime.now(timezone.utc)}},
            )
    except Exception:
        pass

    return {"success": True, "message": "解封成功"}


@router.get("/view-records")
async def get_view_records(
    request: Request,
    page: int = 1,
    pageSize: int = 15,
    pagePath: str = "",
    visitorId: str = "",
):
    """分页获取浏览记录（带智能标题解析和去重过滤）"""
    db = get_db()
    page_views_col = db["page_views"]

    # 构建查询条件
    query = {}
    if pagePath:
        query["page_id"] = {"$regex": pagePath, "$options": "i"}
    if visitorId:
        query["ip"] = {"$regex": visitorId, "$options": "i"}

    try:
        total = page_views_col.count_documents(query)
    except Exception:
        total = 0

    # 获取更多数据用于去重（因为去重后会减少数量）
    fetch_limit = pageSize * 3  # 获取3倍数据，确保去重后仍有足够记录
    try:
        docs = list(page_views_col.find(query).sort("timestamp", -1).limit(fetch_limit))
    except Exception:
        docs = []

    # 页面路径到标题的映射表（常见页面）
    PAGE_TITLE_MAP = {
        "/": "首页",
        "/posts": "文章列表",
        "/moments": "说说",
        "/friends": "友链",
        "/about": "关于",
        "/projects": "项目",
        "/steam": "Steam",
        "/photowall": "照片墙",
        "/music": "音乐",
        "/timeline": "归档",
        "/admin/review": "审核区",
        "/admin/announcements": "公告",
        "/admin/analytics": "监控",
        "/admin/visitors": "访客",
        "/admin/view-records": "访问记录",
        "/settings": "设置",
    }

    # 构建文章 slug 到标题的映射（从 MongoDB）
    drafts_col = db["drafts"]
    articles_map = {}
    try:
        for doc in drafts_col.find({"status": "published"}, {"slug": 1, "title": 1}):
            if doc.get("slug"):
                articles_map[doc["slug"]] = doc.get("title", doc["slug"])
    except Exception:
        pass

    # 从本地 MD 文件读取文章标题（补充 MongoDB 中可能缺失的文章）
    import os
    import re
    # analytics.py 路径: my-blog-manager/cms_core/api/analytics.py
    # posts 目录路径: my-blog-manager/posts/
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    posts_dir = os.path.join(base_dir, "posts")
    if os.path.exists(posts_dir):
        for filename in os.listdir(posts_dir):
            if filename.endswith(".md"):
                slug = filename[:-3]  # 移除 .md 后缀
                if slug not in articles_map:  # 只补充 MongoDB 中没有的文章
                    try:
                        with open(os.path.join(posts_dir, filename), "r", encoding="utf-8") as f:
                            content = f.read()
                        # 从 frontmatter 中提取 title
                        title_match = re.search(r'^title:\s*[\'"]?(.+?)[\'"]?\s*$', content, re.MULTILINE)
                        if title_match:
                            articles_map[slug] = title_match.group(1).strip()
                    except Exception:
                        pass

    # 去重策略：同一IP在短时间内（60秒）访问同一页面，只保留最新的一条
    DEDUP_WINDOW_SECONDS = 60
    seen_keys = {}  # key: (ip, page_id) -> 最新记录
    
    for doc in docs:
        ip = doc.get("ip", "")
        page_id = doc.get("page_id", "")
        timestamp = doc.get("timestamp", datetime.now(timezone.utc))
        
        dedup_key = (ip, page_id)
        if dedup_key not in seen_keys:
            seen_keys[dedup_key] = doc
        else:
            # 保留时间更新的记录
            existing_ts = seen_keys[dedup_key].get("timestamp", datetime.min.replace(tzinfo=timezone.utc))
            if timestamp > existing_ts:
                seen_keys[dedup_key] = doc
    
    # 按时间排序并分页
    deduped_docs = sorted(seen_keys.values(), key=lambda x: x.get("timestamp", datetime.min.replace(tzinfo=timezone.utc)), reverse=True)
    
    # 分页
    skip = (page - 1) * pageSize
    paged_docs = deduped_docs[skip:skip + pageSize]

    def get_visit_type_and_title(page_id: str, stored_title: str) -> tuple:
        """获取访问类型和标题"""
        # 尝试匹配文章页面（/posts/xxx 或 /posts/xxx/）
        if page_id.startswith("/posts/"):
            slug = page_id.strip("/").split("/")[-1]
            # 优先使用文章映射表
            title = articles_map.get(slug, slug)
            return "访问文章", title
        
        # 尝试匹配说说页面（/moments/xxx）
        if page_id.startswith("/moments/"):
            moment_id = page_id.strip("/").split("/")[-1]
            return "访问说说", moment_id
        
        # 尝试匹配常见页面
        clean_path = page_id if page_id == "/" else page_id.rstrip("/")
        if clean_path in PAGE_TITLE_MAP:
            page_name = PAGE_TITLE_MAP[clean_path]
            return "访问页面", page_name
        
        # 使用存储的标题（如果有意义）
        if stored_title and stored_title != page_id:
            return "访问页面", stored_title
        
        # 兜底：返回路径
        return "访问页面", page_id

    records = []
    for doc in paged_docs:
        page_id = doc.get("page_id", "")
        stored_title = doc.get("page_title", "")
        visit_type, title = get_visit_type_and_title(page_id, stored_title)
        
        # 组合显示：访问类型 + 标题
        display_title = f"{visit_type}：{title}"
        
        records.append({
            "id": str(doc.get("_id", "")),
            "pageTitle": display_title,
            "pagePath": page_id,
            "ipAddress": doc.get("ip", ""),
            "referer": doc.get("referer", ""),
            "viewTime": doc.get("timestamp", "").isoformat() if isinstance(doc.get("timestamp"), datetime) else str(doc.get("timestamp", "")),
        })

    return {"success": True, "data": {"records": records, "total": len(deduped_docs)}}


@router.delete("/view-records")
async def delete_view_records(request: Request, _=Depends(get_current_admin)):
    """删除浏览记录（根据去重策略，删除同一IP+同一页面的所有关联记录）"""
    raw_payload = await request.json()
    payload = sanitize_payload(raw_payload)
    ids = payload.get("ids", [])

    if not ids:
        return {"success": False, "message": "未指定要删除的记录"}

    db = get_db()
    page_views_col = db["page_views"]
    from bson import ObjectId

    try:
        # 先根据传入的 ids 找到对应的记录，获取它们的 (ip, page_id)
        clean_ids = [sanitize_nosql_field(str(vid), max_length=50) for vid in ids]
        valid_ids = [ObjectId(cid) for cid in clean_ids if ObjectId.is_valid(cid)]
        if not valid_ids:
            return {"success": False, "message": "无效的记录 ID"}
        source_docs = list(page_views_col.find({"_id": {"$in": valid_ids}}, {"ip": 1, "page_id": 1}))

        if not source_docs:
            return {"success": False, "message": "未找到要删除的记录，可能已被删除"}

        # 收集所有需要删除的 (ip, page_id) 组合
        dedup_keys = set()
        for doc in source_docs:
            dedup_keys.add((doc.get("ip", ""), doc.get("page_id", "")))

        # 构建删除条件：删除所有同组记录
        delete_conditions = []
        for ip, page_id in dedup_keys:
            delete_conditions.append({"ip": ip, "page_id": page_id})

        result = page_views_col.delete_many({"$or": delete_conditions})
        print(f"[删除访问记录] 删除 {len(source_docs)} 条源记录对应的 {len(dedup_keys)} 个去重组，实际删除 {result.deleted_count} 条数据库记录")

        if result.deleted_count == 0:
            return {"success": False, "message": "未找到要删除的记录，可能已被删除"}

        return {"success": True, "message": f"已删除 {result.deleted_count} 条记录（含关联记录）", "deletedCount": result.deleted_count}
    except Exception as e:
        print(f"[删除访问记录失败] {str(e)}")
        return {"success": False, "message": f"删除失败: {str(e)}"}
