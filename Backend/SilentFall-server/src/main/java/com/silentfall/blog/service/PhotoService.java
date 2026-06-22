package com.silentfall.blog.service;

import com.silentfall.blog.dto.PhotoDTO;
import com.silentfall.blog.dto.PhotoPageQueryDTO;
import com.silentfall.blog.entity.Photo;
import com.silentfall.blog.result.PageResult;
import com.silentfall.blog.vo.PhotoVO;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface PhotoService {

    /**
     * 分页查询某相册的照片（管理端）
     * @param photoPageQueryDTO
     * @return
     */
    PageResult pageQuery(PhotoPageQueryDTO photoPageQueryDTO);

    /**
     * 根据ID查询照片
     * @param id
     * @return
     */
    Photo getById(String id);

    /**
     * 批量上传照片（同时填写描述）
     * @param albumId 相册ID
     * @param files 照片文件列表
     * @param captions 描述列表（与文件列表一一对应，逗号分隔）
     */
    void batchUpload(String albumId, MultipartFile[] files, String[] captions);

    /**
     * 更新照片（修改描述/排序）
     * @param photoDTO
     */
    void updatePhoto(PhotoDTO photoDTO);

    /**
     * 批量删除照片（同时删除文件）
     * @param ids
     */
    void batchDelete(List<String> ids);

    /**
     * 博客端获取相册下所有照片（按上传时间倒序）
     * @param albumId
     * @return
     */
    List<PhotoVO> getPhotosByAlbumId(String albumId);
}
