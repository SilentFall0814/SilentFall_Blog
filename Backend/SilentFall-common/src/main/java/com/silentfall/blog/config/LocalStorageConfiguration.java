package com.silentfall.blog.config;

import com.silentfall.blog.properties.LocalStorageProperties;
import com.silentfall.blog.utils.LocalStorageUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * 本地文件存储配置类，用于创建LocalStorageUtil对象
 */
@Configuration
@Slf4j
public class LocalStorageConfiguration {

    @Bean
    @ConditionalOnMissingBean
    public LocalStorageUtil localStorageUtil(LocalStorageProperties localStorageProperties) {
        log.info("本地存储路径: {}", localStorageProperties.getBasePath());
        return new LocalStorageUtil(
                localStorageProperties.getBasePath(),
                localStorageProperties.getUrlPrefix()
        );
    }
}
