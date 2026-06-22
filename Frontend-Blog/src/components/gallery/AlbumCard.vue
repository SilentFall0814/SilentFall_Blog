<script setup>
import { useRouter } from 'vue-router'

const router = useRouter()

defineProps({
  album: { type: Object, required: true }
})

const goDetail = (id) => router.push(`/gallery/${id}`)
</script>

<template>
  <div class="album-card" @click="goDetail(album.id)">
    <!-- 层叠底板：两层轻微旋转错开的卡片，暗示相册内有多张图片 -->
    <div class="card-layer layer-back" />
    <div class="card-layer layer-mid" />
    <div class="card-main">
      <!-- 顶部：相册封面 -->
      <div class="card-cover">
        <img
          v-if="album.coverImageThumb"
          :src="album.coverImageThumb"
          :alt="album.title"
          loading="lazy"
        />
        <div v-else class="cover-placeholder">
          <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
        </div>
      </div>
      <!-- 底部：相册名、日期标签、描述 -->
      <div class="card-body">
        <h3 class="album-title">{{ album.title }}</h3>
        <div class="album-meta">
          <span class="album-date">
            <i class="iconfont icon-time" />
            {{ album.date || '未记录' }}
          </span>
          <span class="album-count">{{ album.photoCount || 0 }} 张</span>
        </div>
        <p v-if="album.description" class="album-desc">
          {{ album.description }}
        </p>
      </div>
    </div>
  </div>
</template>

<style scoped>
.album-card {
  position: relative;
  cursor: pointer;
  transition: transform 0.25s ease;
}
.album-card:hover {
  transform: translateY(-4px);
}
.album-card:hover .card-main {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
}

/* 层叠底板 */
.card-layer {
  position: absolute;
  background: #fff;
  border: 1px solid var(--blog-border-light);
  border-radius: 10px;
  z-index: 0;
}
.layer-back {
  top: 10px;
  left: 6px;
  right: -6px;
  bottom: -6px;
  transform: rotate(-3deg);
  background: #fafafa;
}
.layer-mid {
  top: 5px;
  left: 3px;
  right: -3px;
  bottom: -3px;
  transform: rotate(-1.5deg);
  background: #fcfcfc;
}

/* 主卡片 */
.card-main {
  position: relative;
  z-index: 1;
  background: var(--blog-card);
  border: 1px solid var(--blog-border-light);
  border-radius: 10px;
  overflow: hidden;
  transition: box-shadow 0.25s ease;
}

.card-cover {
  width: 100%;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  background: #f5f7fa;
}
.card-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.4s ease;
}
.album-card:hover .card-cover img {
  transform: scale(1.05);
}
.cover-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #c0c4cc;
  font-size: 36px;
}

.card-body {
  padding: 14px 16px 16px;
}
.album-title {
  margin: 0 0 6px;
  font-size: 16px;
  font-weight: 700;
  color: var(--blog-text);
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.album-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: var(--blog-text3);
  margin-bottom: 6px;
}
.album-meta .iconfont {
  font-size: 12px;
  margin-right: 2px;
}
.album-count {
  padding: 1px 6px;
  background: var(--blog-hover);
  border-radius: 3px;
  font-size: 11px;
}
.album-desc {
  margin: 0;
  font-size: 13px;
  color: var(--blog-text2);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
