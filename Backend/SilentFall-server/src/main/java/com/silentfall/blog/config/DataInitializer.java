package com.silentfall.blog.config;

import com.silentfall.blog.constant.StatusConstant;
import com.silentfall.blog.entity.Admin;
import com.silentfall.blog.repository.AdminRepository;
import com.silentfall.blog.service.EncryptPasswordService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.security.SecureRandom;
import java.time.LocalDateTime;

/**
 * 数据初始化器
 * 启动时检查 admin 集合，若为空则创建默认管理员账号
 */
@Slf4j
@Component
public class DataInitializer implements CommandLineRunner {

    @Autowired
    private AdminRepository adminRepository;
    @Autowired
    private EncryptPasswordService encryptPasswordService;

    @Override
    public void run(String... args) throws Exception {
        if (adminRepository.count() > 0) {
            return;
        }
        // 生成随机盐值
        SecureRandom random = new SecureRandom();
        byte[] saltBytes = new byte[16];
        random.nextBytes(saltBytes);
        StringBuilder saltBuilder = new StringBuilder();
        for (byte b : saltBytes) {
            saltBuilder.append(String.format("%02x", b));
        }
        String salt = saltBuilder.toString();

        // 使用 SHA-256 + 盐值加密密码
        String hashedPassword = encryptPasswordService.hashPassword("LJBljb0814", salt);

        Admin admin = Admin.builder()
                .username("SilentFall")
                .password(hashedPassword)
                .salt(salt)
                .nickname("SilentFall")
                .role(StatusConstant.ENABLE)
                .createTime(LocalDateTime.now())
                .updateTime(LocalDateTime.now())
                .build();
        adminRepository.save(admin);
        log.info("默认管理员账号创建成功: username=SilentFall");
    }
}
