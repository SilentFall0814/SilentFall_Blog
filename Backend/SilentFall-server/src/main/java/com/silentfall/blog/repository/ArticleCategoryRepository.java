package com.silentfall.blog.repository;

import com.silentfall.blog.entity.ArticleCategories;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;

public interface ArticleCategoryRepository extends MongoRepository<ArticleCategories, String> {
    List<ArticleCategories> findByIsVisible(Integer isVisible);
    Optional<ArticleCategories> findBySlug(String slug);
}
