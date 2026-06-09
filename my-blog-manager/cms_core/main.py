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

app = FastAPI(title="SilentFall_Blog CMS Backend", version="1.0.0")

# 🌟 安全加固：CORS 改为白名单模式，从 CMS_ALLOWED_ORIGINS 环境变量读取
#    生产环境请务必设置具体域名，例如：http://localhost:3001,https://yourblog.com
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],  # 允许所有请求方法 (GET, POST 等)
    allow_headers=["*"],  # 允许所有请求头
)

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