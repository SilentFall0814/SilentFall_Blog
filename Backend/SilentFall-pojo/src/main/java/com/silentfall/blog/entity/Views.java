package com.silentfall.blog.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 浏览
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "view")
public class Views implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    private String id;

    // 访客ID
    private String visitorId;

    // 页面路径
    @Indexed
    private String pagePath;

    // 来源URL
    private String referer;

    // 页面标题
    private String pageTitle;

    // IP地址
    private String ipAddress;

    // 用户代理
    private String userAgent;

    // 访问时间
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime viewTime;
}
