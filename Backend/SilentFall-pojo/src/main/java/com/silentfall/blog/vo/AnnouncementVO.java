package com.silentfall.blog.vo;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 公告VO（博客端公开返回）
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AnnouncementVO implements Serializable {

    private String id;

    // 公告内容
    private String content;

    // 发布时间
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createdAt;
}
