package com.silentfall.blog.vo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * 相册详情VO（相册详情页用，含封面原图）
 */
@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class AlbumDetailVO implements Serializable {

    private String id;

    // 相册名称
    private String title;

    // 相册描述
    private String description;

    // 封面原图URL
    private String coverImage;

    // 拍摄日期
    private String date;

    // 照片数量
    private Integer photoCount;

    // 排序
    private Integer sort;
}
