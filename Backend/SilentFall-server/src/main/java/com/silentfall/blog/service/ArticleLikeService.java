package com.silentfall.blog.service;

public interface ArticleLikeService {

    /**
     * 点赞文章
     */
    void likeArticle(String articleId, String visitorId);

    /**
     * 取消点赞
     */
    void unlikeArticle(String articleId, String visitorId);

    /**
     * 检查是否已点赞
     */
    boolean hasLiked(String articleId, String visitorId);
}
