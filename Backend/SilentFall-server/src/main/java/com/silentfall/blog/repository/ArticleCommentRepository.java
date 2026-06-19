package com.silentfall.blog.repository;

import com.silentfall.blog.entity.ArticleComments;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface ArticleCommentRepository extends MongoRepository<ArticleComments, String> {
    List<ArticleComments> findByArticleIdAndIsApprovedOrderByCreateTimeDesc(String articleId, Integer isApproved);
    Page<ArticleComments> findByIsApprovedOrderByCreateTimeDesc(Integer isApproved, Pageable pageable);
    Page<ArticleComments> findAllByOrderByCreateTimeDesc(Pageable pageable);
    long countByArticleId(String articleId);
    long countByIsApproved(Integer isApproved);
    List<ArticleComments> findByArticleIdAndRootIdOrderByCreateTimeAsc(String articleId, String rootId);
    List<ArticleComments> findByRootId(String rootId);
}
