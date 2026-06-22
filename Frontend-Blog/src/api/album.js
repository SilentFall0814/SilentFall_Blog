import request from '@/utils/request'

/** 获取所有可见相册 */
export const getAlbumList = () => request.get('/blog/album/list')

/** 获取相册详情 */
export const getAlbumDetail = (id) => request.get(`/blog/album/${id}`)

/** 跨相册搜索照片（按相册名或照片描述匹配） */
export const searchPhotos = (keyword) =>
  request.get('/blog/album/search', { params: { keyword } })
