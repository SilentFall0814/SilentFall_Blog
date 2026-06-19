<script setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/stores'
import { getPersonalInfo, updatePersonalInfo, uploadFile } from '@/api/settings'

const userStore = useUserStore()

/* ---- 标签页 ---- */
// 默认激活"个人信息"标签页，避免进入页面后内容区域为空
const activeTab = ref('personal')

/* ============================================================
   个人信息
   ============================================================ */
const personalForm = ref({
  nickname: '',
  tag: '',
  description: '',
  avatar: '',
  email: '',
  website: '',
  github: '',
  location: ''
})
const savingPersonal = ref(false)

const fetchPersonal = async () => {
  const res = await getPersonalInfo()
  Object.assign(personalForm.value, res.data ?? {})
}

const handleAvatarUpload = async (options) => {
  const fd = new FormData()
  fd.append('file', options.file)
  const res = await uploadFile(fd)
  personalForm.value.avatar = res.data
  ElMessage.success('头像上传成功')
}

const savePersonal = async () => {
  savingPersonal.value = true
  try {
    await updatePersonalInfo({ ...personalForm.value })
    ElMessage.success('个人信息保存成功')
  } finally {
    savingPersonal.value = false
  }
}

/* ---- 初始化 ---- */
onMounted(() => {
  if (userStore.isGuest) return
  fetchPersonal()
})
</script>

<template>
  <div class="profile-page">
    <el-tabs v-model="activeTab" class="tabs-wrap">
      <!-- ============ 个人信息 ============ -->
      <el-tab-pane label="个人信息" name="personal">
        <div class="personal-wrap">
          <!-- 头像上传 -->
          <el-upload
            class="avatar-uploader"
            :show-file-list="false"
            :http-request="handleAvatarUpload"
          >
            <img
              v-if="personalForm.avatar"
              :src="personalForm.avatar"
              class="avatar-preview"
            />
            <div v-else class="avatar-placeholder">
              <span class="iconfont icon-user" />
            </div>
          </el-upload>

          <el-form
            :model="personalForm"
            label-width="90px"
            class="personal-form"
          >
            <el-form-item label="昵称">
              <el-input
                v-model="personalForm.nickname"
                placeholder="昵称"
                clearable
              />
            </el-form-item>
            <el-form-item label="标签" required>
              <el-input
                v-model="personalForm.tag"
                placeholder="如：全栈开发者 / 前端工程师"
                clearable
              />
            </el-form-item>
            <el-form-item label="个人简介">
              <el-input
                v-model="personalForm.description"
                type="textarea"
                :rows="3"
                placeholder="一句话介绍自己"
              />
            </el-form-item>
            <el-form-item label="邮箱">
              <el-input
                v-model="personalForm.email"
                placeholder="联系邮箱"
                clearable
              />
            </el-form-item>
            <el-form-item label="个人网站">
              <el-input
                v-model="personalForm.website"
                placeholder="https://..."
                clearable
              />
            </el-form-item>
            <el-form-item label="GitHub">
              <el-input
                v-model="personalForm.github"
                placeholder="https://github.com/xxx"
                clearable
              />
            </el-form-item>
            <el-form-item label="所在地">
              <el-input
                v-model="personalForm.location"
                placeholder="如：中国 · 广州"
                clearable
              />
            </el-form-item>
            <el-form-item>
              <el-button
                type="primary"
                :loading="savingPersonal"
                @click="savePersonal"
                >保存</el-button
              >
            </el-form-item>
          </el-form>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>
</template>

<style scoped>
.profile-page {
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  padding: 20px;
}

/* ---- 个人信息 ---- */
.personal-wrap {
  display: flex;
  gap: 32px;
  align-items: flex-start;
  padding: 12px 0;
}

.avatar-uploader {
  flex-shrink: 0;
}

.avatar-preview {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: #f5f7fa;
  border: 1px dashed #d3d6db;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.avatar-placeholder .iconfont {
  font-size: 36px;
  color: #c0c4cc;
}

.personal-form {
  flex: 1;
  max-width: 480px;
}
</style>
