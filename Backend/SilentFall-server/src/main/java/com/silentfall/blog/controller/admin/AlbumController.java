package com.silentfall.blog.controller.admin;

import com.silentfall.blog.annotation.OperationLog;
import com.silentfall.blog.dto.AlbumDTO;
import com.silentfall.blog.dto.AlbumPageQueryDTO;
import com.silentfall.blog.entity.Album;
import com.silentfall.blog.enumeration.OperationType;
import com.silentfall.blog.result.PageResult;
import com.silentfall.blog.result.Result;
import com.silentfall.blog.service.AlbumService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 管理端相册接口
 */
@Slf4j
@RestController("adminAlbumController")
@RequestMapping("/admin/album")
public class AlbumController {

    @Autowired
    private AlbumService albumService;

    /**
     * 分页查询相册列表
     */
    @GetMapping("/page")
    public Result<PageResult> pageQuery(AlbumPageQueryDTO albumPageQueryDTO) {
        log.info("分页查询相册列表: {}", albumPageQueryDTO);
        PageResult pageResult = albumService.pageQuery(albumPageQueryDTO);
        return Result.success(pageResult);
    }

    /**
     * 根据ID查询相册
     */
    @GetMapping("/{id}")
    public Result<Album> getById(@PathVariable String id) {
        log.info("根据ID查询相册: {}", id);
        Album album = albumService.getById(id);
        return Result.success(album);
    }

    /**
     * 创建相册
     */
    @PostMapping
    @OperationLog(value = OperationType.INSERT, target = "album")
    public Result addAlbum(@Valid @RequestBody AlbumDTO albumDTO) {
        log.info("创建相册: {}", albumDTO);
        albumService.addAlbum(albumDTO);
        return Result.success();
    }

    /**
     * 更新相册
     */
    @PutMapping
    @OperationLog(value = OperationType.UPDATE, target = "album", targetId = "#albumDTO.id")
    public Result updateAlbum(@Valid @RequestBody AlbumDTO albumDTO) {
        log.info("更新相册: {}", albumDTO);
        albumService.updateAlbum(albumDTO);
        return Result.success();
    }

    /**
     * 批量删除相册
     */
    @DeleteMapping
    @OperationLog(value = OperationType.DELETE, target = "album", targetId = "#ids")
    public Result deleteAlbum(@RequestParam List<String> ids) {
        log.info("批量删除相册: {}", ids);
        albumService.batchDelete(ids);
        return Result.success();
    }
}
