package com.silentfall.blog.controller.blog;

import com.silentfall.blog.result.Result;
import com.silentfall.blog.service.AnnouncementService;
import com.silentfall.blog.vo.AnnouncementVO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 博客端公告接口
 */
@RestController("blogAnnouncementController")
@RequestMapping("/blog/announcement")
public class AnnouncementController {

    @Autowired
    private AnnouncementService announcementService;

    /**
     * 获取所有生效的公告（按时间倒序）
     */
    @GetMapping("/active")
    public Result<List<AnnouncementVO>> getActiveAnnouncements() {
        List<AnnouncementVO> list = announcementService.getActiveAnnouncements();
        return Result.success(list);
    }
}
