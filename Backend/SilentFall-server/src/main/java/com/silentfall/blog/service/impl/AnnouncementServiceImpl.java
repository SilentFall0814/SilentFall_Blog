package com.silentfall.blog.service.impl;

import com.silentfall.blog.dto.AnnouncementDTO;
import com.silentfall.blog.entity.Announcements;
import com.silentfall.blog.repository.AnnouncementRepository;
import com.silentfall.blog.service.AnnouncementService;
import com.silentfall.blog.vo.AnnouncementVO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

@Service
@Slf4j
public class AnnouncementServiceImpl implements AnnouncementService {

    @Autowired
    private AnnouncementRepository announcementRepository;

    /**
     * 管理端获取所有公告
     */
    @Cacheable(value = "announcements", key = "'all'")
    public List<Announcements> getAllAnnouncements() {
        List<Announcements> list = announcementRepository.findAll();
        if (list != null && !list.isEmpty()) {
            return list;
        }
        return Collections.emptyList();
    }

    /**
     * 管理端发布公告
     */
    @CacheEvict(value = "announcements", allEntries = true)
    public void addAnnouncement(AnnouncementDTO announcementDTO) {
        Announcements announcement = Announcements.builder()
                .content(announcementDTO.getContent())
                .createdAt(LocalDateTime.now())
                .isActive(true)
                .build();
        announcementRepository.save(announcement);
    }

    /**
     * 管理端删除公告
     */
    @CacheEvict(value = "announcements", allEntries = true)
    public void deleteAnnouncement(String id) {
        announcementRepository.deleteById(id);
    }

    /**
     * 博客端获取生效的公告（按时间倒序）
     */
    @Cacheable(value = "announcements", key = "'active'")
    public List<AnnouncementVO> getActiveAnnouncements() {
        List<Announcements> list = announcementRepository.findByIsActiveTrueOrderByCreatedAtDesc();
        if (list != null && !list.isEmpty()) {
            return list.stream().map(a -> AnnouncementVO.builder()
                    .id(a.getId())
                    .content(a.getContent())
                    .createdAt(a.getCreatedAt())
                    .build()).toList();
        }
        return Collections.emptyList();
    }
}
