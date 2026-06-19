package com.silentfall.blog.repository;

import com.silentfall.blog.entity.Articles;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;
import java.util.Optional;

public interface ArticleRepository extends MongoRepository<Articles, String> {
    Page<Articles> findByIsPublished(Integer isPublished, Pageable pageable);
    Page<Articles> findByIsPublishedAndTitleContainingIgnoreCase(Integer isPublished, String title, Pageable pageable);
    Page<Articles> findByTitleContainingIgnoreCase(String title, Pageable pageable);
    Page<Articles> findByCategoryId(String categoryId, Pageable pageable);
    Page<Articles> findByIsPublishedAndCategoryId(Integer isPublished, String categoryId, Pageable pageable);
    List<Articles> findByIsPublished(Integer isPublished);
    List<Articles> findByIsPublishedAndTagIdsContaining(Integer isPublished, String tagId);
    Optional<Articles> findBySlug(String slug);
    long countByIsPublished(Integer isPublished);
    long countByCategoryId(String categoryId);
    long countByTagIdsContaining(String tagId);
    List<Articles> findTop5ByIsPublishedOrderByViewCountDesc(Integer isPublished);
}
