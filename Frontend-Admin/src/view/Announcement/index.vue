<script setup>
import { ref, onMounted } from 'vue'
import {
  getAnnouncementList,
  createAnnouncement,
  deleteAnnouncement
} from '@/api/announcement'

/* ---- 公告列表 ---- */
const list = ref([])
const loading = ref(false)

const fetchList = async () => {
  loading.value = true
  try {
    const res = await getAnnouncementList()
    list.value = res.data ?? []
  } catch {
    list.value = []
  } finally {
    loading.value = false
  }
}

/* ---- 发布公告 ---- */
const content = ref('')
const publishing = ref(false)

const handlePublish = async () => {
  if (!content.value.trim()) return ElMessage.warning('公告内容不能为空')
  publishing.value = true
  try {
    await createAnnouncement({ content: content.value.trim() })
    ElMessage.success('发布成功')
    content.value = ''
    fetchList()
  } finally {
    publishing.value = false
  }
}

/* ---- 删除公告 ---- */
const handleDelete = async (row) => {
  await ElMessageBox.confirm('确认删除该公告？', '警告', {
    confirmButtonText: '删除',
    cancelButtonText: '取消',
    type: 'warning'
  })
  await deleteAnnouncement(row.id)
  ElMessage.success('删除成功')
  fetchList()
}

/* 格式化日期为 YYYY-MM-DD */
const formatDate = (val) => {
  if (!val) return ''
  return String(val).slice(0, 10)
}

onMounted(() => {
  fetchList()
})
</script>

<template>
  <div class="announcement-page">
    <!-- 发布区 -->
    <div class="toolbar">
      <div class="toolbar-left">
        <span class="page-heading">
          <span class="iconfont icon-rss" />
          公告管理
        </span>
      </div>
    </div>

    <div class="publish-card">
      <el-input
        v-model="content"
        type="textarea"
        :rows="4"
        placeholder="请输入公告内容（纯文本，最多500字）"
        maxlength="500"
        show-word-limit
        resize="none"
      />
      <div class="publish-actions">
        <el-button
          type="primary"
          :loading="publishing"
          :disabled="!content.trim()"
          @click="handlePublish"
        >
          <span class="iconfont icon-plus" />
          发布公告
        </el-button>
      </div>
    </div>

    <!-- 公告列表 -->
    <div v-loading="loading" class="list-card">
      <div v-if="list.length" class="ann-list">
        <div v-for="item in list" :key="item.id" class="ann-item">
          <div class="ann-main">
            <div class="ann-meta">
              <span class="ann-date">{{ formatDate(item.createdAt) }}</span>
              <span
                :class="['ann-status', item.isActive ? 'active' : 'inactive']"
              >
                {{ item.isActive ? '生效' : '隐藏' }}
              </span>
            </div>
            <div class="ann-content">{{ item.content }}</div>
          </div>
          <div class="ann-actions">
            <el-button
              link
              size="small"
              type="danger"
              @click="handleDelete(item)"
            >
              删除
            </el-button>
          </div>
        </div>
      </div>
      <div v-else class="empty-tip">暂无公告</div>
    </div>
  </div>
</template>

<style scoped>
.announcement-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.toolbar {
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 16px 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.page-heading {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.page-heading .iconfont {
  font-size: 18px;
  color: #606266;
}

.publish-card {
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 20px;
}

.publish-actions {
  margin-top: 12px;
  display: flex;
  justify-content: flex-end;
}

.publish-actions .iconfont {
  font-size: 13px;
  margin-right: 4px;
}

.list-card {
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
  min-height: 120px;
}

.ann-list {
  display: flex;
  flex-direction: column;
}

.ann-item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid #f0f0f0;
}

.ann-item:last-child {
  border-bottom: none;
}

.ann-main {
  flex: 1;
  min-width: 0;
}

.ann-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 6px;
}

.ann-date {
  font-size: 12px;
  color: #909399;
  font-family: var(--blog-serif, inherit);
}

.ann-status {
  font-size: 11px;
  padding: 1px 8px;
  border-radius: 10px;
}

.ann-status.active {
  color: #67c23a;
  background: #f0f9eb;
}

.ann-status.inactive {
  color: #909399;
  background: #f4f4f5;
}

.ann-content {
  font-size: 14px;
  color: #303133;
  line-height: 1.6;
  word-break: break-all;
  white-space: pre-wrap;
}

.ann-actions {
  flex-shrink: 0;
}

.empty-tip {
  padding: 60px 0;
  text-align: center;
  color: #909399;
  font-size: 14px;
}
</style>
