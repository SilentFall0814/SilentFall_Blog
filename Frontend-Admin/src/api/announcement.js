import http from '@/utils/request'

/** 获取所有公告列表 */
export const getAnnouncementList = () => http.get('/admin/announcement')

/**
 * 发布新公告
 * @param {{ content: string }} data
 */
export const createAnnouncement = (data) =>
  http.post('/admin/announcement', data)

/**
 * 删除公告
 * @param {string} id
 */
export const deleteAnnouncement = (id) =>
  http.delete(`/admin/announcement/${id}`)
