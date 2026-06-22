package com.silentfall.blog.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 照片
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "photo")
public class Photo implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    private String id;

    // 所属相册ID
    private String albumId;

    // 原图URL（大图模式用）
    private String imageUrl;

    // 缩略图URL（列表/卡片用）
    private String imageUrlThumb;

    // 照片描述
    private String caption;

    // 排序，越小越靠前
    private Integer sortOrder;

    // 创建时间
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createTime;

    // 更新时间
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updateTime;
}
