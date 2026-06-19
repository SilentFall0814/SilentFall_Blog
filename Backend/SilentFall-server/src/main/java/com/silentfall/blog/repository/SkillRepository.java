package com.silentfall.blog.repository;

import com.silentfall.blog.entity.Skills;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface SkillRepository extends MongoRepository<Skills, String> {
    List<Skills> findByIsVisible(Integer isVisible);
}
