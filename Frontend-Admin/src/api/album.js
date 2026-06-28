import request from '@/utils/request'

/** 分页查询相册 */
export const pageAlbum = (params) => request.get('/admin/album/page', { params })

/** 根据ID查询相册 */
export const getAlbum = (id) => request.get(`/admin/album/${id}`)

/** 创建相册 */
export const addAlbum = (data) => request.post('/admin/album', data)

/** 更新相册 */
export const updateAlbum = (data) => request.put('/admin/album', data)

/** 批量删除相册 */
export const deleteAlbum = (ids) =>
  request.delete('/admin/album', { params: { ids: ids.join(',') } })

/** 图片上传（同时生成缩略图） */
export const uploadImageWithThumb = (formData) =>
  request.post('/admin/common/uploadImage', formData, {
    // 不手动设置 Content-Type，让浏览器自动添加 multipart/form-data 及 boundary
    timeout: 600000
  })
