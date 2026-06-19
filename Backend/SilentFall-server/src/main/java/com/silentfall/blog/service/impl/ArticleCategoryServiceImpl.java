package com.silentfall.blog.service.impl;

import com.silentfall.blog.constant.StatusConstant;
import com.silentfall.blog.dto.ArticleCategoryDTO;
import com.silentfall.blog.entity.ArticleCategories;
import com.silentfall.blog.repository.ArticleCategoryRepository;
import com.silentfall.blog.repository.ArticleRepository;
import com.silentfall.blog.service.ArticleCategoryService;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ArticleCategoryServiceImpl implements ArticleCategoryService {

    @Autowired
    private ArticleCategoryRepository articleCategoryRepository;

    @Autowired
    private ArticleRepository articleRepository;

    /**
     * 获取所有文章分类
     * @return
     */
    @Cacheable(value = "articleCategories", key = "'all'")
    public List<ArticleCategories> listAll() {
        return articleCategoryRepository.findAll();
    }

    /**
     * 添加文章分类
     * @param articleCategoryDTO
     */
    @Caching(evict = {
            @CacheEvict(value = "articleCategories", allEntries = true),
            @CacheEvict(value = "articleList", allEntries = true),
            @CacheEvict(value = "blogReport", allEntries = true)
    })
    public void addCategory(ArticleCategoryDTO articleCategoryDTO) {
        ArticleCategories articleCategories = new ArticleCategories();
        BeanUtils.copyProperties(articleCategoryDTO, articleCategories);
        articleCategoryRepository.save(articleCategories);
    }

    /**
     * 更新文章分类（含排序）
     * @param articleCategoryDTO
     */
    @Caching(evict = {
            @CacheEvict(value = "articleCategories", allEntries = true),
            @CacheEvict(value = "articleList", allEntries = true),
            @CacheEvict(value = "blogReport", allEntries = true)
    })
    public void updateCategory(ArticleCategoryDTO articleCategoryDTO) {
        ArticleCategories articleCategories = new ArticleCategories();
        BeanUtils.copyProperties(articleCategoryDTO, articleCategories);
        articleCategoryRepository.save(articleCategories);
    }

    /**
     * 批量删除文章分类
     * @param ids
     */
    @Caching(evict = {
            @CacheEvict(value = "articleCategories", allEntries = true),
            @CacheEvict(value = "articleList", allEntries = true),
            @CacheEvict(value = "blogReport", allEntries = true)
    })
    public void batchDelete(List<String> ids) {
        // 检查分类下是否有关联文章
        for (String id : ids) {
            long count = articleRepository.countByCategoryId(id);
            if (count > 0) {
                throw new RuntimeException("分类下存在关联文章，无法删除");
            }
        }
        articleCategoryRepository.deleteAllById(ids);
    }

    // ===== 博客端方法 =====

    @Cacheable(value = "articleCategories", key = "'visible'")
    public List<ArticleCategories> getVisibleCategories() {
        return articleCategoryRepository.findByIsVisible(StatusConstant.ENABLE);
    }
}
