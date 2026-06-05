from fastapi import APIRouter, Body
import os
import re
import json
from typing import Dict, Any

router = APIRouter()

# ---------------------------------------------------------
# 🛠️ 寻址引擎：物理锁死 Manager 本地根目录！(终极修复版)
# ---------------------------------------------------------
CURRENT_API_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(CURRENT_API_DIR, "..", ".."))


def get_config_path():
    possible_paths = [
        os.path.join(PROJECT_ROOT, 'siteConfig.ts'),
        os.path.join(PROJECT_ROOT, 'src', 'siteConfig.ts'),
        os.path.join(os.path.dirname(CURRENT_API_DIR), 'siteConfig.ts')
    ]

    for p in possible_paths:
        if os.path.exists(p):
            return p

    print(f"❌ 警告：在 Manager 目录未找到 siteConfig.ts！正在搜索的根目录是: {PROJECT_ROOT}")
    return None


def dict_to_ts_string(data, indent=2):
    """安全地将字典转为 TypeScript 格式，自动处理多行字符串转义"""
    if isinstance(data, dict):
        lines = ["{"]
        for k, v in data.items():
            # 🌟 核心修复：无论是字典还是外层，全部使用 json.dumps 强制安全转义，彻底消灭 Unterminated string constant
            val = json.dumps(v, ensure_ascii=False)
            lines.append(f"{' ' * (indent + 2)}{k}: {val},")
        lines.append(" " * indent + "}")
        return "\n".join(lines)
    return json.dumps(data, ensure_ascii=False)


# =========================================================
# 🚀 接口 1：读取配置 (GET) - 终极安全隔离版
# =========================================================
@router.get("/get")
def get_site_config():
    config_path = get_config_path()
    if not config_path:
        return {"success": False, "message": "未能找到 siteConfig.ts 文件"}

    try:
        with open(config_path, 'r', encoding='utf-8') as f:
            content = f.read()

        parsed_config = {}
        
        # 1. 🌟 预处理：安全移除注释 (跳过字符串内部的 //)
        # 匹配: 字符串 (双引号/单引号/反引号) OR 多行注释 OR 单行注释
        comment_pattern = r'(\".*?\"|\'.*?\'|\`.*?\`)|/\*[\s\S]*?\*/|//.*'
        
        def comment_replacer(match):
            # 如果是字符串 (group 1 有值)，保留原样
            if match.group(1):
                return match.group(1)
            # 否则是注释，替换为空
            return ""
            
        clean_content = re.sub(comment_pattern, comment_replacer, content)

        # 2. 🌟 提取 siteConfig 对象内部内容
        # 匹配 export const siteConfig = { ... }
        main_match = re.search(r'export\s+const\s+siteConfig\s*=\s*\{([\s\S]+)\};?\s*$', clean_content)
        if not main_match:
            # 如果没找到大对象，退而求其次用原来的全文搜索
            inner_content = clean_content
        else:
            inner_content = main_match.group(1)

        # 3. 🌟 匹配一级 Key-Value
        # 这个正则匹配: key: value, 其中 value 可以是字符串、布尔、数字、数组或对象
        # 注意：这里假设一级 key 是没有引号的，且每个 key 占一行或有明显的逗号分隔
        kv_pattern = r'^\s*([a-zA-Z0-9_]+)\s*:\s*(\[[\s\S]*?\]|\{[\s\S]*?\}|["\'`][\s\S]*?["\'`]|true|false|\d+)'
        
        for match in re.finditer(kv_pattern, inner_content, re.MULTILINE):
            key, val = match.groups()
            val = val.strip()

            # 处理布尔值
            if val == 'true':
                parsed_config[key] = True
            elif val == 'false':
                parsed_config[key] = False
            # 处理数字
            elif re.match(r'^\d+$', val):
                parsed_config[key] = int(val)
            # 处理对象或数组 (尝试解析)
            elif val.startswith('{') or val.startswith('['):
                try:
                    # 极简转换：尝试把 TS 对象转为 JSON
                    json_val = val.replace("'", '"')
                    json_val = re.sub(r',\s*([}\]])', r'\1', json_val)
                    json_val = re.sub(r'([{,])\s*([a-zA-Z0-9_]+)\s*:', r'\1"\2":', json_val)
                    parsed_config[key] = json.loads(json_val)
                except:
                    # 如果解析失败，对于对象，尝试手动抓取内部简单的字符串 key-value
                    if val.startswith('{'):
                        sub_dict = {}
                        for m in re.finditer(r'([a-zA-Z0-9_]+)\s*:\s*(["\'])([\s\S]*?)\2', val):
                            sub_dict[m.group(1)] = m.group(3).replace('\\n', '\n')
                        parsed_config[key] = sub_dict if sub_dict else val
                    else:
                        parsed_config[key] = val
            # 处理字符串
            else:
                parsed_config[key] = val[1:-1].replace('\\n', '\n')

        # 补漏检查：如果 useLocalPicBed 没被正则抓到，手动尝试全文搜索
        if 'useLocalPicBed' not in parsed_config:
            bool_match = re.search(r'useLocalPicBed\s*:\s*(true|false)', content)
            if bool_match:
                parsed_config['useLocalPicBed'] = (bool_match.group(1) == 'true')

        return {"success": True, "data": parsed_config}
    except Exception as e:
        return {"success": False, "message": f"解析失败: {str(e)}"}


# =========================================================
# 🚀 接口 2：写入配置 (POST) - 白名单防漏防崩溃版
# =========================================================
@router.post("/update")
def update_site_config(payload: Dict[str, Any] = Body(...)):
    updates = payload.get("updates", {})
    if not updates:
        return {"success": False, "message": "没有收到需要更新的数据"}

    config_path = get_config_path()
    if not config_path:
        return {"success": False, "message": "未能扫描到 siteConfig.ts"}

    # 🌟 核心防线：绝对安全的根节点白名单！
    VALID_ROOT_KEYS = {
        "title", "authorName", "bio", "avatarUrl", "useGradient", "themeColors",
        "bgImages", "defaultPostCover", "photoWallImage", "cloudMusicIds", "social",
        "counts", "chatterTitle", "chatterDescription", "picBedName", "picBedUrl",
        "picBedToken", "useLocalPicBed", "danmakuList", "buildDate", "footerBadges",
        "icpConfig",
        "faviconUrl",
        "navTitle",  # 👈 必须叫这个
        "navSuffix",  # 👈 必须叫这个
        "navAfter"  # 👈 必须叫这个
    }

    try:
        with open(config_path, 'r', encoding='utf-8') as f:
            content = f.read()

        print("\n" + "=" * 50)
        print(f"🔥 启动物理引擎，目标文件: {config_path}")
        updated_count = 0

        for key, value in updates.items():

            # 拦截非白名单字段，彻底防止二次覆写灾难
            if key not in VALID_ROOT_KEYS:
                print(f"  🛑 拦截非根节点危险字段 -> [{key}]")
                continue

            if isinstance(value, str):
                val_str = json.dumps(value, ensure_ascii=False)
            elif isinstance(value, bool):
                val_str = str(value).lower()
            elif isinstance(value, dict):
                val_str = dict_to_ts_string(value, indent=2)
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
                print(f"  ✅ 成功修改并落盘 -> [{key}]")
                updated_count += 1

        # 写入物理磁盘
        with open(config_path, 'w', encoding='utf-8') as f:
            f.write(content)

        print(f"🔥 任务圆满完成，共刷新 {updated_count} 个字段")
        print("=" * 50 + "\n")

        return {"success": True, "message": "本地 siteConfig.ts 修改成功！"}

    except Exception as e:
        print(f"❌ 物理写入发生灾难性错误: {str(e)}")
        return {"success": False, "message": f"文件读写错误: {str(e)}"}