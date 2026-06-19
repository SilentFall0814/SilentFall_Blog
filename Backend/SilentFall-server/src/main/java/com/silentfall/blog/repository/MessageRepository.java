package com.silentfall.blog.repository;

import com.silentfall.blog.entity.Messages;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface MessageRepository extends MongoRepository<Messages, String> {
    List<Messages> findByIsApprovedOrderByCreateTimeDesc(Integer isApproved);
    Page<Messages> findByIsApprovedOrderByCreateTimeDesc(Integer isApproved, Pageable pageable);
    Page<Messages> findAllByOrderByCreateTimeDesc(Pageable pageable);
    List<Messages> findByRootId(String rootId);
}
