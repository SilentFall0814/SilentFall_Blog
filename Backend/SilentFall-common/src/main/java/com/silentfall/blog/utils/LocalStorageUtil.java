package com.silentfall.blog.utils;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@Data
@AllArgsConstructor
@Slf4j
public class LocalStorageUtil {

    private String basePath;
    private String urlPrefix;

    /**
     * 文件上传到本地存储
     * @param bytes 文件字节数组
     * @param extension 文件后缀
     * @param fileName 文件名
     * @return 文件访问URL
     */
    public String upload(byte[] bytes, String extension, String fileName) {
        String category = getFileCategory(extension);
        String objectName = category + "/" + fileName;

        // 构建完整的本地存储路径
        Path dirPath = Paths.get(basePath, category);
        Path filePath = dirPath.resolve(fileName);

        try {
            // 确保目录存在
            Files.createDirectories(dirPath);
            // 写入文件
            Files.write(filePath, bytes);
        } catch (IOException e) {
            log.error("文件上传失败: {}", e.getMessage());
            throw new RuntimeException("文件上传失败", e);
        }

        // 构建访问URL
        String fileUrl = urlPrefix + "/" + objectName;
        log.info("文件上传到: {}", fileUrl);

        return fileUrl;
    }

    /**
     * 获取文件分类
     * @param extension 文件后缀
     * @return 文件分类
     */
    public String getFileCategory(String extension) {
        switch (extension) {
            // 图片
            case "jpg":
            case "png":
            case "gif":
            case "bmp":
            case "webp":
            case "jpeg":
            case "svg":
            case "ico":
            case "tiff":
                return "image";

            // 视频
            case "mp4":
            case "avi":
            case "mov":
            case "mkv":
            case "wmv":
            case "flv":
            case "webm":
            case "m4v":
            case "3gp":
                return "video";

            // 音频
            case "mp3":
            case "wav":
            case "wma":
            case "ogg":
            case "aac":
            case "flac":
            case "m4a":
            case "ape":
            case "mid":
            case "midi":
                return "audio";

            // 歌词
            case "lrc":
            case "lrcx":
            case "krc":
            case "qrc":
            case "trc":
            case "ksc":
                return "lyric";

            // 文档
            case "txt":
            case "md":
            case "rtf":
                return "text";

            case "pdf":
                return "pdf";

            case "doc":
            case "docx":
            case "dot":
            case "dotx":
                return "word";

            case "xls":
            case "xlsx":
            case "xlt":
            case "xltx":
                return "excel";

            // 压缩文件
            case "zip":
            case "rar":
            case "7z":
            case "tar":
            case "gz":
            case "bz2":
                return "archive";

            // 字体
            case "ttf":
            case "otf":
            case "woff":
            case "woff2":
            case "eot":
                return "font";

            default:
                return "other";
        }
    }
}
