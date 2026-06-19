package com.silentfall.blog.vo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class BlogReportVO {

    // 总浏览量
    private long viewTotalCount;

    // 今日浏览量
    private long viewTodayCount;

    // 总访客数
    private long visitorTotalCount;

    // 总文章分类数
    private long categoryTotalCount;

    // 总文章标签数
    private long tagTotalCount;

    // 总文章数
    private long articleTotalCount;
}
