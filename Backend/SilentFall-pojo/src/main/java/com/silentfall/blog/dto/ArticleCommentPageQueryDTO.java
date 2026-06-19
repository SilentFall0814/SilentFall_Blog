package com.silentfall.blog.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 文章评论分页查询DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ArticleCommentPageQueryDTO implements Serializable {

    // 页码
    private Integer page;

    // 每页显示数量
    private Integer pageSize;

    // 文章ID
    private String articleId;

    // 是否审核通过，0-否，1-是
    private Integer isApproved;

    // 开始时间
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime beginTime;

    // 结束时间
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime endTime;
}
