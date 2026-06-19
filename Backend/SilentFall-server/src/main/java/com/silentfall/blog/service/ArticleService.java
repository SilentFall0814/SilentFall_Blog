package com.silentfall.blog.service;

import com.silentfall.blog.dto.ArticleDTO;
import com.silentfall.blog.dto.ArticlePageQueryDTO;
import com.silentfall.blog.entity.Articles;
import com.silentfall.blog.result.PageResult;
import com.silentfall.blog.vo.ArticleArchiveVO;
import com.silentfall.blog.vo.BlogArticleDetailVO;

import java.util.List;

/**
 * 文章服务
 */
public interface ArticleService {

    /**
     * 创建文章
     * @param articleDTO
     */
    void createArticle(ArticleDTO articleDTO);

    /**
     * 分页条件查询文章列表（含草稿）
     * @param articlePageQueryDTO
     * @return
     */
    PageResult pageQuery(ArticlePageQueryDTO articlePageQueryDTO);

    /**
     * 根据ID获取文章详情
     * @param id
     * @return
     */
    Articles getById(String id);

    /**
     * 更新文章
     * @param articleDTO
     */
    void updateArticle(ArticleDTO articleDTO);

    /**
     * 批量删除文章
     * @param ids
     */
    void batchDelete(List<String> ids);

    /**
     * 发布/取消发布文章
     * @param id
     * @param isPublished
     */
    void publishOrCancel(String id, Integer isPublished);

    /**
     * 置顶/取消置顶文章
     * @param id
     * @param isTop
     */
    void toggleTop(String id, Integer isTop);

    /**
     * 文章搜索（标题、内容）
     * @param keyword
     * @param page
     * @param pageSize
     * @return
     */
    PageResult search(String keyword, int page, int pageSize);

    // ===== 博客端方法 =====

    /**
     * 获取已发布文章列表（分页）
     */
    PageResult getPublishedPage(int page, int pageSize);

    /**
     * 根据slug获取文章详情（浏览量+1）
     */
    BlogArticleDetailVO getBySlug(String slug);

    /**
     * 文章浏览量+1（写入Redis，基于文章ID）
     */
    void incrementViewCount(String articleId);

    /**
     * 根据分类ID获取已发布文章列表（分页）
     */
    PageResult getPublishedByCategoryId(String categoryId, int page, int pageSize);

    /**
     * 获取文章归档（按年月分组）
     */
    List<ArticleArchiveVO> getArchive();

    /**
     * 博客端文章搜索（仅已发布）
     */
    PageResult searchPublished(String keyword, int page, int pageSize);

    /**
     * 根据标签ID获取已发布文章列表
     */
    PageResult getPublishedByTagId(String tagId, int page, int pageSize);
}
