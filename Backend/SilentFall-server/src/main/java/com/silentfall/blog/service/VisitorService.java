package com.silentfall.blog.service;

import com.silentfall.blog.dto.VisitorPageQueryDTO;
import com.silentfall.blog.dto.VisitorRecordDTO;
import com.silentfall.blog.result.PageResult;
import com.silentfall.blog.vo.VisitorRecordVO;
import jakarta.servlet.http.HttpServletRequest;

import java.util.List;

public interface VisitorService {
    /**
     * 记录访客访问信息
     * @param visitorRecordDTO
     * @param httpRequest
     * @return
     */
    VisitorRecordVO recordVisitorViewInfo(VisitorRecordDTO visitorRecordDTO, HttpServletRequest httpRequest);

    /**
     * 分页查询访客列表
     * @param visitorPageQueryDTO
     * @return
     */
    PageResult pageQuery(VisitorPageQueryDTO visitorPageQueryDTO);

    /**
     * 批量封禁访客
     * @param ids
     */
    void batchBlock(List<String> ids);

    /**
     * 批量解封访客
     * @param ids
     */
    void batchUnblock(List<String> ids);
}
