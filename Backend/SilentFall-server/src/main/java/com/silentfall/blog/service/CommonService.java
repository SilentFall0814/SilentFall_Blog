package com.silentfall.blog.service;

import org.springframework.web.multipart.MultipartFile;

public interface CommonService {
    /**
     * 文件上传
     * @param file 文件
     */
    String uploadFile(MultipartFile file);

    /**
     * 图片上传（同时生成缩略图）
     * @param file 图片文件
     * @return 包含 originalUrl 和 thumbUrl 的对象
     */
    UploadImageResult uploadImageWithThumb(MultipartFile file);

    /**
     * 上传图片结果
     */
    class UploadImageResult {
        // 原图URL
        public String originalUrl;
        // 缩略图URL
        public String thumbUrl;

        public UploadImageResult(String originalUrl, String thumbUrl) {
            this.originalUrl = originalUrl;
            this.thumbUrl = thumbUrl;
        }

        public String getOriginalUrl() {
            return originalUrl;
        }

        public String getThumbUrl() {
            return thumbUrl;
        }
    }

    /**
     * 删除本地存储的文件
     * @param fileUrl 文件URL
     * @return 是否删除成功
     */
    boolean deleteFile(String fileUrl);
}
