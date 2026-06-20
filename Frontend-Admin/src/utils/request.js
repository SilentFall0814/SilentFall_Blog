import axios from 'axios'
import router from '@/router'

const baseURL = '/api'

/**
 * Axios 实例
 * 默认超时 30 秒；上传类请求在拦截器中自动延长到 300 秒
 */
const http = axios.create({
  baseURL,
  timeout: 30000
})

/**
 * 读取本地 Token
 * @returns {string}
 */
const getToken = () => {
  return localStorage.getItem('admin_token') || ''
}

/**
 * 递归规范化响应数据中的上传文件 URL
 * 将 /uploads/ 开头的相对路径转换为 /api/uploads/，通过 Nginx 的 /api/ 反向代理访问后端静态资源
 * 同时处理 HTML 内容中的 src/href 属性和 Markdown 中的图片语法
 */
const normalizeUploadUrls = (data) => {
  if (data === null || data === undefined) return data
  if (typeof data === 'string') {
    // 字符串本身就是 /uploads/ 开头的 URL（如 coverImage、musicUrl 等字段）
    if (data.startsWith('/uploads/')) {
      return '/api' + data
    }
    // HTML 内容中的 src="/uploads/..." 或 href="/uploads/..."
    if (data.includes('/uploads/')) {
      let result = data.replace(
        /((?:src|href)\s*=\s*["'])\/uploads\//gi,
        '$1/api/uploads/'
      )
      // Markdown 图片语法: ![](/uploads/...)
      result = result.replace(/(\]\()\/uploads\//g, '$1/api/uploads/')
      return result
    }
    return data
  }
  if (Array.isArray(data)) {
    return data.map(normalizeUploadUrls)
  }
  if (typeof data === 'object') {
    const result = {}
    for (const key in data) {
      result[key] = normalizeUploadUrls(data[key])
    }
    return result
  }
  return data
}

http.interceptors.request.use(
  (config) => {
    const token = getToken()
    if (token) {
      config.headers = config.headers || {}
      config.headers['Authorization'] = token
    }
    // 文件上传请求（multipart/form-data）使用更长超时，避免大文件上传失败
    const contentType = config.headers?.['Content-Type'] || config.headers?.['content-type']
    if (contentType && String(contentType).includes('multipart/form-data')) {
      config.timeout = 300000
    }
    return config
  },
  (error) => Promise.reject(error)
)

http.interceptors.response.use(
  (response) => {
    const { data } = response
    if (data?.code === 1) {
      // 规范化响应中的上传文件 URL
      response.data = normalizeUploadUrls(data)
      return response.data
    }
    ElMessage.error(data?.msg || '请求失败')
    return Promise.reject(data)
  },
  (error) => {
    const status = error?.response?.status
    if (status === 401) {
      // 防止多个并发请求同时 401 弹出多个提示
      if (!http._isRedirecting401) {
        http._isRedirecting401 = true
        ElMessage.warning('登录状态失效，请重新登录')
        localStorage.removeItem('admin_token')
        const currentPath = router.currentRoute.value?.fullPath || '/dashboard'
        const redirect = currentPath === '/login' ? '/dashboard' : currentPath
        router.push({ path: '/login', query: { redirect } })
        setTimeout(() => {
          http._isRedirecting401 = false
        }, 2000)
      }
    } else if (status === 403) {
      ElMessage.error('权限不足，无法执行该操作')
    } else {
      // 优先展示后端返回的具体错误信息
      const msg = error?.response?.data?.msg
      if (msg) {
        ElMessage.error(msg)
      } else if (error?.code === 'ECONNABORTED') {
        ElMessage.error('请求超时，请稍后重试')
      } else {
        ElMessage.error('网络错误，请稍后重试')
      }
    }
    return Promise.reject(error)
  }
)

export default http
export { baseURL }
