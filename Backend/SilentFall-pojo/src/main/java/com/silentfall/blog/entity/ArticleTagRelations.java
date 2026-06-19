package com.silentfall.blog.entity;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.io.Serializable;

/**
 * 文章-标签关联
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "article_tag_relations")
@CompoundIndex(name = "idx_article_tag", def = "{'articleId': 1, 'tagId': 1}", unique = true)
public class ArticleTagRelations implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    private String id;

    // 文章ID
    @Indexed
    private String articleId;

    // 标签ID
    @Indexed
    private String tagId;
}
