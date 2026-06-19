package com.silentfall.blog.service;

import com.silentfall.blog.dto.MusicDTO;
import com.silentfall.blog.dto.MusicPageQueryDTO;
import com.silentfall.blog.entity.Music;
import com.silentfall.blog.result.PageResult;
import com.silentfall.blog.vo.MusicVO;

import java.util.List;

public interface MusicService {
    /**
     * 添加音乐
     * @param musicDTO
     */
    void addMusic(MusicDTO musicDTO);

    /**
     * 分页查询音乐列表
     * @param musicPageQueryDTO
     * @return
     */
    PageResult pageQuery(MusicPageQueryDTO musicPageQueryDTO);

    /**
     * 更新音乐
     * @param musicDTO
     */
    void updateMusic(MusicDTO musicDTO);

    /**
     * 批量删除音乐
     * @param ids
     */
    void batchDelete(List<String> ids);

    /**
     * 根据ID查询音乐
     * @param id
     * @return
     */
    Music getById(String id);

    /**
     * 获取所有可见的音乐
     * @return
     */
    List<MusicVO> getAllVisibleMusic();
}
