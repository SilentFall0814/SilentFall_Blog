package com.silentfall.blog.service.impl;

import com.silentfall.blog.dto.OperationLogPageQueryDTO;
import com.silentfall.blog.entity.OperationLogs;
import com.silentfall.blog.repository.OperationLogRepository;
import com.silentfall.blog.result.PageResult;
import com.silentfall.blog.service.OperationLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class OperationLogServiceImpl implements OperationLogService {

    @Autowired
    private OperationLogRepository operationLogRepository;

    @Autowired
    private MongoTemplate mongoTemplate;

    /**
     * 保存操作日志
     * @param operationLogs
     */
    public void save(OperationLogs operationLogs) {
        operationLogRepository.save(operationLogs);
    }

    /**
     * 分页查询操作日志
     * @param operationLogPageQueryDTO
     * @return
     */
    public PageResult pageQuery(OperationLogPageQueryDTO operationLogPageQueryDTO) {
        int page = operationLogPageQueryDTO.getPage();
        int pageSize = operationLogPageQueryDTO.getPageSize();
        Pageable pageable = PageRequest.of(page - 1, pageSize, Sort.by(Sort.Direction.DESC, "operationTime"));

        // 构建查询条件
        Query query = new Query().with(pageable);
        Criteria criteria = new Criteria();

        if (operationLogPageQueryDTO.getOperationType() != null && !operationLogPageQueryDTO.getOperationType().isEmpty()) {
            criteria.and("operationType").is(operationLogPageQueryDTO.getOperationType());
        }
        if (operationLogPageQueryDTO.getBeginTime() != null) {
            criteria.and("operationTime").gte(operationLogPageQueryDTO.getBeginTime());
        }
        if (operationLogPageQueryDTO.getEndTime() != null) {
            criteria.and("operationTime").lte(operationLogPageQueryDTO.getEndTime());
        }

        if (criteria.getCriteriaObject().keySet().size() > 0) {
            query.addCriteria(criteria);
        }

        long total = mongoTemplate.count(query, OperationLogs.class);
        List<OperationLogs> records = mongoTemplate.find(query, OperationLogs.class);
        return new PageResult(total, records);
    }

    /**
     * 批量删除操作日志
     * @param ids
     */
    public void batchDelete(List<String> ids) {
        operationLogRepository.deleteAllById(ids);
    }
}
