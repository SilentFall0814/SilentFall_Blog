package com.silentfall.blog.repository;

import com.silentfall.blog.entity.SystemConfig;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface SystemConfigRepository extends MongoRepository<SystemConfig, String> {
}
