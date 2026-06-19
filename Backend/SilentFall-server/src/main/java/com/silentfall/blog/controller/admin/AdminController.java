package com.silentfall.blog.controller.admin;

import com.silentfall.blog.annotation.RateLimit;
import com.silentfall.blog.dto.*;
import com.silentfall.blog.result.Result;
import com.silentfall.blog.service.AdminService;
import com.silentfall.blog.vo.AdminLoginVO;
import com.silentfall.blog.vo.AdminVO;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

/**
 * 管理端管理员接口
 */
@RestController
@RequestMapping("/admin/admin")
@Slf4j
public class AdminController {

    @Autowired
    private AdminService adminService;

    /**
     * 管理员登录
     */
    @PostMapping("/login")
    @RateLimit(type = RateLimit.Type.IP, tokens = 5, burstCapacity = 8,
            timeWindow = 60, message = "操作过于频繁，请稍后再试")
    public Result<AdminLoginVO> AdminLogin(@Valid @RequestBody AdminLoginDTO adminLoginDTO) throws Exception {
        log.info("管理员登录：{}", adminLoginDTO);
        AdminLoginVO adminLoginVO = adminService.login(adminLoginDTO);
        return Result.success(adminLoginVO);
    }

    /**
     * 获取管理员信息
     */
    @GetMapping
    public Result<AdminVO> getAdminInfo() {
        AdminVO adminVO = adminService.getAdminById();
        return Result.success(adminVO);
    }

    /**
     * 管理员退出登录
     */
    @PostMapping("/logout")
    public Result logout(@RequestBody AdminLogoutDTO adminLogoutDTO) {
        log.info("管理员退出登录：{}", adminLogoutDTO);
        adminService.logout(adminLogoutDTO);
        return Result.success();
    }

    /**
     * 管理员修改密码
     */
    @PutMapping("/changePassword")
    public Result changePassword(@Valid @RequestBody AdminChangePasswordDTO adminChangePasswordDTO) throws Exception {
        log.info("管理员修改密码：{}", adminChangePasswordDTO);
        adminService.changePassword(adminChangePasswordDTO);
        return Result.success();
    }

    /**
     * 管理员更改昵称
     */
    @PutMapping("/changeNickname")
    public Result changeNickname(@Valid @RequestBody AdminChangeNicknameDTO adminChangeNicknameDTO) {
        log.info("管理员更改昵称：{}", adminChangeNicknameDTO);
        adminService.changeNickname(adminChangeNicknameDTO);
        return Result.success();
    }
}
