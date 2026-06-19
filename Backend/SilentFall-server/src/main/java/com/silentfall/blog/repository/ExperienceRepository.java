package com.silentfall.blog.repository;

import com.silentfall.blog.entity.Experiences;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface ExperienceRepository extends MongoRepository<Experiences, String> {
    List<Experiences> findByType(Integer type);
    List<Experiences> findByIsVisible(Integer isVisible);
}
