package com.silentfall.blog.service;

/**
 * Token服务
 */
public interface TokenService {

    /**
     * 创建并保存token
     */
    String createAndStoreToken(String userId, Integer role);

    /**
     * 验证token有效性
     */
    boolean isValidToken(String userId, String token);

    /**
     * 退出登录 - 删除token
     */
    void logout(String userId, String token);

    /**
     * 退出登录 - 删除所有token
     */
    void logoutAll(String userId);
}
