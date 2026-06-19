package com.silentfall.blog.service.impl;

import com.silentfall.blog.constant.MessageConstant;
import com.silentfall.blog.constant.StatusConstant;
import com.silentfall.blog.dto.ArticleDTO;
import com.silentfall.blog.dto.ArticlePageQueryDTO;
import com.silentfall.blog.entity.Articles;
import com.silentfall.blog.entity.ArticleTags;
import com.silentfall.blog.entity.ArticleTagRelations;
import com.silentfall.blog.exception.ArticleException;
import com.silentfall.blog.repository.ArticleRepository;
import com.silentfall.blog.repository.ArticleTagRepository;
import com.silentfall.blog.repository.ArticleTagRelationRepository;
import com.silentfall.blog.result.PageResult;
import com.silentfall.blog.service.ArticleService;
import com.silentfall.blog.utils.MarkdownUtil;
import com.silentfall.blog.vo.ArticleArchiveItemVO;
import com.silentfall.blog.vo.ArticleArchiveVO;
import com.silentfall.blog.vo.ArticleVO;
import com.silentfall.blog.vo.BlogArticleDetailVO;
import com.silentfall.blog.vo.BlogArticleVO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 文章服务实现
 */
@Slf4j
@Service
public class ArticleServiceImpl implements ArticleService {

    @Autowired
    private ArticleRepository articleRepository;

    @Autowired
    private ArticleTagRepository articleTagRepository;

    @Autowired
    private ArticleTagRelationRepository articleTagRelationRepository;

    @Autowired
    private RedisTemplate<String, Object> redisTemplate;

    @Autowired
    private MongoTemplate mongoTemplate;

    private static final String VIEW_COUNT_KEY = "article:viewCount";

    /**
     * 创建文章
     * @param articleDTO
     */
    @Caching(evict = {
            @CacheEvict(value = "articleList", allEntries = true),
            @CacheEvict(value = "articleDetail", allEntries = true),
            @CacheEvict(value = "articleArchive", allEntries = true),
            @CacheEvict(value = "blogReport", allEntries = true)
    })
    public void createArticle(ArticleDTO articleDTO) {
        Articles articles = new Articles();
        BeanUtils.copyProperties(articleDTO, articles);

        boolean firstPublishNow = StatusConstant.ENABLE.equals(articleDTO.getIsPublished());

        // 优先使用前端编辑器渲染的HTML，否则后端转换
        if (articleDTO.getContentHtml() != null && !articleDTO.getContentHtml().isBlank()) {
            articles.setContentHtml(articleDTO.getContentHtml());
        } else {
            String rawContent = articleDTO.getContentMarkdown();
            String contentHtml = MarkdownUtil.isHtml(rawContent)
                    ? MarkdownUtil.sanitize(rawContent)
                    : MarkdownUtil.toHtml(rawContent);
            articles.setContentHtml(contentHtml);
        }

        // 计算字数和阅读时间
        String plainText = articleDTO.getContentMarkdown();
        long wordCount = countWords(plainText);
        long readingTime = Math.max(1, wordCount / 300); // 按每分钟300字估算
        articles.setWordCount(wordCount);
        articles.setReadingTime(readingTime);

        // 设置发布信息
        if (firstPublishNow) {
            articles.setPublishTime(LocalDateTime.now());
        }

        // 初始化统计字段和默认状态
        articles.setViewCount(0L);
        articles.setLikeCount(0L);
        articles.setCommentCount(0L);
        if (articles.getIsTop() == null) {
            articles.setIsTop(0);
        }

        articleRepository.save(articles);

        // 保存文章-标签关联
        if (articleDTO.getTagIds() != null && !articleDTO.getTagIds().isEmpty()) {
            List<ArticleTagRelations> relations = articleDTO.getTagIds().stream()
                    .map(tagId -> ArticleTagRelations.builder()
                            .articleId(articles.getId())
                            .tagId(tagId)
                            .build())
                    .collect(Collectors.toList());
            articleTagRelationRepository.saveAll(relations);
        }
    }

    /**
     * 分页条件查询文章列表（含草稿）
     * @param articlePageQueryDTO
     * @return
     */
    public PageResult pageQuery(ArticlePageQueryDTO articlePageQueryDTO) {
        int page = articlePageQueryDTO.getPage();
        int pageSize = articlePageQueryDTO.getPageSize();
        Pageable pageable = PageRequest.of(page - 1, pageSize, Sort.by(Sort.Direction.DESC, "createdAt"));

        // 构建查询条件
        Query query = new Query().with(pageable);
        Criteria criteria = new Criteria();

        // 根据DTO中的条件动态构建查询
        if (articlePageQueryDTO.getTitle() != null && !articlePageQueryDTO.getTitle().isEmpty()) {
            criteria.and("title").regex(articlePageQueryDTO.getTitle(), "i");
        }
        if (articlePageQueryDTO.getCategoryId() != null && !articlePageQueryDTO.getCategoryId().isEmpty()) {
            criteria.and("categoryId").is(articlePageQueryDTO.getCategoryId());
        }
        if (articlePageQueryDTO.getIsPublished() != null) {
            criteria.and("isPublished").is(articlePageQueryDTO.getIsPublished());
        }

        if (criteria.getCriteriaObject().keySet().size() > 0) {
            query.addCriteria(criteria);
        }

        long total = mongoTemplate.count(query, Articles.class);
        List<Articles> articlesList = mongoTemplate.find(query, Articles.class);

        // 转换为ArticleVO
        List<ArticleVO> voList = articlesList.stream().map(this::convertToArticleVO).collect(Collectors.toList());

        return new PageResult(total, voList);
    }

    /**
     * 根据ID获取文章详情
     * @param id
     * @return
     */
    public Articles getById(String id) {
        Articles articles = articleRepository.findById(id)
                .orElseThrow(() -> new ArticleException(MessageConstant.ARTICLE_NOT_FOUND));
        // 填充标签ID列表，用于管理端编辑时回显
        List<ArticleTagRelations> relations = articleTagRelationRepository.findByArticleId(id);
        List<String> tagIds = relations.stream().map(ArticleTagRelations::getTagId).collect(Collectors.toList());
        articles.setTagIds(tagIds);
        return articles;
    }

    /**
     * 更新文章
     * @param articleDTO
     */
    @Caching(evict = {
            @CacheEvict(value = "articleList", allEntries = true),
            @CacheEvict(value = "articleDetail", allEntries = true),
            @CacheEvict(value = "articleArchive", allEntries = true),
            @CacheEvict(value = "blogReport", allEntries = true)
    })
    public void updateArticle(ArticleDTO articleDTO) {
        Articles articles = articleRepository.findById(articleDTO.getId())
                .orElseThrow(() -> new ArticleException(MessageConstant.ARTICLE_NOT_FOUND));

        boolean firstPublishNow = articles.getPublishTime() == null
                && StatusConstant.ENABLE.equals(articleDTO.getIsPublished());

        BeanUtils.copyProperties(articleDTO, articles);

        // 如果从草稿切换到发布状态且尚无发布时间，设置发布时间
        if (firstPublishNow) {
            articles.setPublishTime(LocalDateTime.now());
        }

        // 如果Markdown内容有更新，重新生成HTML并计算字数
        if (articleDTO.getContentMarkdown() != null) {
            // 优先使用前端编辑器渲染的HTML
            if (articleDTO.getContentHtml() != null && !articleDTO.getContentHtml().isBlank()) {
                articles.setContentHtml(articleDTO.getContentHtml());
            } else {
                String raw = articleDTO.getContentMarkdown();
                String contentHtml = MarkdownUtil.isHtml(raw)
                        ? MarkdownUtil.sanitize(raw)
                        : MarkdownUtil.toHtml(raw);
                articles.setContentHtml(contentHtml);
            }

            long wordCount = countWords(articleDTO.getContentMarkdown());
            long readingTime = Math.max(1, wordCount / 300);
            articles.setWordCount(wordCount);
            articles.setReadingTime(readingTime);
        }

        articleRepository.save(articles);

        // 更新文章-标签关联
        if (articleDTO.getTagIds() != null) {
            articleTagRelationRepository.deleteByArticleId(articleDTO.getId());
            if (!articleDTO.getTagIds().isEmpty()) {
                List<ArticleTagRelations> relations = articleDTO.getTagIds().stream()
                        .map(tagId -> ArticleTagRelations.builder()
                                .articleId(articleDTO.getId())
                                .tagId(tagId)
                                .build())
                        .collect(Collectors.toList());
                articleTagRelationRepository.saveAll(relations);
            }
        }
    }

    /**
     * 批量删除文章
     * @param ids
     */
    @Caching(evict = {
            @CacheEvict(value = "articleList", allEntries = true),
            @CacheEvict(value = "articleDetail", allEntries = true),
            @CacheEvict(value = "articleArchive", allEntries = true),
            @CacheEvict(value = "blogReport", allEntries = true)
    })
    public void batchDelete(List<String> ids) {
        // 删除文章-标签关联
        for (String articleId : ids) {
            articleTagRelationRepository.deleteByArticleId(articleId);
        }
        // 删除文章
        articleRepository.deleteAllById(ids);
    }

    /**
     * 发布/取消发布文章
     * @param id
     * @param isPublished
     */
    @Caching(evict = {
            @CacheEvict(value = "articleList", allEntries = true),
            @CacheEvict(value = "articleDetail", allEntries = true),
            @CacheEvict(value = "articleArchive", allEntries = true),
            @CacheEvict(value = "blogReport", allEntries = true)
    })
    public void publishOrCancel(String id, Integer isPublished) {
        Articles articles = articleRepository.findById(id)
                .orElseThrow(() -> new ArticleException(MessageConstant.ARTICLE_NOT_FOUND));

        boolean firstPublishNow = StatusConstant.ENABLE.equals(isPublished) && articles.getPublishTime() == null;

        // 使用MongoTemplate局部更新
        Query query = new Query(Criteria.where("id").is(id));
        Update update = new Update().set("isPublished", isPublished);

        // 发布时设置发布时间（仅首次发布设置）
        if (firstPublishNow) {
            update.set("publishTime", LocalDateTime.now());
        }

        mongoTemplate.updateFirst(query, update, Articles.class);
    }

    /**
     * 置顶/取消置顶文章
     * @param id
     * @param isTop
     */
    @Caching(evict = {
            @CacheEvict(value = "articleList", allEntries = true),
            @CacheEvict(value = "articleDetail", allEntries = true)
    })
    public void toggleTop(String id, Integer isTop) {
        Articles articles = articleRepository.findById(id)
                .orElseThrow(() -> new ArticleException(MessageConstant.ARTICLE_NOT_FOUND));

        Query query = new Query(Criteria.where("id").is(id));
        Update update = new Update().set("isTop", isTop);
        mongoTemplate.updateFirst(query, update, Articles.class);
    }

    /**
     * 文章搜索（标题、内容）
     * @param keyword
     * @param page
     * @param pageSize
     * @return
     */
    public PageResult search(String keyword, int page, int pageSize) {
        Pageable pageable = PageRequest.of(page - 1, pageSize, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<Articles> pageResult = articleRepository.findByTitleContainingIgnoreCase(keyword, pageable);
        List<ArticleVO> voList = pageResult.getContent().stream()
                .map(this::convertToArticleVO)
                .collect(Collectors.toList());
        return new PageResult(pageResult.getTotalElements(), voList);
    }

    // ===== 博客端方法 =====

    @Cacheable(value = "articleList", key = "'page:' + #page + ':' + #pageSize")
    public PageResult getPublishedPage(int page, int pageSize) {
        Pageable pageable = PageRequest.of(page - 1, pageSize,
                Sort.by(Sort.Direction.DESC, "isTop").and(Sort.by(Sort.Direction.DESC, "publishTime")));
        Page<Articles> pageResult = articleRepository.findByIsPublished(StatusConstant.ENABLE, pageable);
        List<BlogArticleVO> voList = pageResult.getContent().stream()
                .map(this::convertToBlogArticleVO)
                .collect(Collectors.toList());
        return new PageResult(pageResult.getTotalElements(), voList);
    }

    @Cacheable(value = "articleDetail", key = "#slug")
    public BlogArticleDetailVO getBySlug(String slug) {
        Articles article = articleRepository.findBySlug(slug)
                .orElseThrow(() -> new ArticleException(MessageConstant.ARTICLE_NOT_FOUND));

        BlogArticleDetailVO articleDetail = convertToBlogArticleDetailVO(article);

        // 填充标签名称列表（批量查询，避免 N+1）
        List<ArticleTagRelations> relations = articleTagRelationRepository.findByArticleId(article.getId());
        if (relations != null && !relations.isEmpty()) {
            List<String> tagIds = relations.stream()
                    .map(ArticleTagRelations::getTagId)
                    .collect(Collectors.toList());
            List<ArticleTags> tags = articleTagRepository.findAllById(tagIds);
            List<String> tagNames = tags.stream()
                    .map(ArticleTags::getName)
                    .collect(Collectors.toList());
            articleDetail.setTagNames(tagNames);
        }

        // 填充上一篇/下一篇导航（复用已查询的文章对象，避免冗余查询）
        articleDetail.setPrevArticle(findPrevArticle(article));
        articleDetail.setNextArticle(findNextArticle(article));

        // 填充相关文章推荐（同分类，排除当前文章，最多6篇）
        if (article.getCategoryId() != null) {
            articleDetail.setRelatedArticles(findRelatedArticles(article.getId(), article.getCategoryId()));
        }

        return articleDetail;
    }

    /**
     * 文章浏览量+1（写入Redis，定时同步MongoDB）
     */
    public void incrementViewCount(String articleId) {
        redisTemplate.opsForHash().increment(VIEW_COUNT_KEY, articleId, 1);
    }

    @Cacheable(value = "articleList", key = "'cat:' + #categoryId + ':' + #page + ':' + #pageSize")
    public PageResult getPublishedByCategoryId(String categoryId, int page, int pageSize) {
        Pageable pageable = PageRequest.of(page - 1, pageSize,
                Sort.by(Sort.Direction.DESC, "isTop").and(Sort.by(Sort.Direction.DESC, "publishTime")));
        Page<Articles> pageResult = articleRepository.findByIsPublishedAndCategoryId(StatusConstant.ENABLE, categoryId, pageable);
        List<BlogArticleVO> voList = pageResult.getContent().stream()
                .map(this::convertToBlogArticleVO)
                .collect(Collectors.toList());
        return new PageResult(pageResult.getTotalElements(), voList);
    }

    @Cacheable(value = "articleArchive", key = "'all'")
    public List<ArticleArchiveVO> getArchive() {
        List<Articles> publishedArticles = articleRepository.findByIsPublished(StatusConstant.ENABLE);
        // 转换为归档项
        List<ArticleArchiveItemVO> allArticles = publishedArticles.stream()
                .filter(a -> a.getPublishTime() != null)
                .map(a -> ArticleArchiveItemVO.builder()
                        .id(a.getId())
                        .title(a.getTitle())
                        .slug(a.getSlug())
                        .publishDay(a.getPublishDay())
                        .publishTime(a.getPublishTime())
                        .build())
                .collect(Collectors.toList());

        // 按年月分组
        Map<String, ArticleArchiveVO> archiveMap = new LinkedHashMap<>();
        for (ArticleArchiveItemVO item : allArticles) {
            if (item.getPublishTime() == null) {
                continue;
            }
            int year = item.getPublishTime().getYear();
            int month = item.getPublishTime().getMonthValue();
            String key = year + "-" + month;
            ArticleArchiveVO archiveVO = archiveMap.computeIfAbsent(key, k ->
                    ArticleArchiveVO.builder()
                            .year(year)
                            .month(month)
                            .articles(new ArrayList<>())
                            .build()
            );
            archiveVO.getArticles().add(item);
        }
        return new ArrayList<>(archiveMap.values());
    }

    @Cacheable(value = "articleList", key = "'search:' + #keyword + ':' + #page + ':' + #pageSize")
    public PageResult searchPublished(String keyword, int page, int pageSize) {
        Pageable pageable = PageRequest.of(page - 1, pageSize,
                Sort.by(Sort.Direction.DESC, "isTop").and(Sort.by(Sort.Direction.DESC, "publishTime")));
        Page<Articles> pageResult = articleRepository.findByIsPublishedAndTitleContainingIgnoreCase(StatusConstant.ENABLE, keyword, pageable);
        List<BlogArticleVO> voList = pageResult.getContent().stream()
                .map(this::convertToBlogArticleVO)
                .collect(Collectors.toList());
        return new PageResult(pageResult.getTotalElements(), voList);
    }

    @Cacheable(value = "articleList", key = "'tag:' + #tagId + ':' + #page + ':' + #pageSize")
    public PageResult getPublishedByTagId(String tagId, int page, int pageSize) {
        // 先查找包含该标签的文章ID
        List<ArticleTagRelations> relations = articleTagRelationRepository.findByTagId(tagId);
        List<String> articleIds = relations.stream()
                .map(ArticleTagRelations::getArticleId)
                .collect(Collectors.toList());

        if (articleIds.isEmpty()) {
            return new PageResult(0, new ArrayList<>());
        }

        // 查询已发布的文章
        Pageable pageable = PageRequest.of(page - 1, pageSize,
                Sort.by(Sort.Direction.DESC, "isTop").and(Sort.by(Sort.Direction.DESC, "publishTime")));
        Query query = new Query(Criteria.where("id").in(articleIds)
                .and("isPublished").is(1))
                .with(pageable);

        long total = mongoTemplate.count(query, Articles.class);
        List<Articles> articlesList = mongoTemplate.find(query, Articles.class);
        List<BlogArticleVO> voList = articlesList.stream()
                .map(this::convertToBlogArticleVO)
                .collect(Collectors.toList());

        return new PageResult(total, voList);
    }

    // ===== 辅助方法 =====

    /**
     * 查找上一篇已发布文章（publishTime小于当前文章，按publishTime降序取第一条）
     */
    private BlogArticleVO findPrevArticle(Articles current) {
        if (current == null || current.getPublishTime() == null) {
            return null;
        }
        Query query = new Query(Criteria.where("isPublished").is(1)
                .and("publishTime").lt(current.getPublishTime()))
                .with(Sort.by(Sort.Direction.DESC, "publishTime"))
                .limit(1);
        Articles prev = mongoTemplate.findOne(query, Articles.class);
        return prev != null ? convertToBlogArticleVO(prev) : null;
    }

    /**
     * 查找下一篇已发布文章（publishTime大于当前文章，按publishTime升序取第一条）
     */
    private BlogArticleVO findNextArticle(Articles current) {
        if (current == null || current.getPublishTime() == null) {
            return null;
        }
        Query query = new Query(Criteria.where("isPublished").is(1)
                .and("publishTime").gt(current.getPublishTime()))
                .with(Sort.by(Sort.Direction.ASC, "publishTime"))
                .limit(1);
        Articles next = mongoTemplate.findOne(query, Articles.class);
        return next != null ? convertToBlogArticleVO(next) : null;
    }

    /**
     * 查找相关文章（同分类，排除当前文章，最多6篇）
     */
    private List<BlogArticleVO> findRelatedArticles(String currentArticleId, String categoryId) {
        Query query = new Query(Criteria.where("isPublished").is(1)
                .and("categoryId").is(categoryId)
                .and("id").ne(currentArticleId))
                .with(Sort.by(Sort.Direction.DESC, "publishTime"))
                .limit(6);
        List<Articles> related = mongoTemplate.find(query, Articles.class);
        return related.stream().map(this::convertToBlogArticleVO).collect(Collectors.toList());
    }

    /**
     * 转换为ArticleVO（管理端列表）
     */
    private ArticleVO convertToArticleVO(Articles articles) {
        return ArticleVO.builder()
                .id(articles.getId())
                .title(articles.getTitle())
                .slug(articles.getSlug())
                .summary(articles.getSummary())
                .coverImage(articles.getCoverImage())
                .categoryId(articles.getCategoryId())
                .categoryName(null) // 需要时通过关联查询填充
                .viewCount(articles.getViewCount())
                .likeCount(articles.getLikeCount())
                .commentCount(articles.getCommentCount())
                .wordCount(articles.getWordCount())
                .readingTime(articles.getReadingTime())
                .isPublished(articles.getIsPublished())
                .isTop(articles.getIsTop())
                .publishTime(articles.getPublishTime())
                .createTime(articles.getCreateTime())
                .updateTime(articles.getUpdateTime())
                .build();
    }

    /**
     * 转换为BlogArticleVO（博客端列表）
     */
    private BlogArticleVO convertToBlogArticleVO(Articles articles) {
        return BlogArticleVO.builder()
                .id(articles.getId())
                .title(articles.getTitle())
                .slug(articles.getSlug())
                .summary(articles.getSummary())
                .coverImage(articles.getCoverImage())
                .categoryId(articles.getCategoryId())
                .categoryName(null) // 需要时通过关联查询填充
                .viewCount(articles.getViewCount())
                .likeCount(articles.getLikeCount())
                .commentCount(articles.getCommentCount())
                .wordCount(articles.getWordCount())
                .readingTime(articles.getReadingTime())
                .isTop(articles.getIsTop())
                .publishTime(articles.getPublishTime())
                .build();
    }

    /**
     * 转换为BlogArticleDetailVO（博客端详情）
     */
    private BlogArticleDetailVO convertToBlogArticleDetailVO(Articles articles) {
        return BlogArticleDetailVO.builder()
                .id(articles.getId())
                .title(articles.getTitle())
                .slug(articles.getSlug())
                .summary(articles.getSummary())
                .coverImage(articles.getCoverImage())
                .contentHtml(articles.getContentHtml())
                .contentMarkdown(articles.getContentMarkdown())
                .categoryId(articles.getCategoryId())
                .categoryName(null) // 需要时通过关联查询填充
                .viewCount(articles.getViewCount())
                .likeCount(articles.getLikeCount())
                .commentCount(articles.getCommentCount())
                .wordCount(articles.getWordCount())
                .readingTime(articles.getReadingTime())
                .publishTime(articles.getPublishTime())
                .updateTime(articles.getUpdateTime())
                .build();
    }

    /**
     * 统计字数（中文算1字，英文单词算1字）
     * @param text
     * @return
     */
    private long countWords(String text) {
        if (text == null || text.isEmpty()) {
            return 0;
        }
        // 去除Markdown语法符号
        String cleanText = text.replaceAll("[#*`>\\-\\[\\]()!|]", "");
        // 中文字符数
        long chineseCount = cleanText.chars()
                .filter(c -> Character.UnicodeScript.of(c) == Character.UnicodeScript.HAN)
                .count();
        // 英文单词数
        String englishText = cleanText.replaceAll("[\\u4e00-\\u9fff]", " ");
        String[] words = englishText.trim().split("\\s+");
        long englishCount = 0;
        for (String word : words) {
            if (!word.isEmpty() && word.matches(".*[a-zA-Z0-9].*")) {
                englishCount++;
            }
        }
        return chineseCount + englishCount;
    }
}
