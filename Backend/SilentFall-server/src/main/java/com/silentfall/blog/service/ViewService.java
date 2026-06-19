package com.silentfall.blog.service;

import com.silentfall.blog.dto.ViewPageQueryDTO;
import com.silentfall.blog.result.PageResult;

import java.util.List;

public interface ViewService {
    /**
     * 分页查询浏览记录
     * @param viewPageQueryDTO
     * @return
     */
    PageResult pageQuery(ViewPageQueryDTO viewPageQueryDTO);

    /**
     * 批量删除浏览记录
     * @param ids
     */
    void batchDelete(List<String> ids);
}
