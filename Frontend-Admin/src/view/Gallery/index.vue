<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAlbumStore } from '@/stores/modules/album'

const router = useRouter()
const albumStore = useAlbumStore()

const queryForm = reactive({
  page: 1,
  pageSize: 10,
  title: ''
})

const dialogVisible = ref(false)
const dialogTitle = ref('')
const submitting = ref(false)
const formRef = ref()

const form = reactive({
  id: null,
  title: '',
  description: '',
  coverImage: '',
  coverImageThumb: '',
  date: '',
  sort: 0,
  isVisible: 1
})

const rules = {
  title: [
    { required: true, message: '请输入相册名称', trigger: 'blur' },
    { max: 50, message: '不能超过50字', trigger: 'blur' }
  ],
  date: [{ required: true, message: '请选择拍摄日期', trigger: 'change' }],
  description: [{ max: 500, message: '不能超过500字', trigger: 'blur' }]
}

const uploadingCover = ref(false)

/** 加载列表 */
const loadList = async () => {
  await albumStore.fetchPage(queryForm)
}

/** 搜索 */
const onSearch = () => {
  queryForm.page = 1
  loadList()
}

/** 重置 */
const onReset = () => {
  queryForm.title = ''
  queryForm.page = 1
  loadList()
}

/** 翻页 */
const onPageChange = (page) => {
  queryForm.page = page
  loadList()
}

/** 打开新增弹窗 */
const openAdd = () => {
  dialogTitle.value = '新建相册'
  Object.assign(form, {
    id: null,
    title: '',
    description: '',
    coverImage: '',
    coverImageThumb: '',
    date: '',
    sort: 0,
    isVisible: 1
  })
  dialogVisible.value = true
}

/** 打开编辑弹窗 */
const openEdit = async (row) => {
  dialogTitle.value = '编辑相册'
  const data = await albumStore.fetchOne(row.id)
  Object.assign(form, {
    id: data.id,
    title: data.title,
    description: data.description || '',
    coverImage: data.coverImage || '',
    coverImageThumb: data.coverImageThumb || '',
    date: data.date || '',
    sort: data.sort ?? 0,
    isVisible: data.isVisible ?? 1
  })
  dialogVisible.value = true
}

/** 封面上传 */
const onCoverChange = async (file) => {
  const rawFile = file.raw || file
  if (!rawFile) return
  uploadingCover.value = true
  try {
    const formData = new FormData()
    formData.append('file', rawFile)
    const res = await albumStore.uploadImage(formData)
    const data = res.data
    form.coverImage = data.originalUrl
    form.coverImageThumb = data.thumbUrl
    ElMessage.success('封面上传成功')
  } catch {
    ElMessage.error('封面上传失败')
  } finally {
    uploadingCover.value = false
  }
}

/** 提交表单 */
const onSubmit = async () => {
  await formRef.value.validate()
  submitting.value = true
  try {
    if (form.id) {
      await albumStore.update({ ...form })
      ElMessage.success('更新成功')
    } else {
      await albumStore.create({ ...form })
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    loadList()
  } catch (e) {
    ElMessage.error(e.message || '操作失败')
  } finally {
    submitting.value = false
  }
}

/** 删除 */
const onDelete = (row) => {
  ElMessageBox.confirm(
    `确认删除相册「${row.title}」？该相册下所有照片将一并删除。`,
    '警告',
    { type: 'warning' }
  ).then(async () => {
    await albumStore.remove([row.id])
    ElMessage.success('删除成功')
    loadList()
  }).catch(() => {})
}

/** 进入照片管理 */
const goPhotoManage = (row) => {
  router.push(`/gallery/photo/${row.id}`)
}

onMounted(loadList)
</script>

<template>
  <div class="album-admin">
    <!-- 搜索栏 -->
    <el-card shadow="never" class="search-card">
      <el-form :model="queryForm" inline>
        <el-form-item label="相册名">
          <el-input
            v-model="queryForm.title"
            placeholder="按相册名搜索"
            clearable
            @keyup.enter="onSearch"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="onSearch">搜索</el-button>
          <el-button @click="onReset">重置</el-button>
          <el-button type="success" @click="openAdd">新建相册</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 列表 -->
    <el-card shadow="never" class="table-card">
      <el-table
        :data="albumStore.albums"
        v-loading="albumStore.loading"
        border
        stripe
      >
        <el-table-column label="封面" width="100" align="center">
          <template #default="{ row }">
            <el-image
              v-if="row.coverImageThumb"
              :src="row.coverImageThumb"
              :preview-src-list="[row.coverImage]"
              fit="cover"
              style="width: 60px; height: 45px; border-radius: 4px"
              preview-teleported
            />
            <span v-else style="color: #c0c4cc">无</span>
          </template>
        </el-table-column>
        <el-table-column prop="title" label="相册名称" min-width="160" show-overflow-tooltip />
        <el-table-column prop="date" label="拍摄日期" width="120" align="center" />
        <el-table-column prop="photoCount" label="照片数" width="90" align="center" />
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column label="可见性" width="90" align="center">
          <template #default="{ row }">
            <el-tag :type="row.isVisible === 1 ? 'success' : 'info'">
              {{ row.isVisible === 1 ? '可见' : '隐藏' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="sort" label="排序" width="80" align="center" />
        <el-table-column label="操作" width="240" align="center" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="goPhotoManage(row)">管理照片</el-button>
            <el-button size="small" type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button size="small" type="danger" @click="onDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="queryForm.page"
          :page-size="queryForm.pageSize"
          :total="albumStore.total"
          layout="total, prev, pager, next"
          @current-change="onPageChange"
        />
      </div>
    </el-card>

    <!-- 新增/编辑弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="560px"
      destroy-on-close
    >
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="90px"
      >
        <el-form-item label="相册名称" prop="title">
          <el-input v-model="form.title" placeholder="请输入相册名称" maxlength="50" show-word-limit />
        </el-form-item>
        <el-form-item label="拍摄日期" prop="date">
          <el-date-picker
            v-model="form.date"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="选择拍摄日期"
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="相册描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入相册描述"
            maxlength="500"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="封面图">
          <div class="cover-uploader">
            <div
              v-if="form.coverImageThumb"
              class="cover-preview"
            >
              <img :src="form.coverImageThumb" alt="封面预览" />
              <div class="cover-actions">
                <el-button size="small" @click="onCoverChange">更换</el-button>
                <el-button size="small" type="danger" @click="form.coverImage = ''; form.coverImageThumb = ''">移除</el-button>
              </div>
            </div>
            <el-upload
              v-else
              class="cover-uploader-inner"
              :show-file-list="false"
              :auto-upload="false"
              accept="image/*"
              :on-change="onCoverChange"
            >
              <div v-loading="uploadingCover" class="upload-placeholder">
                <el-icon size="28"><Plus /></el-icon>
                <span>点击上传封面</span>
              </div>
            </el-upload>
          </div>
        </el-form-item>
        <el-form-item label="排序">
          <el-input-number v-model="form.sort" :min="0" :max="9999" />
          <span class="form-hint">数字越小越靠前</span>
        </el-form-item>
        <el-form-item label="是否可见">
          <el-switch
            v-model="form.isVisible"
            :active-value="1"
            :inactive-value="0"
            active-text="可见"
            inactive-text="隐藏"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="onSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.album-admin {
  padding: 16px;
}
.search-card {
  margin-bottom: 16px;
}
.table-card {
  margin-bottom: 16px;
}
.pagination {
  margin-top: 16px;
  display: flex;
  justify-content: flex-end;
}
.form-hint {
  margin-left: 10px;
  font-size: 12px;
  color: #909399;
}
.cover-uploader {
  width: 100%;
}
.cover-uploader-inner {
  width: 200px;
  height: 150px;
}
.upload-placeholder {
  width: 200px;
  height: 150px;
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: #909399;
  cursor: pointer;
  transition: border-color 0.2s;
}
.upload-placeholder:hover {
  border-color: #409eff;
  color: #409eff;
}
.upload-placeholder span {
  font-size: 12px;
}
.cover-preview {
  display: flex;
  align-items: center;
  gap: 12px;
}
.cover-preview img {
  width: 200px;
  height: 150px;
  object-fit: cover;
  border-radius: 6px;
  border: 1px solid #ebeef5;
}
.cover-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
</style>
