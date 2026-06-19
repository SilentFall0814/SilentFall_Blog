package com.silentfall.blog.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 文章点赞
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "article_likes")
public class ArticleLikes implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    private String id;

    // 文章ID
    @Indexed
    private String articleId;

    // 访客ID
    @Indexed
    private String visitorId;

    // 点赞时间
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime likeTime;
}
