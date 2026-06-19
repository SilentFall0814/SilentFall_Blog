<script setup>
import { ref, reactive } from 'vue'
import { useUserStore } from '@/stores'

const userStore = useUserStore()
const loginFormRef = ref(null)
const loading = ref(false)

const loginForm = reactive({
  username: '',
  password: ''
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

/** 登录提交 */
const handleLogin = async () => {
  if (!loginFormRef.value) return
  const valid = await loginFormRef.value.validate().catch(() => false)
  if (!valid) return
  loading.value = true
  try {
    await userStore.loginAction({ ...loginForm })
  } catch {
    // 错误已由拦截器统一处理
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-box">
      <!-- 标题区 -->
      <div class="login-header">
        <div class="login-brand">
          <span class="iconfont icon-guanliduan brand-icon" />
        </div>
        <h1 class="login-title">管理控制台</h1>
      </div>

      <!-- 表单区 -->
      <el-form
        ref="loginFormRef"
        :model="loginForm"
        :rules="rules"
        class="login-form"
      >
        <el-form-item prop="username">
          <el-input
            v-model="loginForm.username"
            placeholder="用户名"
            size="large"
            clearable
          >
            <template #prefix>
              <span class="iconfont icon-user field-icon" />
            </template>
          </el-input>
        </el-form-item>

        <el-form-item prop="password">
          <el-input
            v-model="loginForm.password"
            type="password"
            placeholder="登录密码"
            size="large"
            show-password
          >
            <template #prefix>
              <span class="iconfont icon-lock field-icon" />
            </template>
          </el-input>
        </el-form-item>

        <el-form-item>
          <el-button
            class="login-btn"
            size="large"
            :style="{
              '--el-button-bg-color': '#000000',
              '--el-button-border-color': '#000000',
              '--el-button-text-color': '#ffffff',
              '--el-button-hover-bg-color': '#303133',
              '--el-button-hover-border-color': '#303133',
              '--el-button-hover-text-color': '#ffffff',
              '--el-button-active-bg-color': '#000000',
              '--el-button-active-border-color': '#000000'
            }"
            :loading="loading"
            @click="handleLogin"
          >
            登 录
          </el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background-color: #f5f7fa;
}

.login-box {
  width: 420px;
  background: #ffffff;
  border: 1px solid #e4e7ed;
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  padding: 48px 40px 40px;
}

/* ---- 标题 ---- */
.login-header {
  text-align: center;
  margin-bottom: 36px;
}

.login-brand {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 52px;
  height: 52px;
  border-radius: 12px;
  background: #000000;
  margin: 0 auto 16px;
}

.brand-icon {
  font-size: 26px;
  color: #ffffff;
}

.login-title {
  margin: 0 0 6px;
  font-size: 22px;
  font-weight: 700;
  color: #303133;
  letter-spacing: 1px;
}

/* ---- 表单 ---- */
.login-form {
  display: flex;
  flex-direction: column;
}

.field-icon {
  font-size: 16px;
  color: #c0c4cc;
}

/* 登录按钮 */
.login-btn {
  width: 100%;
  height: 44px;
  font-size: 15px;
  font-weight: 500;
  letter-spacing: 4px;
  margin-top: 4px;
}

/* 覆盖 Element Plus Input 聚焦色 */
:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px #000000 inset !important;
}

:deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #c0c4cc inset;
}

:deep(.el-form-item) {
  margin-bottom: 20px;
}
</style>
