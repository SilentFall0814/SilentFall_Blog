package com.silentfall.blog.vo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * 照片VO（前台展示用）
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class PhotoVO implements Serializable {

    private String id;

    // 所属相册ID
    private String albumId;

    // 原图URL（大图模式用）
    private String imageUrl;

    // 缩略图URL（列表/卡片用）
    private String imageUrlThumb;

    // 照片描述
    private String caption;

    // 排序
    private Integer sortOrder;

    // 所属相册名称（跨相册搜索结果用）
    private String albumTitle;
}
