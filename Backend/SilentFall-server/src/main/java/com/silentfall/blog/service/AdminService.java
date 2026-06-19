package com.silentfall.blog.service;

import com.silentfall.blog.dto.*;
import com.silentfall.blog.vo.AdminLoginVO;
import com.silentfall.blog.vo.AdminVO;

public interface AdminService {

    /**
     * 管理员登录
     * @param adminLoginDTO
     * @return
     */
    AdminLoginVO login(AdminLoginDTO adminLoginDTO) throws Exception;

    /**
     * 获取管理员信息
     * @return
     */
    AdminVO getAdminById();

    /**
     * 管理员退出登录
     * @param adminLogoutDTO
     */
    void logout(AdminLogoutDTO adminLogoutDTO);

    /**
     * 管理员修改密码
     * @param adminChangePasswordDTO
     */
    void changePassword(AdminChangePasswordDTO adminChangePasswordDTO) throws Exception;

    /**
     * 管理员更改昵称
     * @param adminChangeNicknameDTO
     */
    void changeNickname(AdminChangeNicknameDTO adminChangeNicknameDTO);
}
