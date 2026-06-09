import os
import json
from fastapi import APIRouter, Request, Depends
from cms_core.security import get_current_admin, sanitize_payload, sanitize_nosql_field

router = APIRouter()

CURRENT_API_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(CURRENT_API_DIR, "..", ".."))

TARGET_FILE = os.path.join(PROJECT_ROOT, "data", "steam.ts")


@router.post("/sync")
async def sync_steam(request: Request, _=Depends(get_current_admin)):
    try:
        raw_payload = await request.json()
        payload = sanitize_payload(raw_payload)
        games_list = payload.get("games", [])

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

        os.makedirs(os.path.dirname(TARGET_FILE), exist_ok=True)
        with open(TARGET_FILE, "w", encoding="utf-8") as f:
            f.write(ts_content)

        return {"success": True, "message": "Steam 游戏库写入成功"}
    except Exception as e:
        return {"success": False, "message": str(e)}
