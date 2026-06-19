package com.silentfall.blog.repository;

import com.silentfall.blog.entity.Visitors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface VisitorRepository extends MongoRepository<Visitors, String> {
    Optional<Visitors> findByIp(String ip);
    Page<Visitors> findAllByOrderByLastVisitTimeDesc(Pageable pageable);
}
