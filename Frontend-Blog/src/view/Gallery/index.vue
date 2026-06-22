<script setup>
import { ref, inject, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getAlbumList, searchPhotos } from '@/api/album'
import AlbumCard from '@/components/gallery/AlbumCard.vue'
import Lightbox from '@/components/gallery/Lightbox.vue'

const route = useRoute()
const router = useRouter()
const { articleTitle, articleMeta } = inject('setHero')

const albums = ref([])
const loading = ref(false)
const searchKeyword = ref('')

// 搜索结果（跨相册搜索照片）
const searchResults = ref([])
const isSearchMode = ref(false)

// Lightbox 状态
const lightboxVisible = ref(false)
const lightboxPhotos = ref([])
const lightboxIndex = ref(0)

const loadAlbums = async () => {
  loading.value = true
  try {
    const res = await getAlbumList()
    albums.value = res.data.data ?? []
  } catch {
    albums.value = []
  } finally {
    loading.value = false
  }
}

const doSearch = async () => {
  const kw = searchKeyword.value.trim()
  if (!kw) {
    isSearchMode.value = false
    searchResults.value = []
    loadAlbums()
    return
  }
  loading.value = true
  isSearchMode.value = true
  try {
    const res = await searchPhotos(kw)
    searchResults.value = res.data.data ?? []
  } catch {
    searchResults.value = []
  } finally {
    loading.value = false
  }
}

const clearSearch = () => {
  searchKeyword.value = ''
  isSearchMode.value = false
  searchResults.value = []
  router.replace('/gallery')
  loadAlbums()
}

// 打开 Lightbox（从搜索结果中点击照片）
const openLightbox = (photos, index) => {
  lightboxPhotos.value = photos
  lightboxIndex.value = index
  lightboxVisible.value = true
}

// 跳转相册详情
const goAlbumDetail = (albumId) => {
  router.push(`/gallery/${albumId}`)
}

watch(
  () => route.query.search,
  (kw) => {
    if (kw) {
      searchKeyword.value = kw
      doSearch()
    } else {
      searchKeyword.value = ''
      isSearchMode.value = false
      loadAlbums()
    }
  }
)

onMounted(() => {
  articleTitle.value = '照片墙'
  articleMeta.value = '光影流转，定格瞬间'
  const kw = route.query.search
  if (kw) {
    searchKeyword.value = kw
    doSearch()
  } else {
    loadAlbums()
  }
})
</script>

<template>
  <div class="gallery-page">
    <!-- 顶部：左上角标题 + 右上角搜索框 -->
    <div class="gallery-header">
      <div class="header-left">
        <h1 class="page-title">照片墙</h1>
        <p class="page-subtitle">光影流转，定格瞬间</p>
      </div>
      <div class="header-right">
        <div class="search-box">
          <i class="iconfont icon-sousuo search-icon" />
          <input
            v-model="searchKeyword"
            type="text"
            placeholder="搜索相册名或照片描述"
            class="search-input"
            @keyup.enter="doSearch"
          />
          <button v-if="searchKeyword" class="clear-btn" @click="clearSearch">
            &times;
          </button>
        </div>
      </div>
    </div>

    <!-- 搜索结果提示 -->
    <div v-if="isSearchMode" class="search-tip">
      <span>
        搜索 "<strong>{{ route.query.search || searchKeyword }}</strong>" 找到
        {{ searchResults.length }} 个相册
      </span>
      <a class="clear-link" @click="clearSearch">&times; 清除搜索</a>
    </div>

    <!-- 相册列表区 -->
    <div v-if="!isSearchMode" class="album-section">
      <div v-if="loading" class="album-grid">
        <div v-for="i in 6" :key="i" class="skeleton-card">
          <div class="skeleton-cover" />
          <div class="skeleton-body">
            <div class="skeleton-line w60" />
            <div class="skeleton-line w40" />
            <div class="skeleton-line w80" />
          </div>
        </div>
      </div>

      <div v-else-if="albums.length" class="album-grid">
        <AlbumCard
          v-for="album in albums"
          :key="album.id"
          :album="album"
        />
      </div>

      <!-- 空状态 -->
      <div v-else class="empty-state">
        <svg class="empty-icon" viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
        <p class="empty-text">还没有相册</p>
        <p class="empty-hint">去后台创建第一个相册吧</p>
      </div>
    </div>

    <!-- 搜索结果区（按相册分组展示照片） -->
    <div v-else class="search-results">
      <div v-if="loading" class="loading-tip">搜索中...</div>
      <div v-else-if="searchResults.length">
        <div
          v-for="group in searchResults"
          :key="group.albumId"
          class="search-group"
        >
          <div class="group-header" @click="goAlbumDetail(group.albumId)">
            <img
              v-if="group.coverImageThumb"
              :src="group.coverImageThumb"
              class="group-cover"
              loading="lazy"
            />
            <div class="group-info">
              <h3 class="group-title">{{ group.albumTitle }}</h3>
              <span class="group-date">{{ group.albumDate }}</span>
            </div>
            <i class="iconfont icon-arrow-right-bold group-arrow" />
          </div>
          <div class="group-photos">
            <div
              v-for="(photo, idx) in group.photos"
              :key="photo.id"
              class="photo-thumb"
              @click="openLightbox(group.photos, idx)"
            >
              <img
                :src="photo.imageUrlThumb"
                :alt="photo.caption || ''"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </div>
      <div v-else class="empty-state">
        <svg class="empty-icon" viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="11" cy="11" r="8"/>
          <line x1="21" y1="21" x2="16.65" y2="16.65"/>
        </svg>
        <p class="empty-text">未找到匹配的照片</p>
        <p class="empty-hint">试试其他关键词</p>
      </div>
    </div>

    <!-- 大图查看 -->
    <Lightbox
      v-model:visible="lightboxVisible"
      v-model:index="lightboxIndex"
      :photos="lightboxPhotos"
    />
  </div>
</template>

<style scoped>
.gallery-page {
  width: 100%;
}

/* 顶部 */
.gallery-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 32px;
  gap: 20px;
  flex-wrap: wrap;
}
.header-left {
  flex: 1;
  min-width: 200px;
}
.page-title {
  margin: 0 0 4px;
  font-family: var(--blog-serif);
  font-size: 28px;
  font-weight: 800;
  color: var(--blog-text);
}
.page-subtitle {
  margin: 0;
  font-size: 14px;
  color: var(--blog-text3);
}
.header-right {
  flex-shrink: 0;
}
.search-box {
  position: relative;
  display: flex;
  align-items: center;
}
.search-icon {
  position: absolute;
  left: 12px;
  font-size: 14px;
  color: var(--blog-text3);
  pointer-events: none;
}
.search-input {
  width: 240px;
  padding: 9px 32px 9px 34px;
  border: 1px solid var(--blog-border);
  border-radius: 20px;
  font-size: 13px;
  background: var(--blog-card);
  color: var(--blog-text);
  outline: none;
  font-family: inherit;
  transition: border-color 0.2s, width 0.2s;
}
.search-input:focus {
  border-color: var(--blog-text);
  width: 280px;
}
.clear-btn {
  position: absolute;
  right: 8px;
  background: none;
  border: none;
  cursor: pointer;
  font-size: 18px;
  color: var(--blog-text3);
  padding: 0 6px;
  line-height: 1;
}
.clear-btn:hover {
  color: var(--blog-text);
}

/* 搜索提示 */
.search-tip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  margin-bottom: 20px;
  background: var(--blog-card);
  border: 1px solid var(--blog-border-light);
  border-radius: 8px;
  font-size: 14px;
  color: var(--blog-text2);
}
.clear-link {
  color: var(--blog-text);
  cursor: pointer;
  font-weight: 600;
}
.clear-link:hover {
  text-decoration: underline;
}

/* 相册网格 */
.album-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 28px 24px;
}

/* 骨架屏 */
@keyframes sk-shimmer {
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
}
.skeleton-card {
  background: var(--blog-card);
  border: 1px solid var(--blog-border-light);
  border-radius: 10px;
  overflow: hidden;
}
.skeleton-cover {
  width: 100%;
  aspect-ratio: 4 / 3;
  background: linear-gradient(90deg, #ebeef5 25%, #f5f7fa 50%, #ebeef5 75%);
  background-size: 200% 100%;
  animation: sk-shimmer 1.5s ease-in-out infinite;
}
.skeleton-body {
  padding: 14px 16px;
}
.skeleton-line {
  height: 14px;
  border-radius: 4px;
  margin-bottom: 8px;
  background: linear-gradient(90deg, #ebeef5 25%, #f5f7fa 50%, #ebeef5 75%);
  background-size: 200% 100%;
  animation: sk-shimmer 1.5s ease-in-out infinite;
}
.w40 { width: 40%; }
.w60 { width: 60%; }
.w80 { width: 80%; }

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

/* 搜索结果分组 */
.search-results {
  display: flex;
  flex-direction: column;
  gap: 32px;
}
.loading-tip {
  padding: 40px;
  text-align: center;
  color: var(--blog-text3);
}
.search-group {
  background: var(--blog-card);
  border: 1px solid var(--blog-border-light);
  border-radius: 10px;
  padding: 16px 20px;
}
.group-header {
  display: flex;
  align-items: center;
  gap: 12px;
  cursor: pointer;
  margin-bottom: 14px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--blog-border-light);
  transition: opacity 0.2s;
}
.group-header:hover {
  opacity: 0.8;
}
.group-cover {
  width: 48px;
  height: 48px;
  border-radius: 6px;
  object-fit: cover;
  flex-shrink: 0;
}
.group-info {
  flex: 1;
  min-width: 0;
}
.group-title {
  margin: 0 0 2px;
  font-size: 16px;
  font-weight: 700;
  color: var(--blog-text);
}
.group-date {
  font-size: 12px;
  color: var(--blog-text3);
}
.group-arrow {
  font-size: 16px;
  color: var(--blog-text3);
}
.group-photos {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 10px;
}
.photo-thumb {
  aspect-ratio: 1;
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  background: #f5f7fa;
}
.photo-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.25s;
}
.photo-thumb:hover img {
  transform: scale(1.08);
}

/* 响应式 */
@media (max-width: 960px) {
  .album-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
@media (max-width: 768px) {
  .gallery-header {
    flex-direction: column;
    align-items: stretch;
  }
  .search-input {
    width: 100%;
  }
  .search-input:focus {
    width: 100%;
  }
}
@media (max-width: 600px) {
  .album-grid {
    grid-template-columns: 1fr;
    gap: 24px;
  }
  .page-title {
    font-size: 24px;
  }
  .group-photos {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  }
}
</style>
