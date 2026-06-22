package com.silentfall.blog.controller.admin;

import com.silentfall.blog.result.Result;
import com.silentfall.blog.service.CommonService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.HashMap;
import java.util.Map;

/**
 * 管理端通用接口
 */
@RestController("adminCommonController")
@RequestMapping("/admin/common")
@Slf4j
public class CommonController {

    @Autowired
    private CommonService commonService;

    /**
     * 文件上传
     */
    @PostMapping("/upload")
    public Result uploadFile(MultipartFile file){
        log.info("文件上传：{}",file);
        String fileUrl = commonService.uploadFile(file);
        return Result.success(fileUrl);
    }

    /**
     * 图片上传（同时生成缩略图）
     * 返回 { originalUrl, thumbUrl }
     */
    @PostMapping("/uploadImage")
    public Result uploadImageWithThumb(MultipartFile file) {
        log.info("图片上传（含缩略图）：{}", file.getOriginalFilename());
        CommonService.UploadImageResult result = commonService.uploadImageWithThumb(file);
        Map<String, String> data = new HashMap<>();
        data.put("originalUrl", result.getOriginalUrl());
        data.put("thumbUrl", result.getThumbUrl());
        return Result.success(data);
    }
}
