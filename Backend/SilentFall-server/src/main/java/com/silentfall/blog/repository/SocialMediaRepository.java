package com.silentfall.blog.repository;

import com.silentfall.blog.entity.SocialMedia;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface SocialMediaRepository extends MongoRepository<SocialMedia, String> {
    List<SocialMedia> findByIsVisible(Integer isVisible);
}
