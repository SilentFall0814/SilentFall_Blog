package com.silentfall.blog.service;

import com.silentfall.blog.dto.AlbumDTO;
import com.silentfall.blog.dto.AlbumPageQueryDTO;
import com.silentfall.blog.entity.Album;
import com.silentfall.blog.result.PageResult;
import com.silentfall.blog.vo.AlbumDetailVO;
import com.silentfall.blog.vo.AlbumVO;

import java.util.List;

public interface AlbumService {

    /**
     * 分页查询相册列表（管理端）
     * @param albumPageQueryDTO
     * @return
     */
    PageResult pageQuery(AlbumPageQueryDTO albumPageQueryDTO);

    /**
     * 根据ID查询相册
     * @param id
     * @return
     */
    Album getById(String id);

    /**
     * 创建相册
     * @param albumDTO
     */
    void addAlbum(AlbumDTO albumDTO);

    /**
     * 更新相册
     * @param albumDTO
     */
    void updateAlbum(AlbumDTO albumDTO);

    /**
     * 批量删除相册（同时删除旗下照片和文件）
     * @param ids
     */
    void batchDelete(List<String> ids);

    /**
     * 博客端获取所有可见相册
     * @return
     */
    List<AlbumVO> getVisibleAlbums();

    /**
     * 博客端获取相册详情
     * @param id
     * @return
     */
    AlbumDetailVO getAlbumDetail(String id);

    /**
     * 跨相册搜索照片（按相册名或照片描述匹配）
     * @param keyword
     * @return 匹配的照片列表（含相册名）
     */
    List<java.util.Map<String, Object>> searchPhotos(String keyword);
}
