package com.silentfall.blog.repository;

import com.silentfall.blog.entity.OperationLogs;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;

public interface OperationLogRepository extends MongoRepository<OperationLogs, String> {
    Page<OperationLogs> findAllByOrderByOperationTimeDesc(Pageable pageable);
}
