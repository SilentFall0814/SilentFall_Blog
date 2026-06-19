package com.silentfall.blog.service.impl;

import com.silentfall.blog.constant.MessageConstant;
import com.silentfall.blog.dto.SystemConfigDTO;
import com.silentfall.blog.entity.SystemConfig;
import com.silentfall.blog.exception.SystemConfigException;
import com.silentfall.blog.repository.SystemConfigRepository;
import com.silentfall.blog.service.SystemConfigService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Slf4j
public class SystemConfigServiceImpl implements SystemConfigService {

    @Autowired
    private SystemConfigRepository systemConfigRepository;

    @Autowired
    private MongoTemplate mongoTemplate;

    /**
     * 获取所有系统配置
     * @return
     */
    public List<SystemConfig> listAll() {
        return systemConfigRepository.findAll();
    }

    /**
     * 根据配置键获取配置
     * @param configKey
     * @return
     */
    @Cacheable(value = "systemConfig", key = "#configKey", unless = "#result == null")
    public SystemConfig getByKey(String configKey) {
        Query query = new Query(Criteria.where("configKey").is(configKey));
        return mongoTemplate.findOne(query, SystemConfig.class);
    }

    /**
     * 根据ID获取配置
     * @param id
     * @return
     */
    public SystemConfig getById(String id) {
        return systemConfigRepository.findById(id).orElse(null);
    }

    /**
     * 添加系统配置
     * @param systemConfigDTO
     */
    @CacheEvict(value = "systemConfig", allEntries = true)
    public void addConfig(SystemConfigDTO systemConfigDTO) {
        // 检查配置键是否已存在
        Query query = new Query(Criteria.where("configKey").is(systemConfigDTO.getConfigKey()));
        SystemConfig existingConfig = mongoTemplate.findOne(query, SystemConfig.class);
        if (existingConfig != null) {
            throw new SystemConfigException(MessageConstant.ConfigKeyExists);
        }
        SystemConfig systemConfig = new SystemConfig();
        BeanUtils.copyProperties(systemConfigDTO, systemConfig);
        systemConfigRepository.save(systemConfig);
    }

    /**
     * 更新系统配置
     * @param systemConfigDTO
     */
    @CacheEvict(value = "systemConfig", allEntries = true)
    public void updateConfig(SystemConfigDTO systemConfigDTO) {
        SystemConfig systemConfig = new SystemConfig();
        BeanUtils.copyProperties(systemConfigDTO, systemConfig);
        systemConfigRepository.save(systemConfig);
    }

    /**
     * 批量删除系统配置
     * @param ids
     */
    @CacheEvict(value = "systemConfig", allEntries = true)
    public void batchDelete(List<String> ids) {
        systemConfigRepository.deleteAllById(ids);
    }
}
