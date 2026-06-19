package com.silentfall.blog.repository;

import com.silentfall.blog.entity.ArticleTagRelations;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface ArticleTagRelationRepository extends MongoRepository<ArticleTagRelations, String> {
    List<ArticleTagRelations> findByArticleId(String articleId);
    List<ArticleTagRelations> findByTagId(String tagId);
    long countByTagId(String tagId);
    void deleteByArticleId(String articleId);
    void deleteByTagId(String tagId);
    void deleteByArticleIdAndTagId(String articleId, String tagId);
}
