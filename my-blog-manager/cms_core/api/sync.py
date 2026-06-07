import os
import shutil
import json
import time
import re
import yaml
import markdown
from markdownify import markdownify as md
from datetime import datetime
from fastapi import APIRouter, Request

router = APIRouter()

CURRENT_API_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(CURRENT_API_DIR, "..", ".."))

SYNC_DIRS = ["posts", "moments", "milestones", "public/uploads"]
SYNC_FILES = [
    "app/about/about.md",
    "data/albums.ts",
    "data/friends.ts",
    "data/projects.ts",
    "data/steam.ts",
    "siteConfig.ts"
]

DEPLOY_CONFIG_PATH = os.path.join(PROJECT_ROOT, "data", "deploy_config.json")


def _read_blog_path() -> str:
    if os.path.exists(DEPLOY_CONFIG_PATH):
        try:
            with open(DEPLOY_CONFIG_PATH, "r", encoding="utf-8-sig") as f:
                cfg = json.load(f)
            return cfg.get("blogPath", "")
        except Exception:
            pass
    return ""


def _get_drafts_dir() -> str:
    drafts_dir = os.path.join(PROJECT_ROOT, "manager_data", "drafts")
    if not os.path.exists(drafts_dir):
        os.makedirs(drafts_dir)
    return drafts_dir


# ========== 本地同步辅助函数（从各 API 模块提取的核心逻辑） ==========

def _update_config_local(updates: dict):
    """更新 siteConfig.ts 配置"""
    config_path = os.path.join(PROJECT_ROOT, "siteConfig.ts")
    if not os.path.exists(config_path):
        raise FileNotFoundError("未找到 siteConfig.ts")

    with open(config_path, "r", encoding="utf-8") as f:
        content = f.read()

    for key, value in updates.items():
        if isinstance(value, str):
            val_str = json.dumps(value, ensure_ascii=False)
        elif isinstance(value, bool):
            val_str = str(value).lower()
        elif isinstance(value, dict):
            val_str = json.dumps(value, ensure_ascii=False)
        else:
            val_str = json.dumps(value, ensure_ascii=False)

        if isinstance(value, dict):
            pattern = rf"({key}\s*:\s*)\{{[\s\S]*?\}}"
        elif isinstance(value, list):
            pattern = rf"({key}\s*:\s*)\[[\s\S]*?\]"
        else:
            pattern = rf"({key}\s*:\s*)(['\"`][\s\S]*?['\"`]|true|false|\d+)"

        if re.search(pattern, content):
            content = re.sub(pattern, lambda m: m.group(1) + val_str, content, count=1)

    with open(config_path, "w", encoding="utf-8") as f:
        f.write(content)


def _sync_albums_local(albums_data: list):
    """同步相册数据到 data/albums.ts"""
    albums_ts_path = os.path.join(PROJECT_ROOT, "data", "albums.ts")
    json_str = json.dumps(albums_data, ensure_ascii=False, indent=2)
    ts_content = (
        "// 🛡️ 本文件由 SilentFall_Blog 控制台自动生成，请勿手动修改\n"
        "export interface Photo { url: string; caption?: string; }\n"
        "export interface Album { id: string; title: string; description: string; cover: string; date: string; photos: Photo[]; }\n\n"
        f"export const albums: Album[] = {json_str};"
    )
    os.makedirs(os.path.dirname(albums_ts_path), exist_ok=True)
    with open(albums_ts_path, "w", encoding="utf-8") as f:
        f.write(ts_content)


def _sync_friends_local(friends_list: list):
    """同步友链数据到 data/friends.ts"""
    friends_ts_path = os.path.join(PROJECT_ROOT, "data", "friends.ts")
    json_str = json.dumps(friends_list, ensure_ascii=False, indent=2)
    ts_content = (
        "// 🛡️ 本文件由 SilentFall_Blog 控制台自动生成\n"
        "export interface Friend { name: string; url: string; avatar: string; description: string; }\n\n"
        f"export const friendsData: Friend[] = {json_str};"
    )
    os.makedirs(os.path.dirname(friends_ts_path), exist_ok=True)
    with open(friends_ts_path, "w", encoding="utf-8") as f:
        f.write(ts_content)


def _sync_projects_local(projects_list: list):
    """同步项目数据到 data/projects.ts"""
    projects_ts_path = os.path.join(PROJECT_ROOT, "data", "projects.ts")
    json_str = json.dumps(projects_list, ensure_ascii=False, indent=2)
    ts_content = (
        "// 🛡️ 本文件由控制台自动生成，请勿手动修改\n\n"
        "export type Project = {\n"
        "  id: string;\n"
        "  name: string;\n"
        "  description: string;\n"
        "  icon: string;\n"
        "  githubUrl: string;\n"
        "  tags: string[];\n"
        "  date: string;\n"
        "};\n\n"
        f"export const projectsData: Project[] = {json_str};"
    )
    os.makedirs(os.path.dirname(projects_ts_path), exist_ok=True)
    with open(projects_ts_path, "w", encoding="utf-8") as f:
        f.write(ts_content)


def _sync_steam_local(games_list: list):
    """同步 Steam 游戏数据到 data/steam.ts"""
    steam_ts_path = os.path.join(PROJECT_ROOT, "data", "steam.ts")
    json_str = json.dumps(games_list, ensure_ascii=False, indent=2)
    ts_content = (
        "// 🛡️ 本文件由控制台自动生成，请勿手动修改\n\n"
        "export type GameStatus = 'not_installed' | 'installed' | 'completed' | 'perfect';\n\n"
        "export type SteamGame = {\n"
        "  id: string;\n"
        "  title: string;\n"
        "  cover: string;\n"
        "  status: GameStatus;\n"
        "  purchaseDate: string;\n"
        "  storeLink: string;\n"
        "  playtime: string;\n"
        "};\n\n"
        f"export const steamGamesData: SteamGame[] = {json_str};"
    )
    os.makedirs(os.path.dirname(steam_ts_path), exist_ok=True)
    with open(steam_ts_path, "w", encoding="utf-8") as f:
        f.write(ts_content)


def _execute_local_publish(operations: list) -> tuple[bool, str]:
    """执行本地发布（草稿→MD文件），返回 (success, message)"""
    base_dir = PROJECT_ROOT
    drafts_dir = _get_drafts_dir()
    results = []

    for op in operations:
        op_type = op.get("type", "")
        data = op.get("payload") or op.get("value", {})

        # 处理文章/说说发布
        if op_type in ("publish_article", "POST"):
            doc_type = data.get("type", "post")
            doc_id = data.get("id") or ""

            final_id = doc_id
            if not final_id or final_id == 'new':
                final_id = f"{doc_type}_{int(time.time())}"

            raw_html = data.get("content", "")
            raw_html = re.sub(r'<p>&#12288;<\/p>', '<br><br>', raw_html)
            raw_html = re.sub(r'<p><\/p>', '<br><br>', raw_html)
            md_content = md(raw_html, heading_style="ATX", keep=['img', 'br'])
            md_content = re.sub(r'<br\s*\/?>', '\n\n', md_content)

            input_date = str(data.get("date", "")).strip()
            if input_date:
                if len(input_date) <= 10:
                    current_time = datetime.now().strftime("%H:%M:%S")
                    final_date = f"{input_date} {current_time}"
                else:
                    final_date = input_date
            else:
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

            def make_filename(title_str):
                """将标题转换为安全的英文文件名"""
                if not title_str:
                    return f"{doc_type}_{int(time.time())}"
                
                # 检查是否包含中文字符
                has_chinese = bool(re.search(r'[\u4e00-\u9fff]', title_str))
                
                if has_chinese:
                    # 包含中文：使用时间戳 + 类型前缀作为文件名
                    return f"{doc_type}_{int(time.time())}"
                else:
                    # 纯英文标题：移除非法字符，转为小写，空格替换为连字符
                    illegal_chars = r'[\\/:*?"<>|]'
                    name = re.sub(illegal_chars, "", title_str)
                    name = name.strip().lower()
                    name = re.sub(r'\s+', '-', name)
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

        # 处理配置更新
        elif op_type == "CONFIG":
            try:
                updates = data.get("updates", data)
                _update_config_local(updates)
                results.append("✅ 配置已更新")
            except Exception as e:
                return False, f"配置更新失败: {str(e)}"

        # 处理相册同步
        elif op_type in ("sync_photowall", "GALLERY"):
            try:
                albums = data.get("albums", data)
                _sync_albums_local(albums)
                results.append("✅ 相册已同步")
            except Exception as e:
                return False, f"相册同步失败: {str(e)}"

        # 处理友链同步
        elif op_type in ("sync_friends", "FRIEND"):
            try:
                friends = data.get("friends", data)
                _sync_friends_local(friends)
                results.append("✅ 友链已同步")
            except Exception as e:
                return False, f"友链同步失败: {str(e)}"

        # 处理项目同步
        elif op_type == "sync_projects":
            try:
                projects = data.get("projects", data)
                _sync_projects_local(projects)
                results.append("✅ 项目已同步")
            except Exception as e:
                return False, f"项目同步失败: {str(e)}"

        # 处理 Steam 游戏同步
        elif op_type in ("sync_steam", "STEAM"):
            try:
                games = data.get("games", data)
                _sync_steam_local(games)
                results.append("✅ Steam 游戏已同步")
            except Exception as e:
                return False, f"Steam 同步失败: {str(e)}"

        # 处理说说创建
        elif op_type == "create_moment":
            try:
                moment_payload = data
                content = moment_payload.get("content", "")
                if not content.strip():
                    return False, "说说内容不能为空"
                moments_dir = os.path.join(PROJECT_ROOT, "moments")
                if not os.path.exists(moments_dir):
                    os.makedirs(moments_dir)
                filename = content[:20].strip()
                filename = re.sub(r'[\\/:*?"<>|]', "", filename)
                if not filename:
                    filename = f"moment_{int(time.time())}"
                save_path = os.path.join(moments_dir, f"{filename}.md")
                with open(save_path, "w", encoding="utf-8") as f:
                    f.write(content)
                results.append(f"✅ 说说已创建: {content[:30]}...")
            except Exception as e:
                return False, f"说说创建失败: {str(e)}"

    return True, "\n".join(results) if results else "✅ 所有操作已执行"


def _execute_blog_sync(target_path: str) -> tuple[bool, str]:
    """执行博客同步（本地→远端目录），返回 (success, message)"""
    if not is_safe_blog_dir(target_path):
        return False, "安全拦截：目标路径不合法！"

    try:
        # 1. 同步文件夹
        for d in SYNC_DIRS:
            src_dir = os.path.join(PROJECT_ROOT, d)
            dst_dir = os.path.join(target_path, d)

            if os.path.exists(src_dir):
                if os.path.exists(dst_dir):
                    shutil.rmtree(dst_dir)
                shutil.copytree(src_dir, dst_dir)

        # 2. 同步单个文件
        for f in SYNC_FILES:
            src_file = os.path.join(PROJECT_ROOT, f.replace("/", os.sep))
            dst_file = os.path.join(target_path, f.replace("/", os.sep))

            if os.path.exists(src_file):
                os.makedirs(os.path.dirname(dst_file), exist_ok=True)

                if f == "siteConfig.ts":
                    with open(src_file, "r", encoding="utf-8") as file_in:
                        lines = file_in.readlines()

                    with open(dst_file, "w", encoding="utf-8") as file_out:
                        for line in lines:
                            if "picBedName:" in line or "picBedUrl:" in line or "picBedToken:" in line or "图床核心配置" in line:
                                continue
                            file_out.write(line)
                else:
                    shutil.copy2(src_file, dst_file)

        return True, "🎉 完美撒花！所有文章与配置已镜像覆盖至目标博客。"
    except Exception as e:
        return False, f"同步过程中发生致命错误: {str(e)}"


@router.get("/config")
async def get_sync_config():
    blog_path = _read_blog_path()
    return {"blogPath": blog_path}


def is_safe_blog_dir(target_path):
    """防呆检测：只有包含 package.json 的才被认为是安全的博客目录"""
    return os.path.exists(os.path.join(target_path, "package.json"))


@router.post("/check")
async def check_blog_path(request: Request):
    """检测目标路径是否合法且具备基本结构"""
    try:
        payload = await request.json()
        target_path = payload.get("blogPath", "").strip()

        if not target_path or not os.path.exists(target_path):
            return {"success": False, "message": "🚫 目标物理路径不存在，请检查输入！"}

        if not is_safe_blog_dir(target_path):
            return {"success": False,
                    "message": "⚠️ 危险！目标路径未检测到 package.json，似乎不是一个有效的前端项目，已拦截操作。"}

        missing = []
        for d in ["posts", "data", "app"]:
            if not os.path.exists(os.path.join(target_path, d)):
                missing.append(d)

        if missing:
            return {"success": True,
                    "message": f"✅ 路径安全。但目标缺失以下文件夹：{', '.join(missing)}。同步时将自动创建。"}

        return {"success": True, "message": "✅ 路径校验通过，目录结构完美！"}
    except Exception as e:
        return {"success": False, "message": f"校验异常: {str(e)}"}


@router.post("/execute")
async def execute_sync(request: Request):
    """执行物理覆盖同步"""
    try:
        payload = await request.json()
        target_path = payload.get("blogPath", "").strip()

        if not is_safe_blog_dir(target_path):
            return {"success": False, "message": "安全拦截：目标路径不合法！"}

        # 1. 同步文件夹 (先彻底删除目标文件夹，再把 Manager 的复制过去)
        for d in SYNC_DIRS:
            src_dir = os.path.join(PROJECT_ROOT, d)
            dst_dir = os.path.join(target_path, d)

            if os.path.exists(src_dir):
                if os.path.exists(dst_dir):
                    shutil.rmtree(dst_dir)
                shutil.copytree(src_dir, dst_dir)

        # 2. 同步单个文件 (直接覆盖或过滤)
        for f in SYNC_FILES:
            src_file = os.path.join(PROJECT_ROOT, f.replace("/", os.sep))
            dst_file = os.path.join(target_path, f.replace("/", os.sep))

            if os.path.exists(src_file):
                os.makedirs(os.path.dirname(dst_file), exist_ok=True)

                # 🌟 核心过滤逻辑：如果是 siteConfig.ts，拦截并剔除敏感信息
                if f == "siteConfig.ts":
                    with open(src_file, "r", encoding="utf-8") as file_in:
                        lines = file_in.readlines()

                    with open(dst_file, "w", encoding="utf-8") as file_out:
                        for line in lines:
                            # 只要这一行包含以下关键词，直接跳过不写入
                            if "picBedName:" in line or "picBedUrl:" in line or "picBedToken:" in line or "图床核心配置" in line:
                                continue
                            file_out.write(line)
                else:
                    # 其他普通文件，直接物理拷贝
                    shutil.copy2(src_file, dst_file)

        return {"success": True, "message": "🎉 完美撒花！所有文章与配置已镜像覆盖至目标博客。"}
    except Exception as e:
        return {"success": False, "message": f"同步过程中发生致命错误: {str(e)}"}


@router.post("/publish_and_sync")
async def publish_and_sync(request: Request):
    """一键发布并同步：合并「更新本地」+「同步 Blog」为单步操作
    
    流程：
    1. 将待处理操作队列写入本地（草稿→MD文件、配置更新等）
    2. 自动同步到目标博客目录
    3. 返回详细的执行结果
    """
    try:
        payload = await request.json()
        operations = payload.get("operations", [])
        target_blog_path = payload.get("blogPath", "").strip()

        if not operations:
            return {"success": False, "message": "🚫 没有待发布的变更", "step": "idle"}

        # ========== 阶段 1：写入本地 ==========
        local_ok, local_msg = _execute_local_publish(operations)
        if not local_ok:
            return {
                "success": False,
                "message": f"❌ 本地发布失败：{local_msg}",
                "step": "local_failed",
                "detail": local_msg
            }

        # ========== 阶段 2：同步到博客目录 ==========
        if not target_blog_path:
            target_blog_path = _read_blog_path()

        if not target_blog_path:
            return {
                "success": True,
                "message": f"✅ {local_msg}\n⚠️ 未配置目标博客路径，已跳过同步步骤",
                "step": "local_only",
                "local_result": local_msg
            }

        if not os.path.exists(target_blog_path):
            return {
                "success": False,
                "message": f"✅ {local_msg}\n❌ 目标博客路径不存在：{target_blog_path}",
                "step": "sync_failed",
                "local_result": local_msg,
                "sync_error": "路径不存在"
            }

        sync_ok, sync_msg = _execute_blog_sync(target_blog_path)
        if not sync_ok:
            return {
                "success": False,
                "message": f"✅ 本地发布成功\n❌ 同步失败：{sync_msg}",
                "step": "sync_failed",
                "local_result": local_msg,
                "sync_error": sync_msg
            }

        return {
            "success": True,
            "message": f"✅ {local_msg}\n✅ {sync_msg}",
            "step": "done",
            "local_result": local_msg,
            "sync_result": sync_msg
        }

    except Exception as e:
        return {
            "success": False,
            "message": f"发布同步过程中发生异常：{str(e)}",
            "step": "error",
            "detail": str(e)
        }