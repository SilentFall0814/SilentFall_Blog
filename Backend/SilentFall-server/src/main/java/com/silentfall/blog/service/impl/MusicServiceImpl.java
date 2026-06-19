package com.silentfall.blog.service.impl;

import com.silentfall.blog.constant.StatusConstant;
import com.silentfall.blog.dto.MusicDTO;
import com.silentfall.blog.dto.MusicPageQueryDTO;
import com.silentfall.blog.entity.Music;
import com.silentfall.blog.repository.MusicRepository;
import com.silentfall.blog.result.PageResult;
import com.silentfall.blog.service.MusicService;
import com.silentfall.blog.vo.MusicVO;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;

@Service
public class MusicServiceImpl implements MusicService {

    @Autowired
    private MusicRepository musicRepository;

    /**
     * 添加音乐
     * @param music
     */
    @CacheEvict(value = "musicList", allEntries = true)
    public void addMusic(MusicDTO musicDTO) {
        Music music = new Music();
        BeanUtils.copyProperties(musicDTO, music);
        musicRepository.save(music);
    }

    /**
     * 分页查询音乐列表
     * @param musicPageQueryDTO
     * @return
     */
    public PageResult pageQuery(MusicPageQueryDTO musicPageQueryDTO) {
        Pageable pageable = PageRequest.of(musicPageQueryDTO.getPage() - 1,
                musicPageQueryDTO.getPageSize(), Sort.by(Sort.Direction.ASC, "sort"));
        Page<Music> page = musicRepository.findAll(pageable);
        long total = page.getTotalElements();
        List<Music> records = page.getContent();
        return new PageResult(total, records);
    }

    /**
     * 更新音乐
     * @param music
     */
    @CacheEvict(value = "musicList", allEntries = true)
    public void updateMusic(MusicDTO musicDTO) {
        Music music = new Music();
        BeanUtils.copyProperties(musicDTO, music);
        musicRepository.save(music);
    }

    /**
     * 批量删除音乐
     * @param ids
     */
    @CacheEvict(value = "musicList", allEntries = true)
    public void batchDelete(List<String> ids) {
        musicRepository.deleteAllById(ids);
    }

    /**
     * 根据ID查询音乐
     * @param id
     * @return
     */
    public Music getById(String id) {
        return musicRepository.findById(id).orElse(null);
    }

    /**
     * 获取所有可见的音乐
     * @return
     */
    @Cacheable(value = "musicList", key = "'visible'")
    public List<MusicVO> getAllVisibleMusic() {
        List<Music> musicList = musicRepository.findByIsVisible(StatusConstant.ENABLE);
        if(musicList != null && !musicList.isEmpty()) {
            // 转换为VO
            List<MusicVO> musicVOList = musicList.stream().map(music -> MusicVO.builder()
                    .id(music.getId())
                    .title(music.getTitle())
                    .artist(music.getArtist())
                    .duration(music.getDuration())
                    .coverImage(music.getCoverImage())
                    .musicUrl(music.getMusicUrl())
                    .lyricUrl(music.getLyricUrl())
                    .hasLyric(music.getHasLyric())
                    .lyricType(music.getLyricType())
                    .build()
            ).toList();
            return musicVOList;
        }
        return Collections.emptyList();
    }
}
