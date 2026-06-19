package com.silentfall.blog.properties;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "silentfall.local-storage")
@Data
public class LocalStorageProperties {
    /**
     * 本地存储路径
     */
    private String basePath = "./uploads";

    /**
     * 访问URL前缀
     */
    private String urlPrefix = "/uploads";
}
