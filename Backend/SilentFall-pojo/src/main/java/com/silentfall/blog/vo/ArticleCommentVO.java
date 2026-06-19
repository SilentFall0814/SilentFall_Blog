package com.silentfall.blog.vo;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 文章评论VO（树形结构）
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ArticleCommentVO implements Serializable {
    private static final long serialVersionUID = 1L;
    private String id;
    private String articleId;
    private String rootId;
    private String parentId;
    private String parentNickname;
    private String content;
    private String contentHtml;
    private Integer isMarkdown;
    private String visitorId;
    private String nickname;
    private String emailOrQq;
    private String location;
    private String userAgentOs;
    private String userAgentBrowser;
    private Integer isApproved;
    private Integer isSecret;
    private Integer isAdminReply;
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createTime;
    /**
     * 子评论列表（仅根评论有值）
     */
    private List<ArticleCommentVO> children;
}
