package com.silentfall.blog.controller.admin;

import com.silentfall.blog.annotation.OperationLog;
import com.silentfall.blog.dto.AnnouncementDTO;
import com.silentfall.blog.entity.Announcements;
import com.silentfall.blog.enumeration.OperationType;
import com.silentfall.blog.result.Result;
import com.silentfall.blog.service.AnnouncementService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 管理端公告接口
 */
@RestController("adminAnnouncementController")
@RequestMapping("/admin/announcement")
@Slf4j
public class AnnouncementController {

    @Autowired
    private AnnouncementService announcementService;

    /**
     * 获取所有公告列表
     */
    @GetMapping
    public Result<List<Announcements>> getAllAnnouncements() {
        List<Announcements> list = announcementService.getAllAnnouncements();
        return Result.success(list);
    }

    /**
     * 发布新公告
     */
    @PostMapping
    @OperationLog(value = OperationType.INSERT, target = "announcement")
    public Result addAnnouncement(@Valid @RequestBody AnnouncementDTO announcementDTO) {
        log.info("发布公告:{}", announcementDTO);
        announcementService.addAnnouncement(announcementDTO);
        return Result.success();
    }

    /**
     * 删除公告
     */
    @DeleteMapping("/{id}")
    @OperationLog(value = OperationType.DELETE, target = "announcement", targetId = "#id")
    public Result deleteAnnouncement(@PathVariable String id) {
        log.info("删除公告:{}", id);
        announcementService.deleteAnnouncement(id);
        return Result.success();
    }
}
