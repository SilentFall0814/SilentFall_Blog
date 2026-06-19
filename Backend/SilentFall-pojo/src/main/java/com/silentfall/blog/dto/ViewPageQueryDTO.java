package com.silentfall.blog.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class ViewPageQueryDTO {

    // 页码
    private int page;

    // 每页显示数量
    private int pageSize;

    // 页面路径
    private String pagePath;

    // 来源URL
    private String referer;

    // 访客ID
    private String visitorId;

    // 开始时间
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime beginTime;

    // 结束时间
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime endTime;
}
