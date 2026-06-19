package com.silentfall.blog.repository;

import com.silentfall.blog.entity.FriendLinks;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface FriendLinkRepository extends MongoRepository<FriendLinks, String> {
    List<FriendLinks> findByIsVisible(Integer isVisible);
}
