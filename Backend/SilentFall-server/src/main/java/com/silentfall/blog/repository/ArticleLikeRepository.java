package com.silentfall.blog.repository;

import com.silentfall.blog.entity.ArticleLikes;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface ArticleLikeRepository extends MongoRepository<ArticleLikes, String> {
    Optional<ArticleLikes> findByArticleIdAndVisitorId(String articleId, String visitorId);
    long countByArticleId(String articleId);
    void deleteByArticleIdAndVisitorId(String articleId, String visitorId);
}
