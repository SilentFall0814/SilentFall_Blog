import os
import json
import time
import yaml
import shutil
from fastapi import APIRouter, Request, Body, Depends
from datetime import datetime
import re
import markdown  # 确保你已经安装了 markdown 库 (pip install markdown)
from markdownify import markdownify as md
from cms_core.database import get_comments_collection
from cms_core.security import get_current_admin, sanitize_payload
from cms_core.path_utils import read_target_blog_path

router = APIRouter()

# 🌟 终极物理锁死防线：绝对定位到 my-blog-manager 根目录，无视任何全局目录切换！
CURRENT_API_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(CURRENT_API_DIR, "..", ".."))

def _sync_delete_to_blog(file_path: str, relative_path: str):
    """
    当管理端删除文章后，同步删除博客用户端的对应文件
    :param file_path: 管理端已删除的文件路径（用于日志）
    :param relative_path: 相对于项目根目录的路径（如 posts/xxx.md）
    """
    blog_path = read_target_blog_path()
    if not blog_path:
        print(f"[同步删除] 未配置目标博客路径，跳过同步")
        return False

    target_file = os.path.join(blog_path, relative_path)
    if os.path.exists(target_file):
        try:
            os.remove(target_file)
            print(f"[同步删除] 已同步删除博客端文件: {target_file}")
            return True
        except Exception as e:
            print(f"[同步删除] 删除博客端文件失败: {str(e)}")
            return False
    else:
        print(f"[同步删除] 博客端文件不存在: {target_file}")
        return False


def get_manager_drafts_dir() -> str:
    # 🌟 修复：用 PROJECT_ROOT 替换 os.getcwd()
    drafts_dir = os.path.join(PROJECT_ROOT, "manager_data", "drafts")
    if not os.path.exists(drafts_dir):
        os.makedirs(drafts_dir)
    return drafts_dir


@router.post("/save")
async def save_draft(request: Request, _=Depends(get_current_admin)):
    """保存草稿（需管理员权限）"""
    try:
        raw_payload = await request.json()
    except Exception:
        return {"success": False, "message": "后端无法解析传来的 JSON 数据"}

    # 🌟 安全：净化输入，保留富文本 content 字段的结构
    payload = sanitize_payload(
        raw_payload,
        safe_keys={"content", "description"},
    )

    drafts_dir = get_manager_drafts_dir()
    draft_id = payload.get("id")

    if not draft_id or draft_id == 'new':
        draft_id = f"draft_{int(time.time() * 1000)}"
    elif payload.get("type") == "about":
        draft_id = "about"

    draft_data = {
        "id": draft_id,
        "type": payload.get("type", "post"),
        "title": payload.get("title", ""),
        "description": payload.get("description", ""),
        "content": payload.get("content", ""),
        "cover": payload.get("cover", ""),
        "tags": payload.get("tags", []),
        "mood": payload.get("mood", ""),
        "date": payload.get("date", ""),
        "lastModified": int(time.time() * 1000)
    }

    file_path = os.path.join(drafts_dir, f"{draft_id}.json")
    try:
        with open(file_path, "w", encoding="utf-8") as f:
            json.dump(draft_data, f, ensure_ascii=False, indent=2)
        return {"success": True, "message": "草稿已安全落盘", "id": draft_id}
    except Exception as e:
        return {"success": False, "message": f"草稿保存失败: {str(e)}"}


@router.post("/list")
async def list_drafts(request: Request, _=Depends(get_current_admin)):
    """列出草稿（需管理员权限）"""
    drafts_dir = get_manager_drafts_dir()
    drafts = []
    if not os.path.exists(drafts_dir):
        return {"success": True, "drafts": []}

    for filename in os.listdir(drafts_dir):
        if filename.endswith(".json"):
            file_path = os.path.join(drafts_dir, filename)
            try:
                with open(file_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    content = data.get("content", "")
                    data["contentPreview"] = content[:100] if content else ""
                    if "content" in data: del data["content"]
                    drafts.append(data)
            except Exception:
                continue
    drafts.sort(key=lambda x: x.get("lastModified", 0), reverse=True)
    return {"success": True, "drafts": drafts}


@router.post("/get")
async def get_draft(request: Request, _=Depends(get_current_admin)):
    """获取单个草稿（需管理员权限）"""
    try:
        payload = await request.json()
    except Exception:
        return {"success": False, "message": "JSON 解析失败"}

    raw_id = payload.get("id", "").replace(".md", "")
    doc_type = payload.get("type", "post")
    # 🌟 修复：用 PROJECT_ROOT 替换 os.getcwd()
    base_dir = PROJECT_ROOT
    drafts_dir = get_manager_drafts_dir()

    # 1. 优先从草稿箱读取 JSON
    file_path = os.path.join(drafts_dir, f"{raw_id}.json")
    if os.path.exists(file_path):
        with open(file_path, "r", encoding="utf-8") as f:
            return {"success": True, "draft": json.load(f)}

    # 2. 如果没有草稿，从物理 MD 文件读取并解析
    target_md = None
    if raw_id == "about" or doc_type == "about":
        target_md = os.path.join(base_dir, "app", "about", "about.md")
    elif doc_type == "milestone":
        target_md = os.path.join(base_dir, "milestones", f"{raw_id}.md")
    else:
        folder = "posts"
        target_md = os.path.join(base_dir, folder, f"{raw_id}.md")

    if target_md and os.path.exists(target_md):
        try:
            with open(target_md, "r", encoding="utf-8") as f:
                raw_content = f.read()

            title, cover, description, mood, date = "", "", "", "", ""
            tags = []
            md_body = raw_content

            # 🌟 拆解 YAML Front Matter
            if raw_content.strip().startswith("---"):
                parts = raw_content.split("---", 2)
                if len(parts) >= 3:
                    try:
                        fm = yaml.safe_load(parts[1])
                        if fm:
                            title = fm.get("title", "")
                            cover = fm.get("cover", "")
                            description = fm.get("description", "")
                            mood = fm.get("mood", "")
                            date = fm.get("date", "")
                            tags = fm.get("tags", [])
                            if not isinstance(tags, list): tags = [tags] if tags else []
                        md_body = parts[2].strip()
                    except:
                        pass

            # 🌟 将 Markdown 转换为编辑器认识的 HTML
            html_content = markdown.markdown(md_body, extensions=['fenced_code', 'tables', 'nl2br'])

            draft_data = {
                "id": raw_id,
                "type": doc_type,
                "title": title or ("关于我" if doc_type == "about" else ""),
                "content": html_content,
                "tags": tags,
                "cover": cover,
                "description": description,
                "mood": mood,
                "date": date
            }
            return {"success": True, "draft": draft_data}
        except Exception as e:
            return {"success": False, "message": f"解析物理文件失败: {str(e)}"}

    return {"success": False, "message": "未找到相关文件"}


@router.post("/delete")
async def delete_draft(request: Request, _=Depends(get_current_admin)):
    """删除草稿/文章（需管理员权限）"""
    try:
        payload = await request.json()
    except Exception:
        return {"success": False, "message": "JSON 解析失败"}

    raw_id = payload.get("id", "").replace(".md", "").replace(".json", "")
    doc_title = payload.get("title", "")
    # 🌟 修复：用 PROJECT_ROOT 替换 os.getcwd()
    base_dir = PROJECT_ROOT
    drafts_dir = get_manager_drafts_dir()

    possible_paths = [
        (os.path.join(drafts_dir, f"{raw_id}.json"), None),  # 草稿文件不需要同步到博客
        (os.path.join(base_dir, "posts", f"{raw_id}.md"), "posts"),
        (os.path.join(base_dir, "milestones", f"{raw_id}.md"), "milestones")
    ]

    deleted_count = 0
    deleted_page_id = raw_id  # 默认用原始 ID 清理评论
    deleted_relative_paths = []  # 记录已删除的相对路径，用于同步到博客

    for p, dir_name in possible_paths:
        if os.path.exists(p):
            try:
                os.remove(p)
                deleted_count += 1
                deleted_page_id = raw_id
                # 记录需要同步删除的博客端路径
                if dir_name:
                    deleted_relative_paths.append(f"{dir_name}/{os.path.basename(p)}")
            except:
                continue

    # 如果没找到精确匹配的文件，尝试通过标题匹配扫描 posts 和 milestones 目录
    if deleted_count == 0 and doc_title:
        for scan_dir_name in ["posts", "milestones"]:
            scan_dir = os.path.join(base_dir, scan_dir_name)
            if not os.path.exists(scan_dir):
                continue
            for filename in os.listdir(scan_dir):
                if filename.endswith(".md"):
                    # 检查文件内容中的标题是否匹配
                    file_path = os.path.join(scan_dir, filename)
                    try:
                        with open(file_path, "r", encoding="utf-8") as f:
                            content = f.read()
                        # 解析 YAML front matter 提取标题
                        if content.strip().startswith("---"):
                            parts = content.split("---", 2)
                            if len(parts) >= 3:
                                import yaml
                                fm = yaml.safe_load(parts[1])
                                if fm and fm.get("title") == doc_title:
                                    os.remove(file_path)
                                    deleted_count += 1
                                    deleted_page_id = filename.replace(".md", "")
                                    deleted_relative_paths.append(f"{scan_dir_name}/{filename}")
                                    break
                    except:
                        continue

    # 🌟 同步删除博客用户端的对应文件
    for rel_path in deleted_relative_paths:
        _sync_delete_to_blog("", rel_path)

    # 清理关联评论
    if deleted_count > 0:
        try:
            comments_coll = get_comments_collection()
            delete_result = comments_coll.delete_many({"page_id": f"/posts/{deleted_page_id}"})
            print(f"[评论清理] 已自动删除 {delete_result.deleted_count} 条关联评论 (PageID: {deleted_page_id})")
        except Exception as ce:
            print(f"[评论清理失败] {str(ce)}")

        return {"success": True, "message": "已彻底销毁相关文件"}
    return {"success": False, "message": "未找到相关文件"}


@router.post("/sync_local")
async def sync_local_operations(request: Request, _=Depends(get_current_admin)):
    """发布/同步操作（需管理员权限）"""
    payload = await request.json()
    operations = payload.get("operations", [])
    # 🌟 修复：用 PROJECT_ROOT 替换 os.getcwd()
    base_dir = PROJECT_ROOT
    drafts_dir = get_manager_drafts_dir()
    results = []

    for op in operations:
        if op.get("type") == "publish_article":
            data = op.get("payload") or op.get("value", {})
            doc_type = data.get("type", "post")
            doc_id = data.get("id") or ""

            final_id = doc_id
            if not final_id or final_id == 'new':
                final_id = f"{doc_type}_{int(time.time())}"

            # ==========================================
            # 🌟 核心防吞空行逻辑：在给 markdownify 之前拦截处理 HTML
            # ==========================================
            raw_html = data.get("content", "")

            # 1. 拦截前端发来的带有全角空格的空段落，或者原生空段落
            # 我们直接把它们替换成带有 HTML 换行符的强硬结构
            raw_html = re.sub(r'<p>&#12288;<\/p>', '<br><br>', raw_html)
            raw_html = re.sub(r'<p><\/p>', '<br><br>', raw_html)

            # 2. 调用 markdownify 进行基础转换，保留 img
            # 强制让它保留 br 标签！
            md_content = md(raw_html, heading_style="ATX", keep=['img', 'br'])

            # 3. 转换完毕后，markdownify 可能会把 <br> 留下来，
            # 为了在 MD 中形成真实的空行，我们把保留下来的 <br> 或者 <br/> 全部替换为纯粹的 \n\n
            md_content = re.sub(r'<br\s*\/?>', '\n\n', md_content)
            # ==========================================

            # 🌟 处理日期与精确时间
            input_date = str(data.get("date", "")).strip()
            if input_date:
                # 如果前端只传了 "YYYY-MM-DD" (长度 <= 10)，帮它补上现在的时分秒
                if len(input_date) <= 10:
                    current_time = datetime.now().strftime("%H:%M:%S")
                    final_date = f"{input_date} {current_time}"
                else:
                    final_date = input_date
            else:
                # 如果没传，生成完整的当前时间
                final_date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

            fm = {
                "title": data.get("title", ""),
                "date": final_date,
                "tags": data.get("tags", []),
                "mood": data.get("mood", ""),
                "cover": data.get("cover", ""),
                "description": data.get("description", "")
            }
            final_text = f"---\n{yaml.dump(fm, allow_unicode=True, sort_keys=False)}---\n\n{md_content}"

            # 生成文件名：用标题作为文件名，去除非法字符
            def make_filename(title_str):
                """将标题转换为合法的文件名"""
                if not title_str:
                    return f"{doc_type}_{int(time.time())}"
                # 移除文件名中的非法字符
                illegal_chars = r'[\\/:*?"<>|]'
                name = re.sub(illegal_chars, "", title_str)
                # 去除首尾空格
                name = name.strip()
                # 限制长度，避免文件名过长
                if len(name) > 50:
                    name = name[:50]
                return name if name else f"{doc_type}_{int(time.time())}"

            if doc_type == "about":
                save_path = os.path.join(base_dir, "app", "about", "about.md")
            elif doc_type == "milestone":
                filename = make_filename(fm["title"])
                save_path = os.path.join(base_dir, "milestones", f"{filename}.md")
            else:
                folder = "posts"
                filename = make_filename(fm["title"])
                save_path = os.path.join(base_dir, folder, f"{filename}.md")

            os.makedirs(os.path.dirname(save_path), exist_ok=True)
            with open(save_path, "w", encoding="utf-8") as f:
                f.write(final_text)

            draft_path = os.path.join(drafts_dir, f"{doc_id}.json") if doc_id else ""
            if draft_path and os.path.exists(draft_path):
                try:
                    os.remove(draft_path)
                except:
                    pass

            results.append(f"✅ 已发布: {fm['title']}")

    return {"success": True, "message": "\n".join(results)}


@router.get("/all_tags")
async def get_all_historical_tags():
    # 🌟 修复：用 PROJECT_ROOT 替换 os.getcwd()
    base_dir = PROJECT_ROOT
    scan_dirs = {"post": os.path.join(base_dir, "posts")}
    tag_collections = {"post": set()}
    fm_regex = re.compile(r'---\s*\n(.*?)\n---\s*', re.DOTALL)

    for doc_type, dir_path in scan_dirs.items():
        if not os.path.exists(dir_path): continue
        for filename in os.listdir(dir_path):
            if filename.endswith(".md"):
                try:
                    with open(os.path.join(dir_path, filename), "r", encoding="utf-8") as f:
                        match = fm_regex.search(f.read())
                        if match:
                            fm = yaml.safe_load(match.group(1))
                            if fm and "tags" in fm:
                                for t in (fm["tags"] if isinstance(fm["tags"], list) else [fm["tags"]]):
                                    tag_collections[doc_type].add(str(t))
                except:
                    continue
    return {"success": True, "postTags": sorted(list(tag_collections["post"])),
            "chatterTags": []}
