package com.silentfall.blog.service;

import com.silentfall.blog.dto.ArticleCommentDTO;
import com.silentfall.blog.dto.ArticleCommentPageQueryDTO;
import com.silentfall.blog.dto.ArticleCommentReplyDTO;
import com.silentfall.blog.entity.ArticleComments;
import com.silentfall.blog.result.PageResult;
import com.silentfall.blog.vo.ArticleCommentVO;
import jakarta.servlet.http.HttpServletRequest;

import java.util.List;

/**
 * 文章评论服务
 */
public interface ArticleCommentService {

    /**
     * 分页条件查询评论（时间、是否审核）
     * @param articleCommentPageQueryDTO
     * @return
     */
    PageResult pageQuery(ArticleCommentPageQueryDTO articleCommentPageQueryDTO);

    /**
     * 根据文章ID查询评论
     * @param articleId
     * @return
     */
    List<ArticleComments> getByArticleId(String articleId);

    /**
     * 批量审核通过评论
     * @param ids
     */
    void batchApprove(List<String> ids);

    /**
     * 批量删除评论
     * @param ids
     */
    void batchDelete(List<String> ids);

    /**
     * 管理员回复评论
     * @param articleCommentReplyDTO
     * @param request
     */
    void adminReply(ArticleCommentReplyDTO articleCommentReplyDTO, HttpServletRequest request);

    // ===== 博客端方法 =====

    /**
     * 根据文章ID获取评论列表（树形结构，已审核 + 当前访客的未审核）
     */
    List<ArticleCommentVO> getCommentTree(String articleId, String visitorId);

    /**
     * 访客提交评论
     */
    void submitComment(ArticleCommentDTO articleCommentDTO, HttpServletRequest request);

    /**
     * 访客编辑评论
     */
    void editComment(com.silentfall.blog.dto.ArticleCommentEditDTO editDTO);

    /**
     * 访客删除评论
     */
    void visitorDeleteComment(String id, String visitorId);
}
