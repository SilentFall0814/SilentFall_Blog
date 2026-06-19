package com.silentfall.blog.controller.blog;

import com.silentfall.blog.entity.ArticleTags;
import com.silentfall.blog.result.PageResult;
import com.silentfall.blog.result.Result;
import com.silentfall.blog.service.ArticleService;
import com.silentfall.blog.service.ArticleTagService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 博客端文章标签接口
 */
@Slf4j
@RestController("blogArticleTagController")
@RequestMapping("/blog/article/tag")
public class ArticleTagController {

    @Autowired
    private ArticleTagService articleTagService;

    @Autowired
    private ArticleService articleService;

    /**
     * 获取有已发布文章的标签列表
     */
    @GetMapping
    public Result<List<ArticleTags>> getVisibleTags() {
        List<ArticleTags> list = articleTagService.getVisibleTags();
        return Result.success(list);
    }

    /**
     * 根据标签ID获取已发布文章列表
     */
    @GetMapping("/{tagId}")
    public Result<PageResult> getPublishedByTagId(@PathVariable String tagId,
                                                   @RequestParam(defaultValue = "1") int page,
                                                   @RequestParam(defaultValue = "10") int pageSize) {
        log.info("博客端根据标签获取文章列表: tagId={}", tagId);
        PageResult pageResult = articleService.getPublishedByTagId(tagId, page, pageSize);
        return Result.success(pageResult);
    }
}
