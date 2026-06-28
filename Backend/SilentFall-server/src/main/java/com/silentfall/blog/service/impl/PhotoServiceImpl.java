package com.silentfall.blog.service.impl;

import com.silentfall.blog.dto.PhotoDTO;
import com.silentfall.blog.dto.PhotoPageQueryDTO;
import com.silentfall.blog.entity.Album;
import com.silentfall.blog.entity.Photo;
import com.silentfall.blog.repository.AlbumRepository;
import com.silentfall.blog.repository.PhotoRepository;
import com.silentfall.blog.result.PageResult;
import com.silentfall.blog.service.CommonService;
import com.silentfall.blog.service.PhotoService;
import com.silentfall.blog.vo.PhotoVO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 照片服务实现
 */
@Service
@Slf4j
public class PhotoServiceImpl implements PhotoService {

    @Autowired
    private PhotoRepository photoRepository;

    @Autowired
    private AlbumRepository albumRepository;

    @Autowired
    private CommonService commonService;

    /**
     * 分页查询某相册的照片（管理端，按上传时间倒序）
     */
    @Override
    public PageResult pageQuery(PhotoPageQueryDTO photoPageQueryDTO) {
        int page = photoPageQueryDTO.getPage();
        int pageSize = photoPageQueryDTO.getPageSize();
        Pageable pageable = PageRequest.of(page - 1, pageSize, Sort.by(Sort.Direction.DESC, "createTime"));

        Page<Photo> photoPage;
        if (photoPageQueryDTO.getAlbumId() != null && !photoPageQueryDTO.getAlbumId().isEmpty()) {
            // 使用 repository 的查询方法需要自定义分页，这里用 mongoTemplate 更灵活
            // 但 PhotoRepository 没有分页方法，这里用 findAll + pageable 然后过滤
            // 更好的方式是直接用 findByAlbumId 然后手动分页
            List<Photo> allPhotos = photoRepository.findByAlbumId(photoPageQueryDTO.getAlbumId());
            allPhotos.sort((a, b) -> {
                LocalDateTime ta = a.getCreateTime();
                LocalDateTime tb = b.getCreateTime();
                if (ta == null && tb == null) return 0;
                if (ta == null) return 1;
                if (tb == null) return -1;
                return tb.compareTo(ta);
            });

            int start = (page - 1) * pageSize;
            int end = Math.min(start + pageSize, allPhotos.size());
            List<Photo> records = start < end ? allPhotos.subList(start, end) : Collections.emptyList();

            return new PageResult(allPhotos.size(), records);
        } else {
            photoPage = photoRepository.findAll(pageable);
            return new PageResult(photoPage.getTotalElements(), photoPage.getContent());
        }
    }

    /**
     * 根据ID查询照片
     */
    @Override
    public Photo getById(String id) {
        return photoRepository.findById(id).orElse(null);
    }

    /**
     * 批量上传照片（同时填写描述）
     * @param albumId 相册ID
     * @param files 照片文件列表
     * @param captions 描述列表（与文件列表一一对应）
     */
    @Override
    @CacheEvict(value = {"photoList", "albumList", "albumDetail"}, allEntries = true)
    public void batchUpload(String albumId, MultipartFile[] files, String[] captions) {
        if (files == null || files.length == 0) {
            throw new RuntimeException("未选择文件");
        }

        // 校验相册存在
        Album album = albumRepository.findById(albumId)
                .orElseThrow(() -> new RuntimeException("相册不存在"));

        // 串行处理批量上传，避免并行压缩多张大图导致 JVM 堆内存溢出（OOM）
        // 单张压缩已优化为一次到位（1-2秒），串行 7 张约 10-15 秒，远优于原 30 分钟
        int successCount = 0;
        for (int i = 0; i < files.length; i++) {
            MultipartFile file = files[i];
            if (file.isEmpty()) continue;

            try {
                // 上传图片（同时生成缩略图）
                CommonService.UploadImageResult uploadResult = commonService.uploadImageWithThumb(file);

                // 获取该照片的描述（captions 与 files 一一对应）
                String caption = "";
                if (captions != null && i < captions.length) {
                    caption = captions[i] != null ? captions[i].trim() : "";
                }

                Photo photo = Photo.builder()
                        .albumId(albumId)
                        .imageUrl(uploadResult.getOriginalUrl())
                        .imageUrlThumb(uploadResult.getThumbUrl())
                        .caption(caption)
                        .sortOrder(i)
                        .createTime(LocalDateTime.now())
                        .updateTime(LocalDateTime.now())
                        .build();
                photoRepository.save(photo);
                successCount++;
            } catch (Exception e) {
                log.error("照片上传失败: {}, 错误: {}", file.getOriginalFilename(), e.getMessage());
                // 单张失败不影响其他照片
            }
        }

        // 更新相册的照片数量
        long count = photoRepository.countByAlbumId(albumId);
        album.setPhotoCount((int) count);
        album.setUpdateTime(LocalDateTime.now());
        albumRepository.save(album);

        log.info("批量上传完成，相册: {}, 成功: {}/{}", albumId, successCount, files.length);
    }

    /**
     * 更新照片（修改描述/排序）
     */
    @Override
    @CacheEvict(value = {"photoList", "albumList", "albumDetail"}, allEntries = true)
    public void updatePhoto(PhotoDTO photoDTO) {
        Photo photo = photoRepository.findById(photoDTO.getId())
                .orElseThrow(() -> new RuntimeException("照片不存在"));

        // 仅更新描述和排序
        photo.setCaption(photoDTO.getCaption());
        if (photoDTO.getSortOrder() != null) {
            photo.setSortOrder(photoDTO.getSortOrder());
        }
        photo.setUpdateTime(LocalDateTime.now());
        photoRepository.save(photo);
    }

    /**
     * 批量删除照片（同时删除文件）
     */
    @Override
    @CacheEvict(value = {"photoList", "albumList", "albumDetail"}, allEntries = true)
    public void batchDelete(List<String> ids) {
        for (String id : ids) {
            Photo photo = photoRepository.findById(id).orElse(null);
            if (photo != null) {
                // 删除原图和缩略图文件
                if (photo.getImageUrl() != null) {
                    commonService.deleteFile(photo.getImageUrl());
                }
                if (photo.getImageUrlThumb() != null) {
                    commonService.deleteFile(photo.getImageUrlThumb());
                }
                // 更新相册照片数量
                String albumId = photo.getAlbumId();
                photoRepository.deleteById(id);
                if (albumId != null) {
                    Album album = albumRepository.findById(albumId).orElse(null);
                    if (album != null) {
                        long count = photoRepository.countByAlbumId(albumId);
                        album.setPhotoCount((int) count);
                        album.setUpdateTime(LocalDateTime.now());
                        albumRepository.save(album);
                    }
                }
            }
        }
    }

    /**
     * 博客端获取相册下所有照片（按上传时间倒序）
     */
    @Override
    @Cacheable(value = "photoList", key = "#albumId")
    public List<PhotoVO> getPhotosByAlbumId(String albumId) {
        List<Photo> photos = photoRepository.findByAlbumId(albumId);
        if (photos == null || photos.isEmpty()) {
            return Collections.emptyList();
        }
        // 按上传时间倒序
        photos.sort((a, b) -> {
            LocalDateTime ta = a.getCreateTime();
            LocalDateTime tb = b.getCreateTime();
            if (ta == null && tb == null) return 0;
            if (ta == null) return 1;
            if (tb == null) return -1;
            return tb.compareTo(ta);
        });

        return photos.stream()
                .map(photo -> PhotoVO.builder()
                        .id(photo.getId())
                        .albumId(photo.getAlbumId())
                        .imageUrl(photo.getImageUrl())
                        .imageUrlThumb(photo.getImageUrlThumb() != null ? photo.getImageUrlThumb() : photo.getImageUrl())
                        .caption(photo.getCaption())
                        .sortOrder(photo.getSortOrder())
                        .build())
                .collect(Collectors.toList());
    }
}
