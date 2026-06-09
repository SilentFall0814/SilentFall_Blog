"""
SilentFall_Blog CMS - 核心安全模块
===================================
职责：
  1. 密码加盐哈希与校验（bcrypt）
  2. JWT Token 签发与校验
  3. API 鉴权依赖（FastAPI Depends）
  4. 输入净化（XSS / NoSQL 注入防御）
  5. 登录接口速率限制（防暴力破解）

依赖：
  pip install python-jose[cryptography] bcrypt python-multipart
"""

import os
import re
import html
import time
import secrets
import bcrypt
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any

from fastapi import Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from pydantic import BaseModel, field_validator


# -----------------------------------------------------------------------------
# 一、环境变量与配置（全部从系统环境 / .env 读取，永不硬编码）
# -----------------------------------------------------------------------------
SECRET_KEY = os.environ.get("CMS_SECRET_KEY")
if not SECRET_KEY:
    # 启动时若未配置，则生成一个随机 key（重启后旧 token 全部失效）
    # 生产环境必须在 .env 中显式设置：CMS_SECRET_KEY=你的64位随机字符串
    SECRET_KEY = secrets.token_hex(32)

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = int(os.environ.get("CMS_TOKEN_EXPIRE_HOURS", "24"))

# 允许的跨域来源白名单（生产环境必须限制为你的前端域名）
ALLOWED_ORIGINS_RAW = os.environ.get("CMS_ALLOWED_ORIGINS", "*")
if ALLOWED_ORIGINS_RAW.strip() == "*":
    ALLOWED_ORIGINS = ["*"]
else:
    ALLOWED_ORIGINS = [
        s.strip() for s in ALLOWED_ORIGINS_RAW.split(",") if s.strip()
    ]

# HTTP Bearer 认证（前端请求头：Authorization: Bearer <token>）
security = HTTPBearer(auto_error=False)


# -----------------------------------------------------------------------------
# 二、密码哈希与 JWT 工具
# -----------------------------------------------------------------------------
def hash_password(password: str) -> str:
    """将明文密码哈希化（bcrypt 自动加盐）"""
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """校验明文密码与哈希值是否一致"""
    try:
        return bcrypt.checkpw(plain_password.encode("utf-8"), hashed_password.encode("utf-8"))
    except Exception:
        return False


def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """签发 JWT Access Token"""
    to_encode = data.copy()
    now = datetime.now(timezone.utc)
    expire = now + (expires_delta or timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS))
    to_encode.update({"exp": expire, "iat": now})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


# -----------------------------------------------------------------------------
# 三、Pydantic 输入校验模型（第一道防线：类型 + 长度 + 字符集）
# -----------------------------------------------------------------------------
class LoginRequest(BaseModel):
    """登录请求体校验"""
    password: str

    @field_validator("password")
    @classmethod
    def check_password_length(cls, v: str) -> str:
        if not v or len(v) < 4 or len(v) > 256:
            raise ValueError("凭证长度非法")
        return v


# -----------------------------------------------------------------------------
# 四、输入净化工具（XSS / NoSQL 注入防御）
# -----------------------------------------------------------------------------
# MongoDB 操作符黑名单（NoSQL 注入防御的轻量级手段）
_NOSQL_OPERATORS = re.compile(r'(\$|\{|\}|\||;|--|\/\*|\*\/)')

# HTML 标签正则（基础 XSS 防御）
_HTML_TAG_RE = re.compile(r'<[^>]+>')


def sanitize_string(value: str, max_length: int = 10000, strip_html: bool = True) -> str:
    """
    通用字符串净化：
      - 去除首尾空白
      - 截断到最大长度
      - 可选去除 HTML 标签（防 XSS）
      - 对 HTML 实体转义
    """
    if not isinstance(value, str):
        return ""
    value = value.strip()
    if len(value) > max_length:
        value = value[:max_length]
    if strip_html:
        value = _HTML_TAG_RE.sub("", value)
    value = html.escape(value, quote=True)
    return value


def sanitize_nosql_field(value: str, max_length: int = 200) -> str:
    """
    将用于 MongoDB 查询字段的字符串净化：
      - 去除 $ { } ; 等危险字符
      - 防 NoSQL 注入
    """
    if not isinstance(value, str):
        return ""
    value = value.strip()
    if len(value) > max_length:
        value = value[:max_length]
    # 移除 MongoDB 操作符及常见注入字符
    value = _NOSQL_OPERATORS.sub("", value)
    return value


def sanitize_payload(payload: Dict[str, Any], safe_keys: Optional[set] = None) -> Dict[str, Any]:
    """
    递归净化 JSON payload：
      - safe_keys 指定的 key 会跳过 HTML 去除（例如富文本 content 字段）
      - 富文本字段仅做 html.escape，不剥标签，由前端渲染时再过滤
    """
    if not isinstance(payload, dict):
        return payload
    safe_keys = safe_keys or set()
    result = {}
    for k, v in payload.items():
        if isinstance(v, dict):
            result[k] = sanitize_payload(v, safe_keys)
        elif isinstance(v, list):
            result[k] = [
                sanitize_payload(item, safe_keys) if isinstance(item, dict)
                else (sanitize_string(item) if isinstance(item, str) else item)
                for item in v
            ]
        elif isinstance(v, str):
            if k in safe_keys:
                # 富文本：仅转义最危险的 script/onerror/onload 等事件属性，保留结构
                v = _sanitize_rich_text(v)
            else:
                v = sanitize_string(v)
            result[k] = v
        else:
            result[k] = v
    return result


_DANGEROUS_ATTR_RE = re.compile(
    r'(on\w+|javascript|expression)\s*=', re.IGNORECASE
)
_SCRIPT_TAG_RE = re.compile(r'<\s*(script|iframe|object|embed)\b[^>]*>.*?</\s*\1\s*>', re.IGNORECASE | re.DOTALL)


def _sanitize_rich_text(value: str) -> str:
    """富文本净化：去除 <script>/<iframe> 与 onxxx 事件属性"""
    if not value:
        return value
    value = _SCRIPT_TAG_RE.sub("", value)
    value = _DANGEROUS_ATTR_RE.sub("", value)
    return value


# -----------------------------------------------------------------------------
# 五、JWT 鉴权依赖（给路由函数用 Depends(get_current_admin) 即可保护接口）
# -----------------------------------------------------------------------------
async def get_current_admin(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> Dict[str, Any]:
    """
    FastAPI 依赖注入用鉴权函数。
    使用方式：
        @router.post("/save")
        async def save_draft(_ = Depends(get_current_admin), ...):
    """
    if credentials is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="凭证缺失",
            headers={"WWW-Authenticate": "Bearer"},
        )
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: Optional[str] = payload.get("sub")
        if username is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="凭证无效",
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="凭证已过期或无效",
        )
    return {"username": username}


# -----------------------------------------------------------------------------
# 六、登录接口速率限制（内存版，简易防暴力破解）
# -----------------------------------------------------------------------------
_LOGIN_RATE_LIMIT_WINDOW = int(os.environ.get("CMS_LOGIN_WINDOW_SECONDS", "300"))  # 5 分钟
_LOGIN_RATE_LIMIT_MAX = int(os.environ.get("CMS_LOGIN_MAX_ATTEMPTS", "5"))         # 5 次

# {client_ip: {"count": int, "window_start": float}}
_login_attempts: Dict[str, Dict[str, float]] = {}


def check_login_rate_limit(client_ip: str) -> bool:
    """
    返回 True 表示允许继续尝试；False 表示已被临时封禁。
    注：多进程部署时请替换为 Redis 实现，此处为内存版。
    """
    now = time.time()
    record = _login_attempts.get(client_ip, {"count": 0, "window_start": now})

    # 窗口过期，重置
    if now - record["window_start"] > _LOGIN_RATE_LIMIT_WINDOW:
        record = {"count": 1, "window_start": now}
        _login_attempts[client_ip] = record
        return True

    record["count"] += 1
    _login_attempts[client_ip] = record

    if record["count"] > _LOGIN_RATE_LIMIT_MAX:
        return False
    return True


def get_client_ip(request: Request) -> str:
    """从请求中提取客户端 IP（优先 X-Forwarded-For 首个 IP）"""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"
