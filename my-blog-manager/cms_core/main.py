import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# 引入所有 API 路由
from cms_core.api import music, config, picbed, drafts, moments
from cms_core.api import gallery, friends, projects
from cms_core.api import sync, comments, guest_moments
from cms_core.api import analytics
from cms_core.api import steam
from cms_core.api import announcements
from cms_core.api import auth
from cms_core.security import ALLOWED_ORIGINS
from cms_core.database import validate_database_connection

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)

logger = logging.getLogger("silentfall.cms.main")
allow_credentials = ALLOWED_ORIGINS != ["*"]

app = FastAPI(title="SilentFall_Blog CMS Backend", version="1.0.0")

# 安全加固：跨域来源从环境变量读取；未收敛到白名单时自动关闭凭证模式。
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=allow_credentials,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    logger.info("后端服务启动，当前 CORS 白名单=%s", ",".join(ALLOWED_ORIGINS))
    validate_database_connection()

@app.get("/api/status")
def get_status():
    return {"status": "online", "message": "中枢神经已连接"}

# 注册所有路由
app.include_router(music.router, prefix="/api/music", tags=["Music"])
app.include_router(config.router, prefix="/api/config", tags=["Config"])
app.include_router(picbed.router, prefix="/api/picbed", tags=["PicBed"])
app.include_router(drafts.router, prefix="/api/drafts", tags=["Drafts"])
app.include_router(gallery.router, prefix="/api/gallery", tags=["Gallery"])
app.include_router(friends.router, prefix="/api/friends", tags=["Friends"])
app.include_router(projects.router, prefix="/api/projects", tags=["Projects"])
app.include_router(moments.router, prefix="/api/moments", tags=["Moments"])
app.include_router(sync.router, prefix="/api/sync", tags=["Sync"])
app.include_router(comments.router, prefix="/api/comments", tags=["Comments"])
app.include_router(guest_moments.router, prefix="/api/guest_moments", tags=["GuestMoments"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])
app.include_router(steam.router, prefix="/api/steam", tags=["Steam"])
app.include_router(announcements.router, prefix="/api/announcements", tags=["Announcements"])
app.include_router(auth.router, prefix="/api/auth", tags=["Auth"])
