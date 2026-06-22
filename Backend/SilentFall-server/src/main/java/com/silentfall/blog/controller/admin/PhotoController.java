package com.silentfall.blog.controller.admin;

import com.silentfall.blog.annotation.OperationLog;
import com.silentfall.blog.dto.PhotoDTO;
import com.silentfall.blog.dto.PhotoPageQueryDTO;
import com.silentfall.blog.entity.Photo;
import com.silentfall.blog.enumeration.OperationType;
import com.silentfall.blog.result.PageResult;
import com.silentfall.blog.result.Result;
import com.silentfall.blog.service.PhotoService;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * 管理端照片接口
 */
@Slf4j
@RestController("adminPhotoController")
@RequestMapping("/admin/photo")
public class PhotoController {

    @Autowired
    private PhotoService photoService;

    /**
     * 分页查询某相册的照片
     */
    @GetMapping("/page")
    public Result<PageResult> pageQuery(PhotoPageQueryDTO photoPageQueryDTO) {
        log.info("分页查询照片: {}", photoPageQueryDTO);
        PageResult pageResult = photoService.pageQuery(photoPageQueryDTO);
        return Result.success(pageResult);
    }

    /**
     * 根据ID查询照片
     */
    @GetMapping("/{id}")
    public Result<Photo> getById(@PathVariable String id) {
        log.info("根据ID查询照片: {}", id);
        Photo photo = photoService.getById(id);
        return Result.success(photo);
    }

    /**
     * 批量上传照片（同时填写描述）
     * @param albumId 相册ID
     * @param files 照片文件数组
     * @param captions 描述数组（与文件一一对应）
     */
    @PostMapping("/batch")
    @OperationLog(value = OperationType.INSERT, target = "photo")
    public Result batchUpload(
            @RequestParam("albumId") String albumId,
            @RequestParam("files") MultipartFile[] files,
            @RequestParam(value = "captions", required = false) String[] captions) {
        log.info("批量上传照片，相册ID: {}, 文件数: {}", albumId, files != null ? files.length : 0);
        photoService.batchUpload(albumId, files, captions);
        return Result.success();
    }

    /**
     * 更新照片（修改描述/排序）
     */
    @PutMapping
    @OperationLog(value = OperationType.UPDATE, target = "photo", targetId = "#photoDTO.id")
    public Result updatePhoto(@Valid @RequestBody PhotoDTO photoDTO) {
        log.info("更新照片: {}", photoDTO);
        photoService.updatePhoto(photoDTO);
        return Result.success();
    }

    /**
     * 批量删除照片
     */
    @DeleteMapping
    @OperationLog(value = OperationType.DELETE, target = "photo", targetId = "#ids")
    public Result deletePhoto(@RequestParam List<String> ids) {
        log.info("批量删除照片: {}", ids);
        photoService.batchDelete(ids);
        return Result.success();
    }
}
