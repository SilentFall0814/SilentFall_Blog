package com.silentfall.blog.service.impl;

import com.silentfall.blog.constant.MessageConstant;
import com.silentfall.blog.exception.UploadFileErrorException;
import com.silentfall.blog.properties.ImageProperties;
import com.silentfall.blog.service.CommonService;
import com.silentfall.blog.utils.LocalStorageUtil;
import com.silentfall.blog.utils.ImageCompressUtil;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;

@Service
public class CommonServiceImpl implements CommonService {

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
}
