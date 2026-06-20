import axios from 'axios'
import router from '@/router'

const baseURL = '/api'

const instance = axios.create({
  baseURL,
  timeout: 15000
})

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

instance.interceptors.response.use(
  (res) => {
    if (res.data.code === 1) {
      // 规范化响应中的上传文件 URL
      res.data = normalizeUploadUrls(res.data)
      return res
    }
    return Promise.reject(res.data)
  },
  (err) => {
    if (err?.response?.status === 403) {
      router.replace('/403')
    }
    return Promise.reject(err)
  }
)

export default instance
export { baseURL }
