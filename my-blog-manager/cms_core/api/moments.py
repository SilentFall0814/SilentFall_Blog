import os
import re
import json
import shutil
from fastapi import APIRouter
from pydantic import BaseModel
from typing import List, Optional
from cms_core.database import get_comments_collection

router = APIRouter()


class MomentPayload(BaseModel):
    id: str
    date: str
    content: str
    location: Optional[str] = ""
    images: List[str] = []


def _sync_moments_to_user_end():
    """将说说同步到用户端博客目录"""
    try:
        # 读取部署配置
        deploy_config_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "..", "data", "deploy_config.json")
        if not os.path.exists(deploy_config_path):
            print("[说说同步] 未找到部署配置，跳过同步")
            return

        with open(deploy_config_path, "r", encoding="utf-8-sig") as f:
            config = json.load(f)

        blog_path = config.get("blogPath", "")
        if not blog_path:
            print("[说说同步] 未配置博客路径，跳过同步")
            return

        # 获取当前项目的 moments 目录
        current_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.abspath(os.path.join(current_dir, "..", ".."))
        src_moments_dir = os.path.join(project_root, "moments")

        if not os.path.exists(src_moments_dir):
            print("[说说同步] 源目录不存在，跳过同步")
            return

        # 目标目录
        dst_moments_dir = os.path.join(blog_path, "moments")

        # 同步：先删除目标目录，再复制
        if os.path.exists(dst_moments_dir):
            shutil.rmtree(dst_moments_dir)
        shutil.copytree(src_moments_dir, dst_moments_dir)

        print(f"[说说同步] 已同步 {len(os.listdir(src_moments_dir))} 条说说到用户端")
    except Exception as e:
        print(f"[说说同步失败] {str(e)}")


def _make_moment_filename(content: str, moment_id: str) -> str:
    """
    将说说内容提取前几个字作为文件名。
    去除 HTML 标签和特殊字符，限制长度。
    """
    # 去除 HTML 标签
    text = re.sub(r'<[^>]+>', '', content)
    # 去除空白字符
    text = text.strip()
    if not text:
        return moment_id
    # 移除文件名中的非法字符
    illegal_chars = r'[\\/:*?"<>|]'
    name = re.sub(illegal_chars, '', text)
    # 去除首尾空格
    name = name.strip()
    # 限制长度（前20个字符）
    if len(name) > 20:
        name = name[:20]
    return name if name else moment_id


@router.post("/save")
def save_moment(payload: MomentPayload):
    try:
        # 🌟 绝对路径修复魔法 🌟
        # 1. 获取当前 moments.py 文件所在的绝对路径 (也就是 cms_core/api 目录)
        current_dir = os.path.dirname(os.path.abspath(__file__))

        # 2. 往上退两级，定位到你的博客管理端根目录 (my-blog-manager)
        project_root = os.path.abspath(os.path.join(current_dir, "..", ".."))

        # 3. 🎯 精准指向你指定的 moments 文件夹！
        MOMENTS_DIR = os.path.join(project_root, "moments")

        if not os.path.exists(MOMENTS_DIR):
            os.makedirs(MOMENTS_DIR, exist_ok=True)

        # 4. 使用说说内容前几个字作为文件名
        filename = _make_moment_filename(payload.content, payload.id)
        file_path = os.path.join(MOMENTS_DIR, f"{filename}.md")

        # 构造 Markdown Front-matter
        frontmatter_lines = ["---"]
        frontmatter_lines.append(f'id: "{payload.id}"')
        frontmatter_lines.append(f'date: "{payload.date}"')

        if payload.location:
            frontmatter_lines.append(f'location: "{payload.location}"')

        if payload.images:
            frontmatter_lines.append("images:")
            for img in payload.images:
                frontmatter_lines.append(f"  - '{img}'")

        frontmatter_lines.append("---")
        frontmatter_lines.append("")  # 留一个空行

        file_content = "\n".join(frontmatter_lines) + "\n" + payload.content

        # 写入 .md 文件
        with open(file_path, "w", encoding="utf-8") as f:
            f.write(file_content)

        #  在 Python 终端里大声喊出文件到底存哪了！
        print(f"\n[成功] 说说已落盘，精准物理路径：{file_path}\n")

        #  自动同步到用户端
        _sync_moments_to_user_end()

        return {"success": True, "message": f"成功保存到: {file_path}"}

    except Exception as e:
        print(f"\n[报错] 写入失败：{str(e)}\n")
        return {"success": False, "message": f"写入物理文件失败: {str(e)}"}


class DeletePayload(BaseModel):
    id: str

@router.post("/delete")
def delete_moment(payload: DeletePayload):
    try:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        project_root = os.path.abspath(os.path.join(current_dir, "..", ".."))
        MOMENTS_DIR = os.path.join(project_root, "moments")

        # 先尝试精确匹配（兼容旧 id 格式的文件名）
        file_path = os.path.join(MOMENTS_DIR, f"{payload.id}.md")

        if os.path.exists(file_path):
            os.remove(file_path)
            print(f"\n[删除成功] 物理文件已粉碎：{file_path}\n")

            try:
                comments_coll = get_comments_collection()
                delete_result = comments_coll.delete_many({"page_id": f"/moments/{payload.id}"})
                print(f"[评论清理] 已自动删除 {delete_result.deleted_count} 条说说关联评论")
            except Exception as ce:
                print(f"[评论清理失败] {str(ce)}")

            #  自动同步到用户端
            _sync_moments_to_user_end()

            return {"success": True, "message": "文件已删除"}

        # 如果精确匹配失败，扫描目录寻找包含该 id 的文件（兼容新文件名格式）
        if not os.path.exists(MOMENTS_DIR):
            return {"success": False, "message": "文件不存在，无法删除"}

        for filename in os.listdir(MOMENTS_DIR):
            if filename.endswith(".md"):
                fp = os.path.join(MOMENTS_DIR, filename)
                try:
                    with open(fp, "r", encoding="utf-8") as f:
                        content = f.read()
                    # 检查 front matter 中的 id 是否匹配
                    if content.strip().startswith("---"):
                        import yaml
                        parts = content.split("---", 2)
                        if len(parts) >= 3:
                            fm = yaml.safe_load(parts[1])
                            if fm and fm.get("id") == payload.id:
                                os.remove(fp)
                                print(f"\n[删除成功] 物理文件已粉碎：{fp}\n")

                                try:
                                    comments_coll = get_comments_collection()
                                    delete_result = comments_coll.delete_many({"page_id": f"/moments/{payload.id}"})
                                    print(f"[评论清理] 已自动删除 {delete_result.deleted_count} 条说说关联评论")
                                except Exception as ce:
                                    print(f"[评论清理失败] {str(ce)}")

                                #  自动同步到用户端
                                _sync_moments_to_user_end()

                                return {"success": True, "message": "文件已删除"}
                except:
                    continue

        return {"success": False, "message": "文件不存在，无法删除"}

    except Exception as e:
        print(f"\n[删除报错] {str(e)}\n")
        return {"success": False, "message": f"删除失败: {str(e)}"}