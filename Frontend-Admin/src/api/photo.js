import request from '@/utils/request'

/** 分页查询某相册的照片 */
export const pagePhoto = (params) => request.get('/admin/photo/page', { params })

/** 根据ID查询照片 */
export const getPhoto = (id) => request.get(`/admin/photo/${id}`)

/** 批量上传照片（同时填写描述）
 * @param {FormData} formData 包含 albumId, files[], captions[]
 */
export const batchUploadPhoto = (formData) =>
  request.post('/admin/photo/batch', formData, {
    // 不手动设置 Content-Type，让浏览器自动添加 multipart/form-data 及 boundary
    timeout: 600000
  })

/** 更新照片（修改描述/排序） */
export const updatePhoto = (data) => request.put('/admin/photo', data)

/** 批量删除照片 */
export const deletePhoto = (ids) =>
  request.delete('/admin/photo', { params: { ids: ids.join(',') } })
