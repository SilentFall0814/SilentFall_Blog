package com.silentfall.blog.repository;

import com.silentfall.blog.entity.PersonalInfo;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface PersonalInfoRepository extends MongoRepository<PersonalInfo, String> {
}
