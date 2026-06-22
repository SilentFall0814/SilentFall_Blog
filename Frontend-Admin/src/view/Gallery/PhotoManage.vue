<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { usePhotoStore } from '@/stores/modules/photo'
import { useAlbumStore } from '@/stores/modules/album'

const route = useRoute()
const router = useRouter()
const photoStore = usePhotoStore()
const albumStore = useAlbumStore()

const albumId = route.params.albumId
const albumInfo = ref(null)

const queryForm = reactive({
  page: 1,
  pageSize: 24,
  albumId
})

/** 上传相关 */
const uploadDialogVisible = ref(false)
const uploadFiles = ref([]) // 待上传文件列表
const uploadCaptions = ref([]) // 与文件一一对应的描述
const uploading = ref(false)

/** 编辑描述相关 */
const editingId = ref(null)
const editingCaption = ref('')

/** 加载相册信息 */
const loadAlbumInfo = async () => {
  const data = await albumStore.fetchOne(albumId)
  albumInfo.value = data
}

/** 加载照片列表 */
const loadList = async () => {
  await photoStore.fetchPage(queryForm)
}

/** 翻页 */
const onPageChange = (page) => {
  queryForm.page = page
  loadList()
}

/** 返回相册列表 */
const goBack = () => router.push('/gallery')

/** 打开批量上传弹窗 */
const openUpload = () => {
  uploadFiles.value = []
  uploadCaptions.value = []
  uploadDialogVisible.value = true
}

/** 选择文件后，初始化描述数组 */
const onFileChange = (file, fileList) => {
  uploadFiles.value = fileList
  // 同步描述数组长度
  while (uploadCaptions.value.length < fileList.length) {
    uploadCaptions.value.push('')
  }
  uploadCaptions.value = uploadCaptions.value.slice(0, fileList.length)
}

/** 移除文件 */
const onFileRemove = (file, fileList) => {
  const idx = uploadFiles.value.findIndex((f) => f.uid === file.uid)
  if (idx >= 0) {
    uploadCaptions.value.splice(idx, 1)
  }
  uploadFiles.value = fileList
}

/** 提交批量上传 */
const submitUpload = async () => {
  if (uploadFiles.value.length === 0) {
    ElMessage.warning('请先选择照片')
    return
  }
  uploading.value = true
  try {
    const formData = new FormData()
    formData.append('albumId', albumId)
    uploadFiles.value.forEach((f) => {
      formData.append('files', f.raw)
    })
    uploadCaptions.value.forEach((c) => {
      formData.append('captions', c || '')
    })
    await photoStore.batchUpload(formData)
    ElMessage.success(`成功上传 ${uploadFiles.value.length} 张照片`)
    uploadDialogVisible.value = false
    loadList()
    loadAlbumInfo()
  } catch (e) {
    ElMessage.error(e.message || '上传失败')
  } finally {
    uploading.value = false
  }
}

/** 进入编辑描述 */
const startEdit = (row) => {
  editingId.value = row.id
  editingCaption.value = row.caption || ''
}

/** 取消编辑 */
const cancelEdit = () => {
  editingId.value = null
  editingCaption.value = ''
}

/** 保存描述 */
const saveCaption = async (row) => {
  await photoStore.update({
    id: row.id,
    albumId: row.albumId,
    imageUrl: row.imageUrl,
    imageUrlThumb: row.imageUrlThumb,
    caption: editingCaption.value,
    sortOrder: row.sortOrder
  })
  ElMessage.success('描述已更新')
  editingId.value = null
  loadList()
}

/** 删除照片 */
const onDelete = (row) => {
  ElMessageBox.confirm('确认删除该照片？文件将一并删除。', '警告', {
    type: 'warning'
  }).then(async () => {
    await photoStore.remove([row.id])
    ElMessage.success('删除成功')
    loadList()
    loadAlbumInfo()
  }).catch(() => {})
}

onMounted(() => {
  loadAlbumInfo()
  loadList()
})
</script>

<template>
  <div class="photo-admin">
    <!-- 顶部 -->
    <el-card shadow="never" class="header-card">
      <div class="header-row">
        <div class="header-left">
          <el-button @click="goBack">
            <el-icon><ArrowLeft /></el-icon>
            返回相册列表
          </el-button>
          <div v-if="albumInfo" class="album-info">
            <h2 class="album-title">{{ albumInfo.title }}</h2>
            <span class="album-date">{{ albumInfo.date }}</span>
            <el-tag type="info" size="small">共 {{ albumInfo.photoCount || 0 }} 张</el-tag>
          </div>
        </div>
        <el-button type="success" @click="openUpload">
          <el-icon><Upload /></el-icon>
          批量上传照片
        </el-button>
      </div>
    </el-card>

    <!-- 照片列表 -->
    <el-card shadow="never" class="photo-card">
      <div v-loading="photoStore.loading">
        <div v-if="photoStore.photos.length" class="photo-grid">
          <div
            v-for="photo in photoStore.photos"
            :key="photo.id"
            class="photo-item"
          >
            <div class="photo-image">
              <el-image
                :src="photo.imageUrlThumb"
                :preview-src-list="[photo.imageUrl]"
                fit="cover"
                preview-teleported
                style="width: 100%; height: 160px"
              />
            </div>
            <div class="photo-meta">
              <!-- 描述：编辑态 -->
              <template v-if="editingId === photo.id">
                <el-input
                  v-model="editingCaption"
                  type="textarea"
                  :rows="2"
                  placeholder="请输入照片描述"
                  maxlength="200"
                  size="small"
                />
                <div class="caption-actions">
                  <el-button size="small" type="primary" @click="saveCaption(photo)">保存</el-button>
                  <el-button size="small" @click="cancelEdit">取消</el-button>
                </div>
              </template>
              <!-- 描述：展示态 -->
              <template v-else>
                <p class="caption-text" @click="startEdit(photo)">
                  {{ photo.caption || '点击添加描述' }}
                </p>
                <div class="photo-actions">
                  <el-button size="small" text @click="startEdit(photo)">编辑描述</el-button>
                  <el-button size="small" text type="danger" @click="onDelete(photo)">删除</el-button>
                </div>
              </template>
            </div>
          </div>
        </div>

        <!-- 空状态 -->
        <el-empty v-else description="该相册还没有照片，点击右上角批量上传吧" />
      </div>

      <div v-if="photoStore.total > queryForm.pageSize" class="pagination">
        <el-pagination
          v-model:current-page="queryForm.page"
          :page-size="queryForm.pageSize"
          :total="photoStore.total"
          layout="total, prev, pager, next"
          @current-change="onPageChange"
        />
      </div>
    </el-card>

    <!-- 批量上传弹窗 -->
    <el-dialog
      v-model="uploadDialogVisible"
      title="批量上传照片"
      width="720px"
      destroy-on-close
    >
      <el-upload
        drag
        multiple
        accept="image/*"
        :auto-upload="false"
        :on-change="onFileChange"
        :on-remove="onFileRemove"
        :file-list="uploadFiles"
      >
        <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
        <div class="el-upload__text">
          将照片拖到此处，或<em>点击选择</em>
        </div>
        <template #tip>
          <div class="el-upload__tip">
            支持多选，上传后可在下方为每张照片填写描述
          </div>
        </template>
      </el-upload>

      <!-- 已选文件的描述填写区 -->
      <div v-if="uploadFiles.length" class="caption-list">
        <div class="caption-list-title">
          已选择 {{ uploadFiles.length }} 张照片，请为每张填写描述（可选）
        </div>
        <div
          v-for="(file, idx) in uploadFiles"
          :key="file.uid"
          class="caption-item"
        >
          <div class="caption-thumb">
            <img :src="file.url" :alt="file.name" />
          </div>
          <div class="caption-input">
            <div class="caption-name">{{ file.name }}</div>
            <el-input
              v-model="uploadCaptions[idx]"
              placeholder="为这张照片写点什么..."
              maxlength="200"
              size="small"
            />
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="uploadDialogVisible = false">取消</el-button>
        <el-button
          type="primary"
          :loading="uploading"
          :disabled="uploadFiles.length === 0"
          @click="submitUpload"
        >
          开始上传 ({{ uploadFiles.length }})
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.photo-admin {
  padding: 16px;
}
.header-card {
  margin-bottom: 16px;
}
.header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}
.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}
.album-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}
.album-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}
.album-date {
  font-size: 13px;
  color: #909399;
}

.photo-card {
  margin-bottom: 16px;
}
.photo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
}
.photo-item {
  border: 1px solid #ebeef5;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
  display: flex;
  flex-direction: column;
}
.photo-image {
  background: #f5f7fa;
}
.photo-meta {
  padding: 10px;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.caption-text {
  margin: 0;
  font-size: 13px;
  color: #606266;
  line-height: 1.5;
  min-height: 38px;
  cursor: pointer;
  padding: 6px 8px;
  border-radius: 4px;
  background: #f5f7fa;
  transition: background 0.2s;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.caption-text:hover {
  background: #ecf5ff;
  color: #409eff;
}
.caption-actions {
  display: flex;
  gap: 6px;
}
.photo-actions {
  display: flex;
  justify-content: space-between;
}

.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}

/* 上传弹窗 */
.caption-list {
  margin-top: 16px;
  max-height: 360px;
  overflow-y: auto;
  border-top: 1px solid #ebeef5;
  padding-top: 12px;
}
.caption-list-title {
  font-size: 13px;
  color: #606266;
  margin-bottom: 12px;
}
.caption-item {
  display: flex;
  gap: 12px;
  padding: 10px;
  border: 1px solid #ebeef5;
  border-radius: 6px;
  margin-bottom: 10px;
  background: #fafafa;
}
.caption-thumb {
  flex-shrink: 0;
  width: 60px;
  height: 60px;
  border-radius: 4px;
  overflow: hidden;
  background: #f5f7fa;
}
.caption-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.caption-input {
  flex: 1;
  min-width: 0;
}
.caption-name {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
