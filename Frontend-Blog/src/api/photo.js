import request from '@/utils/request'

/** 获取相册下所有照片（按上传时间倒序） */
export const getPhotosByAlbumId = (albumId) =>
  request.get('/blog/photo/list', { params: { albumId } })
