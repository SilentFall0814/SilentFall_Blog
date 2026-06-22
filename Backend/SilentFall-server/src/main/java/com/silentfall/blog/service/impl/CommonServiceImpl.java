package com.silentfall.blog.service.impl;

import com.silentfall.blog.constant.MessageConstant;
import com.silentfall.blog.exception.UploadFileErrorException;
import com.silentfall.blog.properties.ImageProperties;
import com.silentfall.blog.service.CommonService;
import com.silentfall.blog.utils.LocalStorageUtil;
import com.silentfall.blog.utils.ImageCompressUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;

@Service
@Slf4j
public class CommonServiceImpl implements CommonService {

    // 缩略图宽度（像素）
    private static final int THUMB_WIDTH = 600;

    @Autowired
    private LocalStorageUtil localStorageUtil;
    @Autowired
    private ImageCompressUtil imageCompressUtil;
    @Autowired
    private ImageProperties imageProperties;

    /**
     * 文件上传
     * @param file
     */
    public String uploadFile(MultipartFile file) {
        if (file.isEmpty()) {
            throw new UploadFileErrorException(MessageConstant.FILE_EMPTY);
        }
        try {
            // 获取文件名
            String fileName = file.getOriginalFilename();
            if (fileName == null) {
                fileName = "unnamed";
            }
            // 获取文件后缀（无扩展名时使用空字符串，文件分类将归为 other）
            int dotIndex = fileName.lastIndexOf(".");
            String extension = dotIndex >= 0 ? fileName.substring(dotIndex + 1) : "";
            // 获取文件字节数组
            byte[] bytes = file.getBytes();

            // 如果是图片，先压缩再上传
            if(!extension.isEmpty() && localStorageUtil.getFileCategory(extension).equals("image")){
                bytes = imageCompressUtil.compress(file);
                extension = imageProperties.getOutPutFormat();
            }

            // 获取uuid文件名（无扩展名时不追加点号）
            String uuidFileName = extension.isEmpty()
                    ? UUID.randomUUID().toString()
                    : UUID.randomUUID() + "." + extension;
            // 上传文件
            String fileUrl = localStorageUtil.upload(bytes, extension, uuidFileName);

            return fileUrl;

        } catch (IOException e) {
            throw new UploadFileErrorException(MessageConstant.UPLOAD_FAILED);
        }
    }

    /**
     * 图片上传（同时生成缩略图）
     * @param file 图片文件
     * @return 包含原图URL和缩略图URL的结果对象
     */
    @Override
    public UploadImageResult uploadImageWithThumb(MultipartFile file) {
        if (file.isEmpty()) {
            throw new UploadFileErrorException(MessageConstant.FILE_EMPTY);
        }
        try {
            String fileName = file.getOriginalFilename();
            if (fileName == null) {
                fileName = "unnamed";
            }
            int dotIndex = fileName.lastIndexOf(".");
            String extension = dotIndex >= 0 ? fileName.substring(dotIndex + 1) : "";

            // 非图片文件直接返回原URL，缩略图URL与原图相同
            if (extension.isEmpty() || !localStorageUtil.getFileCategory(extension).equals("image")) {
                String fileUrl = uploadFile(file);
                return new UploadImageResult(fileUrl, fileUrl);
            }

            // 获取原图字节（压缩后）
            byte[] originalBytes = imageCompressUtil.compress(file);
            String outputFormat = imageProperties.getOutPutFormat();

            // 生成缩略图（基于压缩后的原图，避免重复压缩）
            byte[] thumbBytes = imageCompressUtil.generateThumbnail(originalBytes, THUMB_WIDTH, outputFormat);

            // 生成UUID文件名
            String originalUuid = UUID.randomUUID() + "." + outputFormat;
            String thumbUuid = UUID.randomUUID() + "." + outputFormat;

            // 上传原图和缩略图（缩略图存入 image/thumb/ 子目录）
            String originalUrl = localStorageUtil.upload(originalBytes, outputFormat, originalUuid);
            String thumbUrl = localStorageUtil.upload(thumbBytes, outputFormat, thumbUuid, "thumb");

            log.info("图片上传成功，原图: {}, 缩略图: {}", originalUrl, thumbUrl);
            return new UploadImageResult(originalUrl, thumbUrl);

        } catch (IOException e) {
            throw new UploadFileErrorException(MessageConstant.UPLOAD_FAILED);
        }
    }

    /**
     * 删除本地存储的文件
     * @param fileUrl 文件URL
     * @return 是否删除成功
     */
    @Override
    public boolean deleteFile(String fileUrl) {
        return localStorageUtil.delete(fileUrl);
    }
}
