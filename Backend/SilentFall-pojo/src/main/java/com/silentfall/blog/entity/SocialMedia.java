package com.silentfall.blog.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 社交媒体
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "social_media")
public class SocialMedia implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    private String id;

    // 名称
    private String name;

    // 图标类名
    private String icon;

    // 链接
    private String link;

    // 排序，越小越靠前
    private Integer sort;

    // 是否可见
    private Integer isVisible;

    // 创建时间
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createTime;

    // 更新时间
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updateTime;
}
