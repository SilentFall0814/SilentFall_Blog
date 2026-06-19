package com.silentfall.blog.controller.admin;

import com.silentfall.blog.annotation.OperationLog;
import com.silentfall.blog.dto.MusicDTO;
import com.silentfall.blog.dto.MusicPageQueryDTO;
import com.silentfall.blog.entity.Music;
import com.silentfall.blog.enumeration.OperationType;
import com.silentfall.blog.result.PageResult;
import com.silentfall.blog.result.Result;
import com.silentfall.blog.service.MusicService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 管理端音乐接口
 */
@Slf4j
@RestController("adminMusicController")
@RequestMapping("/admin/music")
public class MusicController {

    @Autowired
    private MusicService musicService;

    /**
     * 分页查询音乐列表
     * @param musicPageQueryDTO
     * @return
     */
    @GetMapping("/page")
    public Result<PageResult> getMusicList(MusicPageQueryDTO musicPageQueryDTO) {
        log.info("获取音乐列表,{}", musicPageQueryDTO);
        PageResult pageResult = musicService.pageQuery(musicPageQueryDTO);
        return Result.success(pageResult);
    }

    /**
     * 根据ID查询音乐
     * @param id
     * @return
     */
    @GetMapping("/{id}")
    public Result<Music> getById(@PathVariable String id) {
        log.info("根据ID查询音乐,{}", id);
        Music music = musicService.getById(id);
        return Result.success(music);
    }

    /**
     * 添加音乐
     * @param music
     * @return
     */
    @PostMapping
    @OperationLog(value = OperationType.INSERT, target = "music")
    public Result addMusic(@Valid @RequestBody MusicDTO musicDTO) {
        log.info("添加音乐,{}", musicDTO);
        musicService.addMusic(musicDTO);
        return Result.success();
    }

    /**
     * 更新音乐
     * @param music
     * @return
     */
    @PutMapping
    @OperationLog(value = OperationType.UPDATE, target = "music", targetId = "#musicDTO.id")
    public Result updateMusic(@Valid @RequestBody MusicDTO musicDTO) {
        log.info("更新音乐,{}", musicDTO);
        musicService.updateMusic(musicDTO);
        return Result.success();
    }

    /**
     * 批量删除音乐
     * @param ids
     * @return
     */
    @DeleteMapping
    @OperationLog(value = OperationType.DELETE, target = "music", targetId = "#ids")
    public Result deleteMusic(@RequestParam List<String> ids) {
        log.info("批量删除音乐,{}", ids);
        musicService.batchDelete(ids);
        return Result.success();
    }
}
