package com.silentfall.blog.dto;

import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * 照片DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PhotoDTO implements Serializable {

    private String id;

    // 所属相册ID
    private String albumId;

    // 原图URL
    private String imageUrl;

    // 缩略图URL
    private String imageUrlThumb;

    // 照片描述
    @Size(max = 200, message = "照片描述不能超过200字")
    private String caption;

    // 排序
    private Integer sortOrder;
}
