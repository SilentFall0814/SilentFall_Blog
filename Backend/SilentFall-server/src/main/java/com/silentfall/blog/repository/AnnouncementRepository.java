package com.silentfall.blog.repository;

import com.silentfall.blog.entity.Announcements;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface AnnouncementRepository extends MongoRepository<Announcements, String> {

    // 查询所有生效的公告，按发布时间倒序
    List<Announcements> findByIsActiveTrueOrderByCreatedAtDesc();
}
