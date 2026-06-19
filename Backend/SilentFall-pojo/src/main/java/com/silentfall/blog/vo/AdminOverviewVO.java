package com.silentfall.blog.vo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 管理端总览统计VO
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AdminOverviewVO {

    // 总浏览量
    private long totalViewCount;

    // 总访客数
    private long totalVisitorCount;

    // 今日浏览量
    private long todayViewCount;

    // 今日新增访客数
    private long todayNewVisitorCount;

    // 总文章数
    private long totalArticleCount;

    // 总评论数
    private long totalCommentCount;

    // 总留言数
    private long totalMessageCount;

    // 待审核评论数
    private long pendingCommentCount;

    // 待审核留言数
    private long pendingMessageCount;
}
