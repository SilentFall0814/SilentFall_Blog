<script setup>
import { ref, inject, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getAlbumDetail } from '@/api/album'
import { getPhotosByAlbumId } from '@/api/photo'
import Lightbox from '@/components/gallery/Lightbox.vue'

const route = useRoute()
const router = useRouter()
const { articleCover, articleTitle, articleMeta } = inject('setHero')

const album = ref(null)
const photos = ref([])
const loading = ref(false)

// Lightbox 状态
const lightboxVisible = ref(false)
const lightboxIndex = ref(0)

const loadDetail = async (id) => {
  loading.value = true
  try {
    const [albumRes, photoRes] = await Promise.all([
      getAlbumDetail(id),
      getPhotosByAlbumId(id)
    ])
    album.value = albumRes.data.data
    photos.value = photoRes.data.data ?? []

    // 更新 Hero
    if (album.value) {
      articleTitle.value = album.value.title
      articleCover.value = album.value.coverImage || ''
      articleMeta.value = album.value.date || ''
    }
  } catch {
    album.value = null
    photos.value = []
  } finally {
    loading.value = false
  }
}

const goBack = () => router.push('/gallery')

const openLightbox = (index) => {
  lightboxIndex.value = index
  lightboxVisible.value = true
}

watch(
  () => route.params.id,
  (id) => {
    if (id) loadDetail(id)
  }
)

onMounted(() => {
  const id = route.params.id
  if (id) loadDetail(id)
})
</script>

<template>
  <div class="album-detail-page">
    <!-- 头部信息区 -->
    <div class="detail-header">
      <div class="header-top">
        <!-- 左上角：返回按钮 + 日期 -->
        <div class="header-left">
          <button class="back-btn" @click="goBack">
            <i class="iconfont icon-arrow-left-bold" />
            返回画廊
          </button>
          <span v-if="album" class="album-date">{{ album.date }}</span>
        </div>
        <!-- 右上角：胶囊统计标签 -->
        <div v-if="album" class="header-right">
          <span class="count-badge">共 {{ album.photoCount || photos.length }} 瞬间</span>
        </div>
      </div>

      <!-- 正左方居中：大字号标题 + 描述 -->
      <div v-if="album" class="header-main">
        <h1 class="album-title">{{ album.title }}</h1>
        <p v-if="album.description" class="album-desc">{{ album.description }}</p>
      </div>
    </div>

    <!-- 照片展示区 -->
    <div v-if="loading" class="photo-loading">
      <div v-for="i in 4" :key="i" class="loading-card" />
    </div>

    <div v-else-if="photos.length" class="photo-strip">
      <!-- 照片网格（一行3~4个，多行） -->
      <div class="photo-track">
        <div
          v-for="(photo, idx) in photos"
          :key="photo.id"
          class="photo-card"
          @click="openLightbox(idx)"
        >
          <img
            :src="photo.imageUrlThumb"
            :alt="photo.caption || ''"
            loading="lazy"
          />
          <div v-if="photo.caption" class="photo-caption">
            {{ photo.caption }}
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-else-if="!loading && album" class="empty-state">
      <svg class="empty-icon" viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21 15 16 10 5 21"/>
      </svg>
      <p class="empty-text">暂无照片</p>
      <p class="empty-hint">去后台上传照片吧</p>
    </div>

    <!-- 大图查看 -->
    <Lightbox
      v-model:visible="lightboxVisible"
      v-model:index="lightboxIndex"
      :photos="photos"
    />
  </div>
</template>

<style scoped>
.album-detail-page {
  width: 100%;
}

/* 头部 */
.detail-header {
  margin-bottom: 32px;
}
.header-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
  flex-wrap: wrap;
  gap: 12px;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}
.back-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 8px 14px;
  background: var(--blog-card);
  border: 1px solid var(--blog-border);
  border-radius: 6px;
  color: var(--blog-text2);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
  font-family: inherit;
}
.back-btn:hover {
  color: var(--blog-text);
  border-color: var(--blog-text3);
}
.back-btn .iconfont {
  font-size: 14px;
}
.album-date {
  font-size: 13px;
  color: var(--blog-text3);
}
.count-badge {
  display: inline-block;
  padding: 6px 14px;
  background: var(--blog-text);
  color: #fff;
  font-size: 13px;
  border-radius: 14px;
  font-weight: 500;
}

.header-main {
  padding: 8px 0;
}
.album-title {
  margin: 0 0 8px;
  font-family: var(--blog-serif);
  font-size: 32px;
  font-weight: 800;
  color: var(--blog-text);
  line-height: 1.3;
}
.album-desc {
  margin: 0;
  font-size: 15px;
  color: var(--blog-text2);
  line-height: 1.6;
  max-width: 700px;
}

/* 照片展示区 - 网格布局（一行3~4个，多行） */
.photo-strip {
  overflow: visible;
}
.photo-track {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  padding-bottom: 12px;
}
.photo-card {
  width: 100%;
  height: 240px;
  border-radius: 10px;
  overflow: hidden;
  position: relative;
  cursor: pointer;
  background: #f5f7fa;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  transition: transform 0.25s, box-shadow 0.25s;
}
.photo-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
}
.photo-card img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.4s;
}
.photo-card:hover img {
  transform: scale(1.05);
}
.photo-caption {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 24px 14px 12px;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.7), transparent);
  color: #fff;
  font-size: 13px;
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 加载中 */
.photo-loading {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  overflow: hidden;
}
.loading-card {
  width: 100%;
  height: 240px;
  border-radius: 10px;
  background: linear-gradient(90deg, #ebeef5 25%, #f5f7fa 50%, #ebeef5 75%);
  background-size: 200% 100%;
  animation: sk-shimmer 1.5s ease-in-out infinite;
}
@keyframes sk-shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}

/* 空状态 */
.empty-state {
  padding: 80px 20px;
  text-align: center;
  background: var(--blog-card);
  border: 1px dashed var(--blog-border);
  border-radius: 12px;
}
.empty-icon {
  font-size: 48px;
  color: var(--blog-text3);
  margin-bottom: 12px;
  display: block;
}
.empty-text {
  margin: 0 0 4px;
  font-size: 16px;
  color: var(--blog-text2);
  font-weight: 600;
}
.empty-hint {
  margin: 0;
  font-size: 13px;
  color: var(--blog-text3);
}

/* 响应式：移动端调整 */
@media (max-width: 768px) {
  .album-title {
    font-size: 24px;
  }
  .album-desc {
    font-size: 14px;
  }
  .photo-card {
    height: 200px;
  }
  .loading-card {
    height: 200px;
  }
}
@media (max-width: 600px) {
  .header-top {
    flex-direction: column;
    align-items: flex-start;
  }
  .photo-track {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
  .photo-card {
    height: auto;
    aspect-ratio: 4 / 3;
  }
}
</style>
