<script setup>
import { ref, watch, onMounted, onBeforeUnmount, computed } from 'vue'

const props = defineProps({
  // 是否显示
  visible: { type: Boolean, default: false },
  // 照片列表
  photos: { type: Array, default: () => [] },
  // 当前索引
  index: { type: Number, default: 0 }
})

const emit = defineEmits(['update:visible', 'update:index'])

const currentIndex = ref(props.index)

// 同步外部 index 变化
watch(
  () => props.index,
  (val) => {
    currentIndex.value = val
  }
)

// 同步外部 visible 变化
watch(
  () => props.visible,
  (val) => {
    if (val) {
      currentIndex.value = props.index
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
  }
)

const currentPhoto = computed(
  () => props.photos[currentIndex.value] || null
)

const hasPrev = computed(() => currentIndex.value > 0)
const hasNext = computed(() => currentIndex.value < props.photos.length - 1)

const prev = () => {
  if (hasPrev.value) {
    currentIndex.value--
    emit('update:index', currentIndex.value)
  }
}

const next = () => {
  if (hasNext.value) {
    currentIndex.value++
    emit('update:index', currentIndex.value)
  }
}

const close = () => {
  emit('update:visible', false)
}

// 点击遮罩关闭（点击图片不关闭）
const onMaskClick = (e) => {
  if (e.target === e.currentTarget) {
    close()
  }
}

// 键盘事件
const onKeydown = (e) => {
  if (!props.visible) return
  switch (e.key) {
    case 'ArrowLeft':
      prev()
      break
    case 'ArrowRight':
      next()
      break
    case 'Escape':
      close()
      break
  }
}

onMounted(() => {
  window.addEventListener('keydown', onKeydown)
})
onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  document.body.style.overflow = ''
})
</script>

<template>
  <transition name="lightbox-fade">
    <div v-if="visible" class="lightbox-mask" @click="onMaskClick">
      <!-- 关闭按钮 -->
      <button class="lightbox-close" title="关闭 (Esc)" @click.stop="close">
        <svg
          viewBox="0 0 24 24"
          width="22"
          height="22"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>

      <!-- 上一张 -->
      <button
        v-if="hasPrev"
        class="lightbox-nav lightbox-prev"
        title="上一张 (←)"
        @click.stop="prev"
      >
        <svg
          viewBox="0 0 24 24"
          width="28"
          height="28"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </button>

      <!-- 下一张 -->
      <button
        v-if="hasNext"
        class="lightbox-nav lightbox-next"
        title="下一张 (→)"
        @click.stop="next"
      >
        <svg
          viewBox="0 0 24 24"
          width="28"
          height="28"
          fill="none"
          stroke="currentColor"
          stroke-width="2.5"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

      <!-- 图片容器 -->
      <div class="lightbox-content" @click="onMaskClick">
        <img
          v-if="currentPhoto"
          :src="currentPhoto.imageUrl"
          :alt="currentPhoto.caption || ''"
          class="lightbox-image"
          @click.stop
        />
        <!-- 底部胶囊描述 -->
        <div
          v-if="currentPhoto && currentPhoto.caption"
          class="lightbox-caption"
        >
          {{ currentPhoto.caption }}
        </div>
      </div>

      <!-- 计数器 -->
      <div v-if="photos.length > 1" class="lightbox-counter">
        {{ currentIndex + 1 }} / {{ photos.length }}
      </div>
    </div>
  </transition>
</template>

<style scoped>
.lightbox-mask {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.88);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.lightbox-content {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.lightbox-image {
  max-width: 90vw;
  max-height: 80vh;
  object-fit: contain;
  border-radius: 4px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
}

/* 底部胶囊描述 */
.lightbox-caption {
  position: absolute;
  bottom: -50px;
  left: 50%;
  transform: translateX(-50%);
  max-width: 80vw;
  padding: 10px 20px;
  background: rgba(0, 0, 0, 0.75);
  color: #fff;
  font-size: 14px;
  line-height: 1.5;
  border-radius: 20px;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 关闭按钮 */
.lightbox-close {
  position: fixed;
  top: 24px;
  right: 24px;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  z-index: 10000;
}
.lightbox-close:hover {
  background: rgba(255, 255, 255, 0.2);
}

/* 左右切换按钮 */
.lightbox-nav {
  position: fixed;
  top: 50%;
  transform: translateY(-50%);
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s;
  z-index: 10000;
}
.lightbox-nav:hover {
  background: rgba(255, 255, 255, 0.2);
}
.lightbox-prev {
  left: 24px;
}
.lightbox-next {
  right: 24px;
}

/* 计数器 */
.lightbox-counter {
  position: fixed;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  padding: 6px 14px;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  font-size: 13px;
  border-radius: 14px;
  z-index: 10000;
}

/* 过渡动画 */
.lightbox-fade-enter-active,
.lightbox-fade-leave-active {
  transition: opacity 0.25s ease;
}
.lightbox-fade-enter-from,
.lightbox-fade-leave-to {
  opacity: 0;
}

@media (max-width: 768px) {
  .lightbox-mask {
    padding: 20px 10px;
  }
  .lightbox-image {
    max-height: 70vh;
  }
  .lightbox-caption {
    bottom: -44px;
    font-size: 13px;
    padding: 8px 16px;
  }
  .lightbox-nav {
    width: 40px;
    height: 40px;
  }
  .lightbox-prev {
    left: 12px;
  }
  .lightbox-next {
    right: 12px;
  }
}
</style>
