package com.silentfall.blog.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 照片分页查询DTO
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class PhotoPageQueryDTO {

    // 页码
    private int page;

    // 每页显示数量
    private int pageSize;

    // 所属相册ID
    private String albumId;
}
