package com.silentfall.blog.service.impl;

import com.silentfall.blog.dto.ViewPageQueryDTO;
import com.silentfall.blog.entity.Views;
import com.silentfall.blog.repository.ViewRepository;
import com.silentfall.blog.result.PageResult;
import com.silentfall.blog.service.ViewService;
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
public class ViewServiceImpl implements ViewService {

    @Autowired
    private ViewRepository viewRepository;

    @Autowired
    private MongoTemplate mongoTemplate;

    /**
     * 分页查询浏览记录
     * @param viewPageQueryDTO
     * @return
     */
    public PageResult pageQuery(ViewPageQueryDTO viewPageQueryDTO) {
        int page = viewPageQueryDTO.getPage();
        int pageSize = viewPageQueryDTO.getPageSize();
        Pageable pageable = PageRequest.of(page - 1, pageSize, Sort.by(Sort.Direction.DESC, "viewTime"));

        // 构建查询条件
        Query query = new Query().with(pageable);
        Criteria criteria = new Criteria();

        if (viewPageQueryDTO.getBeginTime() != null) {
            criteria.and("viewTime").gte(viewPageQueryDTO.getBeginTime());
        }
        if (viewPageQueryDTO.getEndTime() != null) {
            criteria.and("viewTime").lte(viewPageQueryDTO.getEndTime());
        }

        if (criteria.getCriteriaObject().keySet().size() > 0) {
            query.addCriteria(criteria);
        }

        long total = mongoTemplate.count(query, Views.class);
        List<Views> records = mongoTemplate.find(query, Views.class);
        return new PageResult(total, records);
    }

    /**
     * 批量删除浏览记录
     * @param ids
     */
    public void batchDelete(List<String> ids) {
        viewRepository.deleteAllById(ids);
    }
}
