package com.silentfall.blog.repository;

import com.silentfall.blog.entity.Album;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface AlbumRepository extends MongoRepository<Album, String> {

    /**
     * 根据可见状态查询相册
     * @param isVisible
     * @return
     */
    List<Album> findByIsVisible(Integer isVisible);
}
