package com.silentfall.blog.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * 相册分页查询DTO
 */
@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class AlbumPageQueryDTO {

    // 页码
    private int page;

    // 每页显示数量
    private int pageSize;

    // 相册名称（模糊搜索）
    private String title;
}
