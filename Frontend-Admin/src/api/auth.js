import http from '@/utils/request'

/**
 * 管理员登录
 * @param {{ username: string, password: string }} payload
 */
export const login = (payload) => http.post('/admin/admin/login', payload)

/**
 * 获取管理员信息
 */
export const getProfile = () => http.get('/admin/admin')

/**
 * 退出登录
 * @param {{ id: number, token: string }} payload
 */
export const logout = (payload) => http.post('/admin/admin/logout', payload)

/**
 * 修改密码
 * @param {{ oldPassword: string, newPassword: string, confirmNewPassword: string }} payload
 */
export const changePassword = (payload) =>
  http.put('/admin/admin/changePassword', payload)

/**
 * 修改昵称
 * @param {{ nickname: string }} payload
 */
export const changeNickname = (payload) =>
  http.put('/admin/admin/changeNickname', payload)
