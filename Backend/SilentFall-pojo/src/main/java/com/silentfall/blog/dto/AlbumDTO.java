package com.silentfall.blog.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * 相册DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AlbumDTO implements Serializable {

    private String id;

    // 相册名称
    @NotBlank(message = "相册名称不能为空")
    @Size(max = 50, message = "相册名称不能超过50字")
    private String title;

    // 相册描述
    @Size(max = 500, message = "相册描述不能超过500字")
    private String description;

    // 封面原图URL
    private String coverImage;

    // 封面缩略图URL
    private String coverImageThumb;

    // 拍摄日期，格式 yyyy-MM-dd
    @NotBlank(message = "拍摄日期不能为空")
    private String date;

    // 排序，越小越靠前
    private Integer sort;

    // 是否可见，0-隐藏 1-可见
    private Integer isVisible;
}
