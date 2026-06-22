package com.silentfall.blog.service;

import com.silentfall.blog.dto.AnnouncementDTO;
import com.silentfall.blog.entity.Announcements;
import com.silentfall.blog.vo.AnnouncementVO;

import java.util.List;

public interface AnnouncementService {
    /**
     * 管理端获取所有公告
     * @return
     */
    List<Announcements> getAllAnnouncements();

    /**
     * 管理端发布公告
     * @param announcementDTO
     */
    void addAnnouncement(AnnouncementDTO announcementDTO);

    /**
     * 管理端删除公告
     * @param id
     */
    void deleteAnnouncement(String id);

    /**
     * 博客端获取生效的公告（按时间倒序）
     * @return
     */
    List<AnnouncementVO> getActiveAnnouncements();
}
