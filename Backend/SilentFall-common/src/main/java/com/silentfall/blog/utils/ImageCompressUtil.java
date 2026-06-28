package com.silentfall.blog.utils;

import com.silentfall.blog.properties.ImageProperties;
import lombok.extern.slf4j.Slf4j;
import net.coobird.thumbnailator.Thumbnails;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Arrays;
import java.util.List;

/**
 * 图片压缩工具类
 */
@Component
@Slf4j
public class ImageCompressUtil {

    @Autowired
    private ImageProperties imageProperties;

    // 支持的图片格式
    private static final List<String> SUPPORTED_FORMATS = Arrays.asList(
            "jpg", "jpeg", "png", "gif", "bmp", "webp", "tiff", "tif"
    );

    /**
     * 图片压缩
     * 根据原图大小智能选择压缩质量，一次压缩到位，避免循环重新编码
     * @param file
     * @return
     */
    public byte[] compress(MultipartFile file) throws IOException {
        // 如果不需要压缩，直接返回原文件字节
        if(!shouldCompress(file)){
           return file.getBytes();
        }

        // 记录原文件信息
        long originalSize = file.getSize();
        String originalName = file.getOriginalFilename();

        log.info("开始压缩: {} ({}KB)", originalName, originalSize / 1024);

        // 根据原图大小智能选择压缩质量，避免循环重新编码导致耗时过长
        byte[] originalBytes = file.getBytes();
        double quality = chooseQuality(originalSize);
        byte[] compressedBytes = compressWithQuality(originalBytes, quality);

        // 记录压缩后信息
        long compressedSize = compressedBytes.length;
        double ratio = 1.0 - (double) compressedSize / originalSize;

        log.info("压缩完成: {} ({}KB -> {}KB, 压缩率: {}, 质量: {})",
                originalName,
                originalSize / 1024,
                compressedSize / 1024,
                String.format("%.2f",ratio),
                String.format("%.2f", quality));

        return compressedBytes;
    }

    /**
     * 根据原图大小智能选择压缩质量
     * 大图用较低质量以保证文件体积，小图用较高质量保留细节，一次压缩即可达标
     */
    private double chooseQuality(long originalSizeBytes) {
        long kb = originalSizeBytes / 1024;
        if (kb > 5120) {        // 大于 5MB：高质量照片/手机原图
            return 0.6;
        } else if (kb > 2048) { // 大于 2MB
            return 0.7;
        } else if (kb > 1024) { // 大于 1MB
            return 0.75;
        } else {
            return 0.8;         // 小图保留较高质量
        }
    }

    /**
     * 使用指定质量压缩图片
     */
    private byte[] compressWithQuality(byte[] inputBytes, double quality) throws IOException {
        try (ByteArrayInputStream inputStream = new ByteArrayInputStream(inputBytes);
             ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {

            Thumbnails.of(inputStream)
                    .scale(1.0)  // 保持原尺寸
                    .imageType(BufferedImage.TYPE_INT_RGB) // 强制标准RGB，防止WebP色彩空间转换偏绿
                    .outputFormat(imageProperties.getOutPutFormat())
                    .outputQuality(quality)
                    .toOutputStream(outputStream);

            return outputStream.toByteArray();
        }
    }

    private boolean shouldCompress(MultipartFile file) throws IOException {
        // 检查是否开启图片压缩
        if(!imageProperties.isEnabled()){
            return false;
        }
        // 检查文件类型
        String originalName = file.getOriginalFilename();
        if (originalName == null) {
            return false;
        }
        String extension = getFileExtension(originalName).toLowerCase();
        if (!SUPPORTED_FORMATS.contains(extension)) {
            return false;
        }

        // 检查文件大小, 如果没超过限制，不压缩
        if(!isOversized(file.getBytes())){
            return false;
        }

        return true;
    }

    /**
     * 检查是否超过限制大小
     */
    private boolean isOversized(byte[] data) {
        int sizeKb = data.length / 1024;
        return sizeKb > imageProperties.getMaxSizeKb();
    }

    /**
     * 获取文件扩展名
     */
    private String getFileExtension(String filename) {
        int dotIndex = filename.lastIndexOf('.');
        return (dotIndex == -1) ? "" : filename.substring(dotIndex + 1);
    }

    /**
     * 生成缩略图（按指定宽度等比缩放）
     * @param inputBytes 原图字节数组
     * @param width 目标宽度（像素），高度按比例自动计算
     * @param outputFormat 输出格式（如 "webp"、"jpg"）
     * @return 缩略图字节数组
     */
    public byte[] generateThumbnail(byte[] inputBytes, int width, String outputFormat) throws IOException {
        try (ByteArrayInputStream inputStream = new ByteArrayInputStream(inputBytes);
             ByteArrayOutputStream outputStream = new ByteArrayOutputStream()) {

            Thumbnails.of(inputStream)
                    .width(width)  // 按宽度等比缩放
                    .imageType(BufferedImage.TYPE_INT_RGB)
                    .outputFormat(outputFormat)
                    .outputQuality(0.85)
                    .toOutputStream(outputStream);

            return outputStream.toByteArray();
        }
    }
}
