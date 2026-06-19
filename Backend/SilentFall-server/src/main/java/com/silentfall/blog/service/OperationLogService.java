package com.silentfall.blog.service;

import com.silentfall.blog.dto.OperationLogPageQueryDTO;
import com.silentfall.blog.entity.OperationLogs;
import com.silentfall.blog.result.PageResult;

import java.util.List;

public interface OperationLogService {
    /**
     * 保存操作日志
     * @param operationLogs
     */
    void save(OperationLogs operationLogs);

    /**
     * 分页查询操作日志
     * @param operationLogPageQueryDTO
     * @return
     */
    PageResult pageQuery(OperationLogPageQueryDTO operationLogPageQueryDTO);

    /**
     * 批量删除操作日志
     * @param ids
     */
    void batchDelete(List<String> ids);
}
