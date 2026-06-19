package com.silentfall.blog.properties;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "silentfall.jwt")
@Data
public class JwtProperties {
    /**
     * jwt令牌相关配置
     */
    private String secretKey;
    private Long ttl;
    private String tokenName;
}
