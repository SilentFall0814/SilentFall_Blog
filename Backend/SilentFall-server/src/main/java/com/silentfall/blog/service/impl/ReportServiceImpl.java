package com.silentfall.blog.service.impl;

import com.silentfall.blog.constant.StatusConstant;
import com.silentfall.blog.entity.*;
import com.silentfall.blog.repository.*;
import com.silentfall.blog.service.ReportService;
import com.silentfall.blog.vo.*;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.aggregation.*;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Slf4j
public class ReportServiceImpl implements ReportService {

    @Autowired
    private MongoTemplate mongoTemplate;

    @Autowired
    private ViewRepository viewRepository;

    @Autowired
    private VisitorRepository visitorRepository;

    @Autowired
    private ArticleRepository articleRepository;

    @Autowired
    private ArticleCategoryRepository articleCategoryRepository;

    @Autowired
    private ArticleCommentRepository articleCommentRepository;

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private ArticleTagRepository articleTagRepository;

    /**
     * 获取博客统计数据
     */
    @Cacheable(value = "blogReport", key = "'stats'")
    public BlogReportVO getBlogReport() {
        long viewTotalCount = mongoTemplate.count(new Query(), Views.class);
        long viewTodayCount = countTodayViews();
        long visitorTotalCount = mongoTemplate.count(new Query(), Visitors.class);
        long categoryTotalCount = mongoTemplate.count(new Query(), ArticleCategories.class);
        long articleTotalCount = articleRepository.countByIsPublished(StatusConstant.ENABLE);
        long tagTotalCount = mongoTemplate.count(new Query(), ArticleTags.class);

        return BlogReportVO.builder()
                .viewTotalCount(viewTotalCount)
                .viewTodayCount(viewTodayCount)
                .visitorTotalCount(visitorTotalCount)
                .categoryTotalCount(categoryTotalCount)
                .articleTotalCount(articleTotalCount)
                .tagTotalCount(tagTotalCount)
                .build();
    }

    /**
     * 浏览量统计
     */
    public ViewReportVO getViewStatistics(LocalDate begin, LocalDate end) {
        List<LocalDate> dateList = getDateList(begin, end);

        // 使用MongoDB聚合查询按日期统计浏览量
        Map<LocalDate, Integer> dailyViewMap = getDailyViewStats(begin, end);

        List<Integer> viewCountList = dateList.stream()
                .map(date -> dailyViewMap.getOrDefault(date, 0))
                .collect(Collectors.toList());

        return ViewReportVO.builder()
                .dateList(String.join(",", dateList.stream().map(LocalDate::toString).collect(Collectors.toList())))
                .viewCountList(String.join(",", viewCountList.stream().map(String::valueOf).collect(Collectors.toList())))
                .build();
    }

    /**
     * 访客统计
     */
    public VisitorReportVO getVisitorStatistics(LocalDate begin, LocalDate end) {
        List<LocalDate> dateList = getDateList(begin, end);

        // 使用MongoDB聚合查询按日期统计新访客数
        Map<LocalDate, Integer> dailyNewVisitorMap = getDailyNewVisitorStats(begin, end);

        List<Integer> newVisitorCountList = dateList.stream()
                .map(date -> dailyNewVisitorMap.getOrDefault(date, 0))
                .collect(Collectors.toList());

        // 计算累计访客数
        List<Integer> totalVisitorCountList = new ArrayList<>();
        for (int i = 0; i < newVisitorCountList.size(); i++) {
            if (i == 0) {
                totalVisitorCountList.add(newVisitorCountList.get(i));
            } else {
                totalVisitorCountList.add(totalVisitorCountList.get(i - 1) + newVisitorCountList.get(i));
            }
        }

        return VisitorReportVO.builder()
                .dateList(String.join(",", dateList.stream().map(LocalDate::toString).collect(Collectors.toList())))
                .newVisitorCountList(String.join(",", newVisitorCountList.stream().map(String::valueOf).collect(Collectors.toList())))
                .totalVisitorCountList(String.join(",", totalVisitorCountList.stream().map(String::valueOf).collect(Collectors.toList())))
                .build();
    }

    /**
     * 访客省份分布统计
     */
    public ProvinceVisitorVO getProvinceDistribution() {
        // 使用MongoDB聚合查询按省份统计
        Aggregation aggregation = Aggregation.newAggregation(
                Aggregation.match(Criteria.where("province").ne(null).ne("")),
                Aggregation.group("province").count().as("count"),
                Aggregation.sort(Sort.Direction.DESC, "count"),
                Aggregation.project("count").and("_id").as("province")
        );

        List<Map> results = mongoTemplate.aggregate(aggregation, Visitors.class, Map.class).getMappedResults();

        List<String> provinceList = results.stream()
                .map(m -> String.valueOf(m.get("province")))
                .collect(Collectors.toList());
        List<Integer> countList = results.stream()
                .map(m -> ((Number) m.get("count")).intValue())
                .collect(Collectors.toList());

        return ProvinceVisitorVO.builder()
                .provinceList(String.join(",", provinceList))
                .countList(String.join(",", countList.stream().map(String::valueOf).collect(Collectors.toList())))
                .build();
    }

    /**
     * 文章访问量排行前十
     */
    public ArticleViewTop10VO getArticleViewTop10() {
        // MongoDB 中 isPublished 是 Integer 类型，必须用 1 查询而非 true
        Query query = new Query(Criteria.where("isPublished").is(StatusConstant.ENABLE))
                .with(Sort.by(Sort.Direction.DESC, "viewCount"))
                .limit(10);
        List<Articles> topArticles = mongoTemplate.find(query, Articles.class);

        List<String> titleList = topArticles.stream()
                .map(Articles::getTitle)
                .collect(Collectors.toList());
        List<Integer> viewCountList = topArticles.stream()
                .map(a -> a.getViewCount() != null ? a.getViewCount().intValue() : 0)
                .collect(Collectors.toList());

        return ArticleViewTop10VO.builder()
                .titleList(titleList)
                .viewCountList(viewCountList)
                .build();
    }

    /**
     * 获取管理端总览数据
     * 缓存 2 分钟，避免每次访问仪表盘都执行 9 次 count 查询
     */
    @Cacheable(value = "adminOverview", key = "'overview'")
    public AdminOverviewVO getAdminOverview() {
        long totalViewCount = mongoTemplate.count(new Query(), Views.class);
        long totalVisitorCount = mongoTemplate.count(new Query(), Visitors.class);
        long todayViewCount = countTodayViews();
        long todayNewVisitorCount = countTodayVisitors();
        long totalArticleCount = articleRepository.countByIsPublished(StatusConstant.ENABLE);
        long totalCommentCount = mongoTemplate.count(new Query(), ArticleComments.class);
        long totalMessageCount = mongoTemplate.count(new Query(), Messages.class);
        long pendingCommentCount = mongoTemplate.count(new Query(Criteria.where("isApproved").is(0)), ArticleComments.class);
        long pendingMessageCount = mongoTemplate.count(new Query(Criteria.where("isApproved").is(0)), Messages.class);

        return AdminOverviewVO.builder()
                .totalViewCount(totalViewCount)
                .totalVisitorCount(totalVisitorCount)
                .todayViewCount(todayViewCount)
                .todayNewVisitorCount(todayNewVisitorCount)
                .totalArticleCount(totalArticleCount)
                .totalCommentCount(totalCommentCount)
                .totalMessageCount(totalMessageCount)
                .pendingCommentCount(pendingCommentCount)
                .pendingMessageCount(pendingMessageCount)
                .build();
    }

    // ===== 辅助方法 =====

    /**
     * 统计今日浏览量
     */
    private long countTodayViews() {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        Query query = new Query(Criteria.where("viewTime").gte(startOfDay));
        return mongoTemplate.count(query, Views.class);
    }

    /**
     * 统计今日新访客数
     */
    private long countTodayVisitors() {
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();
        Query query = new Query(Criteria.where("firstVisitTime").gte(startOfDay));
        return mongoTemplate.count(query, Visitors.class);
    }

    /**
     * 按日期统计浏览量
     */
    private Map<LocalDate, Integer> getDailyViewStats(LocalDate begin, LocalDate end) {
        LocalDateTime startDateTime = begin.atStartOfDay();
        LocalDateTime endDateTime = end.atTime(LocalTime.MAX);

        Aggregation aggregation = Aggregation.newAggregation(
                Aggregation.match(Criteria.where("viewTime").gte(startDateTime).lte(endDateTime)),
                Aggregation.project()
                        .andExpression("year(viewTime)").as("year")
                        .andExpression("month(viewTime)").as("month")
                        .andExpression("dayOfMonth(viewTime)").as("day")
                        .and("viewTime").as("date"),
                Aggregation.group(
                        Fields.from(
                                Fields.field("year", "year"),
                                Fields.field("month", "month"),
                                Fields.field("day", "day")
                        )
                ).count().as("count"),
                Aggregation.project("count")
                        .and("_id.year").as("year")
                        .and("_id.month").as("month")
                        .and("_id.day").as("day")
        );

        List<Map> results = mongoTemplate.aggregate(aggregation, Views.class, Map.class).getMappedResults();

        return results.stream().collect(Collectors.toMap(
                m -> LocalDate.of(
                        ((Number) m.get("year")).intValue(),
                        ((Number) m.get("month")).intValue(),
                        ((Number) m.get("day")).intValue()
                ),
                m -> ((Number) m.get("count")).intValue(),
                (a, b) -> a
        ));
    }

    /**
     * 按日期统计新访客数
     */
    private Map<LocalDate, Integer> getDailyNewVisitorStats(LocalDate begin, LocalDate end) {
        LocalDateTime startDateTime = begin.atStartOfDay();
        LocalDateTime endDateTime = end.atTime(LocalTime.MAX);

        Aggregation aggregation = Aggregation.newAggregation(
                Aggregation.match(Criteria.where("firstVisitTime").gte(startDateTime).lte(endDateTime)),
                Aggregation.project()
                        .andExpression("year(firstVisitTime)").as("year")
                        .andExpression("month(firstVisitTime)").as("month")
                        .andExpression("dayOfMonth(firstVisitTime)").as("day"),
                Aggregation.group(
                        Fields.from(
                                Fields.field("year", "year"),
                                Fields.field("month", "month"),
                                Fields.field("day", "day")
                        )
                ).count().as("count"),
                Aggregation.project("count")
                        .and("_id.year").as("year")
                        .and("_id.month").as("month")
                        .and("_id.day").as("day")
        );

        List<Map> results = mongoTemplate.aggregate(aggregation, Visitors.class, Map.class).getMappedResults();

        return results.stream().collect(Collectors.toMap(
                m -> LocalDate.of(
                        ((Number) m.get("year")).intValue(),
                        ((Number) m.get("month")).intValue(),
                        ((Number) m.get("day")).intValue()
                ),
                m -> ((Number) m.get("count")).intValue(),
                (a, b) -> a
        ));
    }

    /**
     * 获取指定日期范围内的日期列表
     */
    private List<LocalDate> getDateList(LocalDate begin, LocalDate end) {
        List<LocalDate> dateList = new ArrayList<>();
        dateList.add(begin);
        while (!begin.equals(end)) {
            begin = begin.plusDays(1);
            dateList.add(begin);
        }
        return dateList;
    }
}
