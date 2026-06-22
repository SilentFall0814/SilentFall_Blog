package com.silentfall.blog.repository;

import com.silentfall.blog.entity.Photo;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface PhotoRepository extends MongoRepository<Photo, String> {

    /**
     * 根据相册ID查询照片
     * @param albumId
     * @return
     */
    List<Photo> findByAlbumId(String albumId);

    /**
     * 根据相册ID统计照片数量
     * @param albumId
     * @return
     */
    long countByAlbumId(String albumId);

    /**
     * 根据相册ID删除所有照片
     * @param albumId
     */
    void deleteByAlbumId(String albumId);
}
