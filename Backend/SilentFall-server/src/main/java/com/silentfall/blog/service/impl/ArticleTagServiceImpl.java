package com.silentfall.blog.service.impl;

import com.silentfall.blog.constant.StatusConstant;
import com.silentfall.blog.dto.ArticleTagDTO;
import com.silentfall.blog.entity.ArticleTags;
import com.silentfall.blog.repository.ArticleTagRepository;
import com.silentfall.blog.repository.ArticleTagRelationRepository;
import com.silentfall.blog.service.ArticleTagService;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;

@Service
public class ArticleTagServiceImpl implements ArticleTagService {

    @Autowired
    private ArticleTagRepository articleTagRepository;

    @Autowired
    private ArticleTagRelationRepository articleTagRelationRepository;

    /**
     * 获取所有标签
     * @return
     */
    @Cacheable(value = "articleTags", key = "'all'")
    public List<ArticleTags> listAll() {
        List<ArticleTags> list = articleTagRepository.findAll();
        return list != null ? list : Collections.emptyList();
    }

    /**
     * 添加标签
     * @param articleTagDTO
     */
    @Caching(evict = {
            @CacheEvict(value = "articleTags", allEntries = true),
            @CacheEvict(value = "blogReport", allEntries = true)
    })
    public void addTag(ArticleTagDTO articleTagDTO) {
        ArticleTags articleTag = new ArticleTags();
        BeanUtils.copyProperties(articleTagDTO, articleTag);
        articleTagRepository.save(articleTag);
    }

    /**
     * 修改标签
     * @param articleTagDTO
     */
    @Caching(evict = {
            @CacheEvict(value = "articleTags", allEntries = true),
            @CacheEvict(value = "blogReport", allEntries = true)
    })
    public void updateTag(ArticleTagDTO articleTagDTO) {
        ArticleTags articleTag = new ArticleTags();
        BeanUtils.copyProperties(articleTagDTO, articleTag);
        articleTagRepository.save(articleTag);
    }

    /**
     * 批量删除标签
     * @param ids
     */
    @Caching(evict = {
            @CacheEvict(value = "articleTags", allEntries = true),
            @CacheEvict(value = "blogReport", allEntries = true)
    })
    public void batchDelete(List<String> ids) {
        // 先删除关联关系中涉及这些标签的记录
        for (String tagId : ids) {
            articleTagRelationRepository.deleteByTagId(tagId);
        }
        articleTagRepository.deleteAllById(ids);
    }

    /**
     * 获取标签
     * @return
     */
    @Cacheable(value = "articleTags", key = "'visible'")
    public List<ArticleTags> getVisibleTags() {
        List<ArticleTags> list = articleTagRepository.findByIsVisible(StatusConstant.ENABLE);
        return list != null ? list : Collections.emptyList();
    }
}
