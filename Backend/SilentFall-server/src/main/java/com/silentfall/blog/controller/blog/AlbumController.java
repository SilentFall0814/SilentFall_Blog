package com.silentfall.blog.controller.blog;

import com.silentfall.blog.result.Result;
import com.silentfall.blog.service.AlbumService;
import com.silentfall.blog.vo.AlbumDetailVO;
import com.silentfall.blog.vo.AlbumVO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

/**
 * 博客端相册接口
 */
@Slf4j
@RestController("blogAlbumController")
@RequestMapping("/blog/album")
public class AlbumController {

    @Autowired
    private AlbumService albumService;

    /**
     * 获取所有可见相册
     */
    @GetMapping("/list")
    public Result<List<AlbumVO>> getVisibleAlbums() {
        log.info("获取可见相册列表");
        List<AlbumVO> list = albumService.getVisibleAlbums();
        return Result.success(list);
    }

    /**
     * 获取相册详情
     */
    @GetMapping("/{id}")
    public Result<AlbumDetailVO> getAlbumDetail(@PathVariable String id) {
        log.info("获取相册详情: {}", id);
        AlbumDetailVO detail = albumService.getAlbumDetail(id);
        return Result.success(detail);
    }

    /**
     * 跨相册搜索照片（按相册名或照片描述匹配）
     * 返回按相册分组的结果
     */
    @GetMapping("/search")
    public Result<List<Map<String, Object>>> searchPhotos(@RequestParam String keyword) {
        log.info("跨相册搜索照片: keyword={}", keyword);
        List<Map<String, Object>> result = albumService.searchPhotos(keyword);
        return Result.success(result);
    }
}
