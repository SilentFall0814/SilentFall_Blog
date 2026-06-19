package com.silentfall.blog.service.impl;

import com.silentfall.blog.constant.StatusConstant;
import com.silentfall.blog.dto.SocialMediaDTO;
import com.silentfall.blog.entity.SocialMedia;
import com.silentfall.blog.repository.SocialMediaRepository;
import com.silentfall.blog.service.SocialMediaService;
import com.silentfall.blog.vo.SocialMediaVO;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;

@Service
public class SocialMediaServiceImpl implements SocialMediaService {

    @Autowired
    private SocialMediaRepository socialMediaRepository;

    /**
     * 获取可见社交媒体信息
     * @return
     */
    @Cacheable(value = "socialMedia", key = "'visible'")
    public List<SocialMediaVO> getVisibleSocialMedia() {
        List<SocialMedia> socialMediaList = socialMediaRepository.findByIsVisible(StatusConstant.ENABLE);
        if (socialMediaList != null && !socialMediaList.isEmpty()) {
            return socialMediaList.stream().map(socialMedia -> SocialMediaVO.builder()
                    .id(socialMedia.getId())
                    .name(socialMedia.getName())
                    .icon(socialMedia.getIcon())
                    .link(socialMedia.getLink())
                    .sort(socialMedia.getSort())
                    .build()).toList();
        }
        return Collections.emptyList();
    }

    /**
     * 获取所有社交媒体信息
     * @return
     */
    @Cacheable(value = "socialMedia", key = "'all'")
    public List<SocialMedia> getAllSocialMedia() {
        return socialMediaRepository.findAll();
    }

    /**
     * 添加社交媒体
     * @param socialMediaDTO
     */
    @CacheEvict(value = "socialMedia", allEntries = true)
    public void addSocialMedia(SocialMediaDTO socialMediaDTO) {
        SocialMedia socialMedia = new SocialMedia();
        BeanUtils.copyProperties(socialMediaDTO, socialMedia);
        socialMediaRepository.save(socialMedia);
    }

    /**
     * 批量删除社交媒体
     * @param ids
     */
    @CacheEvict(value = "socialMedia", allEntries = true)
    public void batchDelete(List<String> ids) {
        socialMediaRepository.deleteAllById(ids);
    }

    /**
     * 修改社交媒体
     * @param socialMediaDTO
     */
    @CacheEvict(value = "socialMedia", allEntries = true)
    public void updateSocialMedia(SocialMediaDTO socialMediaDTO) {
        SocialMedia socialMedia = new SocialMedia();
        BeanUtils.copyProperties(socialMediaDTO, socialMedia);
        socialMediaRepository.save(socialMedia);
    }
}
