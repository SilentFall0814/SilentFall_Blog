package com.silentfall.blog.vo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * 相册列表VO（画廊首页用）
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AlbumVO implements Serializable {

    private String id;

    // 相册名称
    private String title;

    // 相册描述
    private String description;

    // 封面缩略图URL（列表页用，性能优化）
    private String coverImageThumb;

    // 拍摄日期，格式 yyyy-MM-dd
    private String date;

    // 照片数量
    private Integer photoCount;

    // 排序
    private Integer sort;
}
