import json
import os


CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(CURRENT_DIR, ".."))
DEPLOY_CONFIG_PATH = os.path.join(PROJECT_ROOT, "data", "deploy_config.json")


def normalize_target_path(raw_path: str) -> str:
    """将配置中的目标路径统一转换为可用的绝对路径。"""
    if not raw_path:
        return ""
    expanded = os.path.expanduser(raw_path.strip())
    if os.path.isabs(expanded):
        return os.path.abspath(expanded)
    return os.path.abspath(os.path.join(PROJECT_ROOT, expanded))


def is_safe_blog_dir(target_path: str) -> bool:
    """仅允许同步到包含 package.json 的前端项目目录。"""
    normalized = normalize_target_path(target_path)
    if not normalized:
        return False
    return os.path.exists(os.path.join(normalized, "package.json"))


def get_default_blog_path() -> str:
    """优先读取环境变量，其次自动推断同级目录下的 SFBlogs。"""
    for env_key in ("BLOG_FRONTEND_PATH", "SFBLOGS_PATH"):
        env_path = normalize_target_path(os.environ.get(env_key, ""))
        if is_safe_blog_dir(env_path):
            return env_path

    sibling_blog_path = os.path.abspath(os.path.join(PROJECT_ROOT, "..", "SFBlogs"))
    if is_safe_blog_dir(sibling_blog_path):
        return sibling_blog_path

    return ""


def read_target_blog_path() -> str:
    """读取同步目标目录；未配置时自动回退到可推断的默认路径。"""
    if os.path.exists(DEPLOY_CONFIG_PATH):
        try:
            with open(DEPLOY_CONFIG_PATH, "r", encoding="utf-8-sig") as file_obj:
                config = json.load(file_obj)
            configured_path = normalize_target_path(config.get("blogPath", ""))
            if configured_path:
                return configured_path
        except Exception:
            pass

    return get_default_blog_path()
