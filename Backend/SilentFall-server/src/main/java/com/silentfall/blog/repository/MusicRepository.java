package com.silentfall.blog.repository;

import com.silentfall.blog.entity.Music;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface MusicRepository extends MongoRepository<Music, String> {
    List<Music> findByIsVisible(Integer isVisible);
}
