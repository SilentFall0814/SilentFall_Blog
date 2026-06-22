package com.silentfall.blog.service.impl;

import com.silentfall.blog.constant.StatusConstant;
import com.silentfall.blog.dto.AlbumDTO;
import com.silentfall.blog.dto.AlbumPageQueryDTO;
import com.silentfall.blog.entity.Album;
import com.silentfall.blog.entity.Photo;
import com.silentfall.blog.repository.AlbumRepository;
import com.silentfall.blog.repository.PhotoRepository;
import com.silentfall.blog.result.PageResult;
import com.silentfall.blog.service.AlbumService;
import com.silentfall.blog.service.CommonService;
import com.silentfall.blog.vo.AlbumDetailVO;
import com.silentfall.blog.vo.AlbumVO;
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
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 相册服务实现
 */
@Service
@Slf4j
public class AlbumServiceImpl implements AlbumService {

    @Autowired
    private AlbumRepository albumRepository;

    @Autowired
    private PhotoRepository photoRepository;

    @Autowired
    private MongoTemplate mongoTemplate;

    @Autowired
    private CommonService commonService;

    /**
     * 分页查询相册列表（管理端）
     */
    @Override
    public PageResult pageQuery(AlbumPageQueryDTO albumPageQueryDTO) {
        int page = albumPageQueryDTO.getPage();
        int pageSize = albumPageQueryDTO.getPageSize();
        Pageable pageable = PageRequest.of(page - 1, pageSize, Sort.by(Sort.Direction.DESC, "createTime"));

        Query query = new Query().with(pageable);
        Criteria criteria = new Criteria();

        if (albumPageQueryDTO.getTitle() != null && !albumPageQueryDTO.getTitle().isEmpty()) {
            criteria.and("title").regex(albumPageQueryDTO.getTitle(), "i");
        }

        if (criteria.getCriteriaObject().keySet().size() > 0) {
            query.addCriteria(criteria);
        }

        long total = mongoTemplate.count(query, Album.class);
        List<Album> albumList = mongoTemplate.find(query, Album.class);

        return new PageResult(total, albumList);
    }

    /**
     * 根据ID查询相册
     */
    @Override
    public Album getById(String id) {
        return albumRepository.findById(id).orElse(null);
    }

    /**
     * 创建相册
     */
    @Override
    @CacheEvict(value = "albumList", allEntries = true)
    public void addAlbum(AlbumDTO albumDTO) {
        Album album = new Album();
        BeanUtils.copyProperties(albumDTO, album);
        album.setPhotoCount(0);
        album.setCreateTime(LocalDateTime.now());
        album.setUpdateTime(LocalDateTime.now());
        if (album.getIsVisible() == null) {
            album.setIsVisible(StatusConstant.ENABLE);
        }
        if (album.getSort() == null) {
            album.setSort(0);
        }
        albumRepository.save(album);
    }

    /**
     * 更新相册
     */
    @Override
    @CacheEvict(value = {"albumList", "photoList", "albumDetail"}, allEntries = true)
    public void updateAlbum(AlbumDTO albumDTO) {
        Album album = albumRepository.findById(albumDTO.getId())
                .orElseThrow(() -> new RuntimeException("相册不存在"));
        // 保存旧封面URL用于清理
        String oldCover = album.getCoverImage();
        String oldCoverThumb = album.getCoverImageThumb();

        BeanUtils.copyProperties(albumDTO, album);
        album.setUpdateTime(LocalDateTime.now());

        // 如果封面被更换，删除旧封面文件
        if (oldCover != null && !oldCover.equals(albumDTO.getCoverImage())) {
            commonService.deleteFile(oldCover);
        }
        if (oldCoverThumb != null && !oldCoverThumb.equals(albumDTO.getCoverImageThumb())) {
            commonService.deleteFile(oldCoverThumb);
        }

        albumRepository.save(album);
    }

    /**
     * 批量删除相册（同时删除旗下照片和文件）
     */
    @Override
    @CacheEvict(value = {"albumList", "photoList", "albumDetail"}, allEntries = true)
    public void batchDelete(List<String> ids) {
        for (String id : ids) {
            // 删除相册封面文件
            Album album = albumRepository.findById(id).orElse(null);
            if (album != null) {
                if (album.getCoverImage() != null) {
                    commonService.deleteFile(album.getCoverImage());
                }
                if (album.getCoverImageThumb() != null) {
                    commonService.deleteFile(album.getCoverImageThumb());
                }
                // 删除该相册下所有照片
                List<Photo> photos = photoRepository.findByAlbumId(id);
                for (Photo photo : photos) {
                    if (photo.getImageUrl() != null) {
                        commonService.deleteFile(photo.getImageUrl());
                    }
                    if (photo.getImageUrlThumb() != null) {
                        commonService.deleteFile(photo.getImageUrlThumb());
                    }
                }
                photoRepository.deleteByAlbumId(id);
            }
        }
        albumRepository.deleteAllById(ids);
    }

    /**
     * 博客端获取所有可见相册
     */
    @Override
    @Cacheable(value = "albumList", key = "'visible'")
    public List<AlbumVO> getVisibleAlbums() {
        List<Album> albumList = albumRepository.findByIsVisible(StatusConstant.ENABLE);
        if (albumList == null || albumList.isEmpty()) {
            return Collections.emptyList();
        }
        // 按拍摄日期倒序、再按排序值正序
        return albumList.stream()
                .sorted((a, b) -> {
                    int dateCompare = (b.getDate() == null ? "" : b.getDate())
                            .compareTo(a.getDate() == null ? "" : a.getDate());
                    if (dateCompare != 0) return dateCompare;
                    return Integer.compare(
                            a.getSort() == null ? 0 : a.getSort(),
                            b.getSort() == null ? 0 : b.getSort()
                    );
                })
                .map(album -> AlbumVO.builder()
                        .id(album.getId())
                        .title(album.getTitle())
                        .description(album.getDescription())
                        .coverImageThumb(album.getCoverImageThumb() != null ? album.getCoverImageThumb() : album.getCoverImage())
                        .date(album.getDate())
                        .photoCount(album.getPhotoCount() != null ? album.getPhotoCount() : 0)
                        .sort(album.getSort())
                        .build())
                .collect(Collectors.toList());
    }

    /**
     * 博客端获取相册详情
     */
    @Override
    @Cacheable(value = "albumDetail", key = "#id")
    public AlbumDetailVO getAlbumDetail(String id) {
        Album album = albumRepository.findById(id).orElse(null);
        if (album == null) {
            return null;
        }
        return AlbumDetailVO.builder()
                .id(album.getId())
                .title(album.getTitle())
                .description(album.getDescription())
                .coverImage(album.getCoverImage())
                .date(album.getDate())
                .photoCount(album.getPhotoCount() != null ? album.getPhotoCount() : 0)
                .sort(album.getSort())
                .build();
    }

    /**
     * 跨相册搜索照片（按相册名或照片描述匹配）
     * 返回结果包含相册信息，前端按相册分组展示
     */
    @Override
    public List<Map<String, Object>> searchPhotos(String keyword) {
        if (keyword == null || keyword.trim().isEmpty()) {
            return Collections.emptyList();
        }

        // 1. 查找名称匹配的相册（直接返回整个相册作为一组）
        Query albumQuery = new Query();
        albumQuery.addCriteria(Criteria.where("title").regex(keyword, "i")
                .and("isVisible").is(StatusConstant.ENABLE));
        List<Album> matchedAlbums = mongoTemplate.find(albumQuery, Album.class);

        // 2. 查找描述匹配的照片
        Query photoQuery = new Query();
        photoQuery.addCriteria(Criteria.where("caption").regex(keyword, "i"));
        List<Photo> matchedPhotos = mongoTemplate.find(photoQuery, Photo.class);

        // 3. 收集所有相关相册ID
        Set<String> albumIds = new HashSet<>();
        albumIds.addAll(matchedAlbums.stream().map(Album::getId).collect(Collectors.toSet()));
        albumIds.addAll(matchedPhotos.stream().map(Photo::getAlbumId).collect(Collectors.toSet()));

        if (albumIds.isEmpty()) {
            return Collections.emptyList();
        }

        // 4. 查询这些相册的完整信息（仅可见的）
        Query visibleAlbumQuery = new Query();
        visibleAlbumQuery.addCriteria(Criteria.where("_id").in(albumIds)
                .and("isVisible").is(StatusConstant.ENABLE));
        List<Album> albums = mongoTemplate.find(visibleAlbumQuery, Album.class);
        Map<String, Album> albumMap = albums.stream()
                .collect(Collectors.toMap(Album::getId, a -> a));

        // 5. 对每个相册，返回匹配的照片（如果是相册名匹配，返回该相册所有照片）
        List<Map<String, Object>> result = new ArrayList<>();
        for (Album album : albums) {
            List<Photo> photos;
            if (matchedAlbums.stream().anyMatch(a -> a.getId().equals(album.getId()))) {
                // 相册名匹配：返回该相册所有照片
                photos = photoRepository.findByAlbumId(album.getId());
            } else {
                // 照片描述匹配：只返回匹配的照片
                photos = matchedPhotos.stream()
                        .filter(p -> album.getId().equals(p.getAlbumId()))
                        .collect(Collectors.toList());
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

            List<PhotoVO> photoVOs = photos.stream()
                    .map(p -> PhotoVO.builder()
                            .id(p.getId())
                            .albumId(p.getAlbumId())
                            .imageUrl(p.getImageUrl())
                            .imageUrlThumb(p.getImageUrlThumb() != null ? p.getImageUrlThumb() : p.getImageUrl())
                            .caption(p.getCaption())
                            .sortOrder(p.getSortOrder())
                            .albumTitle(album.getTitle())
                            .build())
                    .collect(Collectors.toList());

            Map<String, Object> group = new HashMap<>();
            group.put("albumId", album.getId());
            group.put("albumTitle", album.getTitle());
            group.put("albumDate", album.getDate());
            group.put("albumDescription", album.getDescription());
            group.put("coverImageThumb", album.getCoverImageThumb() != null ? album.getCoverImageThumb() : album.getCoverImage());
            group.put("photos", photoVOs);
            result.add(group);
        }

        return result;
    }
}
