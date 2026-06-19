package com.silentfall.blog.repository;

import com.silentfall.blog.entity.Views;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface ViewRepository extends MongoRepository<Views, String> {
    Optional<Views> findByPagePath(String pagePath);
}
