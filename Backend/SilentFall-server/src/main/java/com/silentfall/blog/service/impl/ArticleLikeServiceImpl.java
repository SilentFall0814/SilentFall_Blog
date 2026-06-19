package com.silentfall.blog.service.impl;

import com.silentfall.blog.entity.ArticleLikes;
import com.silentfall.blog.repository.ArticleLikeRepository;
import com.silentfall.blog.repository.ArticleRepository;
import com.silentfall.blog.service.ArticleLikeService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Slf4j
@Service
public class ArticleLikeServiceImpl implements ArticleLikeService {

    @Autowired
    private ArticleLikeRepository articleLikeRepository;

    @Autowired
    private ArticleRepository articleRepository;

    @Autowired
    private MongoTemplate mongoTemplate;

    public void likeArticle(String articleId, String visitorId) {
        // 检查是否已经点赞
        boolean exists = articleLikeRepository.findByArticleIdAndVisitorId(articleId, visitorId).isPresent();
        if (exists) {
            return;
        }
        // 插入点赞记录
        ArticleLikes articleLikes = ArticleLikes.builder()
                .articleId(articleId)
                .visitorId(visitorId)
                .likeTime(LocalDateTime.now())
                .build();
        articleLikeRepository.save(articleLikes);
        // 文章点赞数+1
        Query query = new Query(Criteria.where("id").is(articleId));
        Update update = new Update().inc("likeCount", 1);
        mongoTemplate.updateFirst(query, update, com.silentfall.blog.entity.Articles.class);
    }

    public void unlikeArticle(String articleId, String visitorId) {
        // 检查是否已经点赞
        boolean exists = articleLikeRepository.findByArticleIdAndVisitorId(articleId, visitorId).isPresent();
        if (!exists) {
            return;
        }
        // 删除点赞记录
        articleLikeRepository.deleteByArticleIdAndVisitorId(articleId, visitorId);
        // 文章点赞数-1
        Query query = new Query(Criteria.where("id").is(articleId));
        Update update = new Update().inc("likeCount", -1);
        mongoTemplate.updateFirst(query, update, com.silentfall.blog.entity.Articles.class);
    }

    public boolean hasLiked(String articleId, String visitorId) {
        return articleLikeRepository.findByArticleIdAndVisitorId(articleId, visitorId).isPresent();
    }
}
