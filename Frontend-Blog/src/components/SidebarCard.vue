<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useBlogStore, useVisitorStore } from '@/stores'
import { getActiveAnnouncements } from '@/api/announcement'

const router = useRouter()
const blogStore = useBlogStore()
const visitorStore = useVisitorStore()

/* 公告 */
const announcements = ref([])

/* 格式化日期为 YYYY-MM-DD */
const formatDate = (val) => {
  if (!val) return ''
  return String(val).slice(0, 10)
}

/* 分类/标签弹窗 */
const showCatModal = ref(false)
const showTagModal = ref(false)

/* WebSocket 在线访客 */
const onlineCount = ref(0)
let ws = null
let reconnectTimer = null
let heartbeatTimer = null
let unmounted = false

const connectWs = () => {
  if (unmounted) return
  const protocol = location.protocol === 'https:' ? 'wss' : 'ws'
  const host = location.host
  const wsPath = '/api/ws/online'
  try {
    ws = new WebSocket(`${protocol}://${host}${wsPath}`)
    ws.onopen = () => {
      // 每 30 秒发送心跳，保持连接活跃
      heartbeatTimer = setInterval(() => {
        if (ws?.readyState === WebSocket.OPEN) {
          ws.send('ping')
        }
      }, 30000)
    }
    ws.onmessage = (e) => {
      const msg = e.data
      if (msg === 'pong') return
      const count = parseInt(msg, 10)
      if (!isNaN(count)) onlineCount.value = count
    }
    ws.onclose = () => {
      if (heartbeatTimer) {
        clearInterval(heartbeatTimer)
        heartbeatTimer = null
      }
      if (!unmounted) {
        reconnectTimer = setTimeout(connectWs, 5000)
      }
    }
    ws.onerror = () => {
      ws?.close()
    }
  } catch {
    /* ignore */
  }
}

onMounted(() => {
  connectWs()
})

/* 获取生效的公告 */
onMounted(async () => {
  try {
    const res = await getActiveAnnouncements()
    announcements.value = res.data.data ?? []
  } catch {
    announcements.value = []
  }
})

onUnmounted(() => {
  unmounted = true
  if (reconnectTimer) {
    clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer)
    heartbeatTimer = null
  }
  ws?.close()
  ws = null
})

const report = computed(() => blogStore.report)
const info = computed(() => blogStore.personalInfo)

const goArchive = () => router.push('/archive')
const goCategory = (slug) => {
  showCatModal.value = false
  router.push(`/category/${slug}`)
}
const goTag = (slug) => {
  showTagModal.value = false
  router.push(`/tag/${slug}`)
}
</script>

<template>
  <aside class="sidebar">
    <!-- 个人信息卡片 -->
    <div class="side-card info-card">
      <template v-if="blogStore.loaded">
        <div class="info-avatar-wrap">
          <img
            v-if="info.avatar"
            :src="info.avatar"
            class="info-avatar"
            loading="lazy"
          />
        </div>
        <h3 class="info-name">{{ info.nickname || 'SilentFall' }}</h3>
        <p v-if="info.tag" class="info-tag">{{ info.tag }}</p>
        <p v-if="info.location" class="info-location">
          <i class="iconfont icon-position" />
          {{ info.location }}
        </p>

        <div class="info-stats">
          <div class="info-stat" @click="goArchive">
            <span class="stat-num">{{ report.articleTotalCount ?? 0 }}</span>
            <span class="stat-label">文章</span>
          </div>
          <div class="info-stat" @click="showCatModal = true">
            <span class="stat-num">{{ report.categoryTotalCount ?? 0 }}</span>
            <span class="stat-label">分类</span>
          </div>
          <div class="info-stat" @click="showTagModal = true">
            <span class="stat-num">{{ report.tagTotalCount ?? 0 }}</span>
            <span class="stat-label">标签</span>
          </div>
        </div>

        <div class="info-social">
          <a
            v-if="info.github"
            :href="info.github"
            target="_blank"
            rel="noopener"
            class="social-link"
            title="GitHub"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path
                d="M12 .3a12 12 0 00-3.8 23.38c.6.12.83-.26.83-.57L9 21.07c-3.34.72-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.08-.74.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5 1 .1-.78.42-1.3.76-1.6-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.18 0 0 1-.33 3.3 1.23a11.5 11.5 0 016.02 0c2.28-1.56 3.29-1.23 3.29-1.23.66 1.66.25 2.88.12 3.18a4.65 4.65 0 011.23 3.22c0 4.61-2.81 5.63-5.48 5.93.43.37.81 1.1.81 2.22l-.01 3.29c0 .31.22.69.83.57A12 12 0 0012 .3"
              />
            </svg>
          </a>
          <a
            v-if="info.email"
            :href="`mailto:${info.email}`"
            class="social-link"
            title="Email"
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <rect width="20" height="16" x="2" y="4" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 01-2.06 0L2 7" />
            </svg>
          </a>
        </div>
      </template>
      <template v-else>
        <div class="info-avatar-wrap">
          <div class="sk-avatar" />
        </div>
        <div class="sk-line sk-line-name" />
        <div class="sk-line sk-line-tag" />
        <div class="sk-line sk-line-loc" />
        <div class="info-stats">
          <div class="info-stat" v-for="i in 3" :key="i">
            <span class="sk-line sk-stat-num" />
            <span class="sk-line sk-stat-label" />
          </div>
        </div>
        <div class="info-social">
          <span class="sk-social-icon" v-for="i in 3" :key="i" />
        </div>
      </template>
    </div>

    <!-- 公告栏卡片 -->
    <div v-if="announcements.length" class="side-card announcement-card">
      <h4 class="card-title"><i class="iconfont icon-biaoqian" /> 公告</h4>
      <div class="ann-list">
        <div v-for="item in announcements" :key="item.id" class="ann-item">
          <div class="ann-date">{{ formatDate(item.createdAt) }}</div>
          <div class="ann-content">{{ item.content }}</div>
        </div>
      </div>
    </div>

    <!-- 站点统计卡片 -->
    <div class="side-card stats-card">
      <template v-if="blogStore.loaded">
        <h4 class="card-title"><i class="iconfont icon-eye" /> 站点统计</h4>
        <div class="stats-grid">
          <div class="sg-item">
            <span class="sg-label">在线访客</span>
            <span class="sg-val">{{ onlineCount }}</span>
          </div>
          <div class="sg-item">
            <span class="sg-label">今日浏览</span>
            <span class="sg-val">{{ report.viewTodayCount ?? 0 }}</span>
          </div>
          <div class="sg-item">
            <span class="sg-label">总浏览量</span>
            <span class="sg-val">{{ report.viewTotalCount ?? 0 }}</span>
          </div>
          <div class="sg-item">
            <span class="sg-label">总访客量</span>
            <span class="sg-val">{{ report.visitorTotalCount ?? 0 }}</span>
          </div>
        </div>
      </template>
      <template v-else>
        <div class="sk-line sk-card-title" />
        <div class="stats-grid">
          <div class="sg-item" v-for="i in 4" :key="i">
            <span class="sk-line sk-sg-label" />
            <span class="sk-line sk-sg-val" />
          </div>
        </div>
      </template>
    </div>

    <!-- 默认插槽（文章页可插入目录等） -->
    <slot />

    <!-- ===== 分类弹窗 ===== -->
    <el-dialog
      v-model="showCatModal"
      title="所有分类"
      width="420px"
      :append-to-body="true"
    >
      <div class="modal-list">
        <div
          v-for="cat in blogStore.categories"
          :key="cat.id"
          class="modal-item"
          @click="goCategory(cat.slug)"
        >
          <i class="iconfont icon-folder" />
          <span class="modal-name">{{ cat.name }}</span>
          <span class="modal-count">{{ cat.articleCount ?? 0 }} 篇</span>
        </div>
        <div v-if="!blogStore.categories.length" class="modal-empty">
          暂无分类
        </div>
      </div>
    </el-dialog>

    <!-- ===== 标签弹窗 ===== -->
    <el-dialog
      v-model="showTagModal"
      title="所有标签"
      width="420px"
      :append-to-body="true"
    >
      <div class="modal-tag-cloud">
        <span
          v-for="tag in blogStore.tags"
          :key="tag.id"
          class="modal-tag"
          @click="goTag(tag.slug)"
        >
          <i class="iconfont icon-biaoqian" /> {{ tag.name }}
          <span class="tag-count">{{ tag.articleCount ?? 0 }}</span>
        </span>
        <div v-if="!blogStore.tags.length" class="modal-empty">暂无标签</div>
      </div>
    </el-dialog>
  </aside>
</template>

<style scoped>
.sidebar {
  width: 280px;
  flex-shrink: 0;
  position: sticky;
  top: 74px;
}
.side-card {
  background: var(--blog-card);
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  border: 1px solid var(--blog-border-light);
  padding: 20px;
  margin-bottom: 16px;
}

/* 个人信息卡片 */
.info-card {
  text-align: center;
}
.info-avatar-wrap {
  margin-bottom: 12px;
}
.info-avatar {
  width: 90px;
  height: 90px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #ebeef5;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}
.info-name {
  font-size: 17px;
  font-weight: 700;
  margin: 0 0 4px;
  color: #303133;
}
.info-tag {
  font-size: 12px;
  color: #909399;
  margin: 0 0 6px;
}
.info-location {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  font-size: 12px;
  color: #b0b0b0;
  margin: 0 0 14px;
}
.info-location .iconfont {
  font-size: 13px;
}

.info-stats {
  display: flex;
  justify-content: center;
  gap: 0;
  padding: 12px 0;
  margin: 0 -20px;
}
.info-stat {
  flex: 1;
  text-align: center;
  cursor: pointer;
  transition: background 0.15s;
  padding: 4px 0;
  border-radius: 4px;
}
.info-stat:hover {
  background: #f5f7fa;
}
.info-stat + .info-stat {
  border-left: 1px solid #ebeef5;
}
.stat-num {
  display: block;
  font-size: 18px;
  font-weight: 700;
  color: #303133;
  font-family: var(--blog-serif);
}
.stat-label {
  font-size: 11px;
  color: #909399;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-social {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 14px;
}
.social-link {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  border: none;
  color: #606266;
  cursor: pointer;
  background: none;
  transition:
    color 0.15s,
    background 0.15s;
}
.social-link:hover {
  color: #303133;
  background: #f5f7fa;
}

/* 站点统计 */
.card-title {
  font-size: 14px;
  font-weight: 700;
  margin: 0 0 12px;
  color: #303133;
  display: flex;
  align-items: center;
  gap: 6px;
}
.card-title .iconfont {
  font-size: 15px;
}
.stats-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.sg-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 13px;
  color: #606266;
}
.sg-icon {
  margin-right: 4px;
  font-size: 10px;
}
.sg-label {
  flex: 1;
}
.sg-val {
  font-weight: 600;
  color: #303133;
  font-family: var(--blog-serif);
}

/* 公告栏 */
.announcement-card .ann-list {
  max-height: 300px;
  overflow-y: auto;
}
.ann-item {
  padding: 8px 0;
  border-bottom: 1px dashed #ebeef5;
}
.ann-item:last-child {
  border-bottom: none;
}
.ann-date {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
  font-family: var(--blog-serif);
}
.ann-content {
  font-size: 13px;
  color: #606266;
  line-height: 1.6;
  word-break: break-all;
  white-space: pre-wrap;
}

/* 弹窗内容 */
.modal-list {
  max-height: 400px;
  overflow-y: auto;
}
.modal-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  cursor: pointer;
  border-radius: 6px;
  transition: background 0.12s;
  font-size: 14px;
  color: #303133;
}
.modal-item:hover {
  background: #f5f7fa;
}
.modal-item .iconfont {
  font-size: 15px;
  color: #909399;
}
.modal-name {
  flex: 1;
}
.modal-count {
  font-size: 12px;
  color: #909399;
}
.modal-empty {
  text-align: center;
  color: #909399;
  padding: 20px;
  font-size: 14px;
}

.modal-tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-height: 400px;
  overflow-y: auto;
  padding: 4px 0;
}
.modal-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border: 1px solid #e4e7ed;
  border-radius: 16px;
  font-size: 13px;
  color: #606266;
  cursor: pointer;
  transition: all 0.15s;
}
.modal-tag:hover {
  color: #303133;
  border-color: #303133;
  background: #f5f7fa;
}
.modal-tag .iconfont {
  font-size: 12px;
}
.tag-count {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 1px 6px;
  font-size: 11px;
  color: #909399;
  margin-left: 2px;
}

/* 骨架屏 */
@keyframes sk-shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}
.sk-line {
  display: block;
  height: 14px;
  border-radius: 4px;
  background: linear-gradient(90deg, #ebeef5 25%, #f5f7fa 50%, #ebeef5 75%);
  background-size: 200% 100%;
  animation: sk-shimmer 1.5s ease-in-out infinite;
}
.sk-avatar {
  width: 90px;
  height: 90px;
  margin: 0 auto;
  border-radius: 50%;
  background: linear-gradient(90deg, #ebeef5 25%, #f5f7fa 50%, #ebeef5 75%);
  background-size: 200% 100%;
  animation: sk-shimmer 1.5s ease-in-out infinite;
}
.sk-line-name {
  width: 100px;
  height: 18px;
  margin: 12px auto 4px;
}
.sk-line-tag {
  width: 70px;
  height: 12px;
  margin: 0 auto 6px;
}
.sk-line-loc {
  width: 90px;
  height: 12px;
  margin: 0 auto 14px;
}
.sk-stat-num {
  width: 36px;
  height: 20px;
  margin: 0 auto 4px;
}
.sk-stat-label {
  width: 28px;
  height: 11px;
  margin: 0 auto;
}
.sk-social-icon {
  display: inline-block;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(90deg, #ebeef5 25%, #f5f7fa 50%, #ebeef5 75%);
  background-size: 200% 100%;
  animation: sk-shimmer 1.5s ease-in-out infinite;
}
.sk-card-title {
  width: 90px;
  height: 16px;
  margin-bottom: 12px;
}
.sk-sg-label {
  width: 60px;
  height: 13px;
}
.sk-sg-val {
  width: 36px;
  height: 16px;
}

@media (max-width: 960px) {
  .sidebar {
    width: 100%;
    position: static;
  }
}
</style>
