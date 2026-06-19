package com.silentfall.blog.repository;

import com.silentfall.blog.entity.ArticleTags;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;

public interface ArticleTagRepository extends MongoRepository<ArticleTags, String> {
    List<ArticleTags> findByIsVisible(Integer isVisible);
    Optional<ArticleTags> findBySlug(String slug);
}
