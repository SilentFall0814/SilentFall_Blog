from fastapi import APIRouter, Body, UploadFile, File, Form, Depends
import httpx
import os
import time
import uuid

import hashlib
from cms_core.security import get_current_admin, sanitize_payload, sanitize_nosql_field

router = APIRouter()

CURRENT_API_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(CURRENT_API_DIR, "..", ".."))
UPLOAD_DIR = os.path.join(PROJECT_ROOT, "public", "uploads")

@router.post("/upload_local")
async def upload_local(file: UploadFile = File(...), _=Depends(get_current_admin)):
    """
    将图片上传到本地 public/uploads 目录，并使用 MD5 去重
    """
    try:
        if not os.path.exists(UPLOAD_DIR):
            os.makedirs(UPLOAD_DIR, exist_ok=True)

        # 读取内容计算 MD5
        content = await file.read()
        md5_hash = hashlib.md5(content).hexdigest()

        # 保持原后缀
        ext = os.path.splitext(file.filename)[1].lower()
        if not ext:
            ext = ".jpg" # 兜底后缀

        new_filename = f"{md5_hash}{ext}"
        save_path = os.path.join(UPLOAD_DIR, new_filename)

        # 如果文件不存在，则写入
        if not os.path.exists(save_path):
            with open(save_path, "wb") as f:
                f.write(content)
            message = "本地上传成功"
        else:
            message = "检测到相同文件，已自动去重引用"

        return {
            "success": True,
            "message": message,
            "url": f"/uploads/{new_filename}"
        }
    except Exception as e:
        return {"success": False, "message": f"本地上传失败: {str(e)}"}

@router.post("/delete_local")
async def delete_local(payload: dict = Body(...), _=Depends(get_current_admin)):
    """
    删除本地 public/uploads 目录下的物理文件
    """
    clean_payload = sanitize_payload(payload)
    url = sanitize_nosql_field(clean_payload.get("url", ""), max_length=500)
    if not url or not url.startswith("/uploads/"):
        return {"success": False, "message": "无效的本地路径，仅支持删除 /uploads/ 开头的图片"}

    filename = url.replace("/uploads/", "")
    file_path = os.path.join(UPLOAD_DIR, filename)

    try:
        if os.path.exists(file_path):
            os.remove(file_path)
            return {"success": True, "message": f"物理文件 {filename} 已删除"}
        else:
            return {"success": True, "message": "文件在本地已不存在，可能已被手动清理"}
    except Exception as e:
        return {"success": False, "message": f"物理删除失败: {str(e)}"}


@router.post("/test")
async def test_picbed_connection(payload: dict = Body(...), _=Depends(get_current_admin)):
    clean_payload = sanitize_payload(payload)
    url = sanitize_nosql_field(clean_payload.get("url", ""), max_length=500).rstrip('/')
    token = sanitize_nosql_field(clean_payload.get("token", ""), max_length=1000)

    if not url or not token:
        return {"success": False, "message": "图床 API 地址和 Token 不能为空"}

    test_endpoint = f"{url}/api/v1/profile"
    if not token.startswith("Bearer "):
        token = f"Bearer {token}"

    headers = {"Authorization": token, "Accept": "application/json"}

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            response = await client.get(test_endpoint, headers=headers)
            if response.status_code!= 200:
                return {"success": False, "message": f"校验失败，服务器返回了 {response.status_code} 错误"}

            data = response.json()
            if data.get("status") is True:
                user_email = data.get("data", {}).get("email", "未知用户")
                return {"success": True, "message": f"连接成功！当前账户: {user_email}"}
            else:
                return {"success": False, "message": f"Token 无效: {data.get('message', '未知错误')}"}
    except Exception as e:
        return {"success": False, "message": f"网络异常: {str(e)}"}


# 👇 【全新追加】：真实的图床图片上传接口
@router.post("/upload")
async def upload_image(
        file: UploadFile = File(...),
        url: str = Form(...),
        token: str = Form(...),
        _=Depends(get_current_admin)
):
    url = sanitize_nosql_field(url, max_length=500).strip().rstrip('/')
    token = sanitize_nosql_field(token, max_length=1000).strip()

    if not token.startswith("Bearer "):
        token = f"Bearer {token}"

    upload_endpoint = f"{url}/api/v1/upload"
    headers = {
        "Authorization": token,
        "Accept": "application/json"
    }

    try:
        content = await file.read()
        # 封装为 httpx 支持的文件上传格式
        files = {'file': (file.filename, content, file.content_type)}

        # 上传图片可能较慢，将超时设置为 30 秒
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(upload_endpoint, headers=headers, files=files)

            if response.status_code!= 200:
                return {"success": False, "message": f"上传失败，图床返回了 {response.status_code} 错误"}

            data = response.json()
            # 兼容 Lsky Pro 的返回格式
            if data.get("status") is True:
                img_url = data.get("data", {}).get("links", {}).get("url")
                return {"success": True, "message": "上传成功", "url": img_url}
            else:
                return {"success": False, "message": f"图床拒绝接收: {data.get('message', '未知')}"}
    except httpx.ReadTimeout:
        return {"success": False, "message": "图片上传超时，请检查网络或图片是否过大"}
    except Exception as e:
        return {"success": False, "message": f"服务器异常: {str(e)}"}
