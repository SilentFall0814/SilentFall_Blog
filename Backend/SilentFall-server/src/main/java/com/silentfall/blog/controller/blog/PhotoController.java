package com.silentfall.blog.controller.blog;

import com.silentfall.blog.result.Result;
import com.silentfall.blog.service.PhotoService;
import com.silentfall.blog.vo.PhotoVO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 博客端照片接口
 */
@Slf4j
@RestController("blogPhotoController")
@RequestMapping("/blog/photo")
public class PhotoController {

    @Autowired
    private PhotoService photoService;

    /**
     * 获取相册下所有照片（按上传时间倒序）
     */
    @GetMapping("/list")
    public Result<List<PhotoVO>> getPhotosByAlbumId(@RequestParam String albumId) {
        log.info("获取相册照片: albumId={}", albumId);
        List<PhotoVO> list = photoService.getPhotosByAlbumId(albumId);
        return Result.success(list);
    }
}
