import request from '@/utils/request'

/** 获取所有生效的公告（按时间倒序） */
export const getActiveAnnouncements = () =>
  request.get('/blog/announcement/active')
