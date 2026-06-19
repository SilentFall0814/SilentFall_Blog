package com.silentfall.blog.vo;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 博客端文章列表VO（不含文章内容）
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BlogArticleVO implements Serializable {
    private static final long serialVersionUID = 1L;
    private String id;
    private String title;
    private String slug;
    private String summary;
    private String coverImage;
    private String categoryId;
    private String categoryName;
    private Long viewCount;
    private Long likeCount;
    private Long commentCount;
    private Long wordCount;
    private Long readingTime;
    private Integer isTop;
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime publishTime;
}
