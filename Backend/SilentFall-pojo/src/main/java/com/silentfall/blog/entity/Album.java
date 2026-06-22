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
 * 相册
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "album")
public class Album implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    private String id;

    // 相册名称
    private String title;

    // 相册描述
    private String description;

    // 封面原图URL
    private String coverImage;

    // 封面缩略图URL（列表页用）
    private String coverImageThumb;

    // 拍摄日期，格式 yyyy-MM-dd
    private String date;

    // 照片数量（冗余字段，加速列表渲染）
    private Integer photoCount;

    // 排序，越小越靠前
    private Integer sort;

    // 是否可见，0-隐藏 1-可见
    private Integer isVisible;

    // 创建时间
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createTime;

    // 更新时间
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updateTime;
}
