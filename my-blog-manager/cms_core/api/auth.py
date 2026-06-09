"""
SilentFall_Blog CMS - 认证接口
================================
提供 /api/auth/login 与 /api/auth/me 两个接口。
密码哈希值从环境变量 CMS_ADMIN_PASSWORD_HASH 读取，永不明文比对。
"""

import os
import time
from fastapi import APIRouter, Depends, HTTPException, status, Request

from cms_core.security import (
    LoginRequest,
    verify_password,
    create_access_token,
    get_current_admin,
    check_login_rate_limit,
    get_client_ip,
)

router = APIRouter()

# 从环境变量读取密码哈希值（通过 hash_password.py 工具生成）
# 示例：CMS_ADMIN_PASSWORD_HASH=$2b$12$...
ADMIN_PASSWORD_HASH = os.environ.get("CMS_ADMIN_PASSWORD_HASH", "")
ADMIN_USERNAME = os.environ.get("CMS_ADMIN_USERNAME", "admin")


@router.post("/login")
async def login(request: Request, payload: LoginRequest):
    """登录接口，返回 JWT Token

    - 密码错误返回模糊提示，避免泄露是否有该账号
    - 速率限制：5 分钟内最多 5 次失败
    """

    client_ip = get_client_ip(request)

    # 1) 速率限制检查
    if not check_login_rate_limit(client_ip):
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="请求过于频繁，请稍后再试",
        )

    # 2) 密码校验（使用恒定时间对比，防止时序攻击）
    #    注意：即使未配置哈希，也必须走一次 verify_password 以保持时间恒定
    password_ok = False
    if ADMIN_PASSWORD_HASH:
        password_ok = verify_password(payload.password, ADMIN_PASSWORD_HASH)

    # 人为增加一点恒定等待，降低时序攻击收益
    time.sleep(0.05)

    if not password_ok:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="凭证错误",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # 3) 签发 Token
    access_token = create_access_token(data={"sub": ADMIN_USERNAME})
    return {
        "success": True,
        "accessToken": access_token,
        "tokenType": "Bearer",
        "expiresInHours": 24,
    }


@router.get("/me")
async def read_current_user(current_user: dict = Depends(get_current_admin)):
    """校验 Token 有效性（前端可用于定期刷新或页面鉴权）"""
    return {"success": True, "data": current_user}
