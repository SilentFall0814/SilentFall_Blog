package com.silentfall.blog.service.impl;

import com.silentfall.blog.constant.MessageConstant;
import com.silentfall.blog.context.BaseContext;
import com.silentfall.blog.dto.*;
import com.silentfall.blog.entity.Admin;
import com.silentfall.blog.exception.*;
import com.silentfall.blog.repository.AdminRepository;
import com.silentfall.blog.service.*;
import com.silentfall.blog.vo.AdminLoginVO;
import com.silentfall.blog.vo.AdminVO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class AdminServiceImpl implements AdminService {

    @Autowired
    private AdminRepository adminRepository;
    @Autowired
    private TokenService tokenService;
    @Autowired
    private EncryptPasswordService encryptPasswordService;

    /**
     * 管理员登录
     * @param adminLoginDTO
     * @return
     */
    public AdminLoginVO login(AdminLoginDTO adminLoginDTO) throws Exception {
        String username = adminLoginDTO.getUsername();
        String password = adminLoginDTO.getPassword();
        // 验证用户是否存在
        Admin admin = adminRepository.findByUsername(username)
                .orElseThrow(() -> new AccountNotFoundException(MessageConstant.ACCOUNT_NOT_FOUND));

        // 对密码进行加密
        String hashedPassword = encryptPasswordService.hashPassword(password, admin.getSalt());
        // 验证密码是否正确
        if(!hashedPassword.equals(admin.getPassword())){
            throw new PasswordErrorException(MessageConstant.PASSWORD_ERROR);
        }

        // 生成并存储token
        String token = tokenService.createAndStoreToken(admin.getId(), admin.getRole());

        return AdminLoginVO.builder()
                .id(admin.getId())
                .token(token)
                .build();
    }

    /**
     * 获取管理员信息
     * @return
     */
    public AdminVO getAdminById() {
        String adminId = BaseContext.getCurrentId();
        Admin admin = adminRepository.findById(adminId)
                .orElseThrow(() -> new AccountNotFoundException(MessageConstant.ACCOUNT_NOT_FOUND));

        // 构造管理员信息
        return AdminVO.builder()
                .id(adminId)
                .nickname(admin.getNickname())
                .role(admin.getRole())
                .build();
    }

    /**
     * 管理员退出登录
     * @param adminLogoutDTO
     */
    public void logout(AdminLogoutDTO adminLogoutDTO) {
        // 删除Redis中的token
        tokenService.logout(adminLogoutDTO.getId(), adminLogoutDTO.getToken());
    }

    /**
     * 管理员修改密码
     * @param adminChangePasswordDTO
     */
    public void changePassword(AdminChangePasswordDTO adminChangePasswordDTO) throws Exception {
        String adminId = BaseContext.getCurrentId();
        Admin admin = adminRepository.findById(adminId)
                .orElseThrow(() -> new AccountNotFoundException(MessageConstant.ACCOUNT_NOT_FOUND));
        // 验证两次输入的新密码是否一致
        if(!adminChangePasswordDTO.getNewPassword().equals(adminChangePasswordDTO.getConfirmNewPassword())){
            throw new PasswordErrorException(MessageConstant.NEW_PASSWORD_NOT_MATCH);
        }
        // 验证旧密码是否正确
        String hashedOldPassword = encryptPasswordService.hashPassword(adminChangePasswordDTO.getOldPassword(), admin.getSalt());
        if(!hashedOldPassword.equals(admin.getPassword())){
            throw new PasswordErrorException(MessageConstant.OLD_PASSWORD_ERROR);
        }
        // 获取加密后的新密码
        String hashedNewPassword = encryptPasswordService.hashPassword(adminChangePasswordDTO.getNewPassword(), admin.getSalt());
        // 验证新密码是否与旧密码一致
        if(hashedNewPassword.equals(admin.getPassword())){
            throw new PasswordErrorException(MessageConstant.NEW_PASSWORD_NOT_CHANGE);
        }
        // 更新管理员信息
        admin.setPassword(hashedNewPassword);
        adminRepository.save(admin);
        // 登出所有设备
        tokenService.logoutAll(adminId);
    }

    /**
     * 管理员更改昵称
     * @param adminChangeNicknameDTO
     */
    public void changeNickname(AdminChangeNicknameDTO adminChangeNicknameDTO) {
        String adminId = BaseContext.getCurrentId();
        Admin admin = adminRepository.findById(adminId)
                .orElseThrow(() -> new AccountNotFoundException(MessageConstant.ACCOUNT_NOT_FOUND));
        // 更新昵称
        admin.setNickname(adminChangeNicknameDTO.getNickname());
        adminRepository.save(admin);
    }
}
