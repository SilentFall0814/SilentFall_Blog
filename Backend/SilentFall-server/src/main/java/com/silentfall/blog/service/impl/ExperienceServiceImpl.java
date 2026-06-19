package com.silentfall.blog.service.impl;

import com.silentfall.blog.constant.StatusConstant;
import com.silentfall.blog.dto.ExperienceDTO;
import com.silentfall.blog.entity.Experiences;
import com.silentfall.blog.repository.ExperienceRepository;
import com.silentfall.blog.service.ExperienceService;
import com.silentfall.blog.vo.ExperienceVO;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;

@Service
public class ExperienceServiceImpl implements ExperienceService {

    @Autowired
    private ExperienceRepository experienceRepository;

    /**
     * 获取经历信息
     * @param type
     * @return
     */
    @Cacheable(value = "experiences", key = "'type_' + #type")
    public List<Experiences> getExperience(Integer type) {
        return experienceRepository.findByType(type);
    }

    /**
     * 添加经历信息
     * @param experienceDTO
     */
    @CacheEvict(value = "experiences", allEntries = true)
    public void addExperience(ExperienceDTO experienceDTO) {
        Experiences experiences = new Experiences();
        BeanUtils.copyProperties(experienceDTO, experiences);
        experienceRepository.save(experiences);
    }

    /**
     * 修改经历信息
     * @param experienceDTO
     */
    @CacheEvict(value = "experiences", allEntries = true)
    public void updateExperience(ExperienceDTO experienceDTO) {
        Experiences experiences = new Experiences();
        BeanUtils.copyProperties(experienceDTO, experiences);
        experienceRepository.save(experiences);
    }

    /**
     * 批量删除经历信息
     * @param ids
     */
    @CacheEvict(value = "experiences", allEntries = true)
    public void batchDelete(List<String> ids) {
        experienceRepository.deleteAllById(ids);
    }

    /**
     * cv端获取全部经历信息
     * @return
     */
    @Cacheable(value = "experiences", key = "'all'")
    public List<ExperienceVO> getAllExperience() {
        List<Experiences> experienceList = experienceRepository.findByIsVisible(StatusConstant.ENABLE);
        if(experienceList != null && !experienceList.isEmpty()) {
            List<ExperienceVO> experienceVOList = experienceList.stream().map(experiences -> ExperienceVO.builder()
                    .id(experiences.getId())
                    .type(experiences.getType())
                    .title(experiences.getTitle())
                    .subtitle(experiences.getSubtitle())
                    .logoUrl(experiences.getLogoUrl())
                    .startDate(experiences.getStartDate())
                    .endDate(experiences.getEndDate())
                    .content(experiences.getContent())
                    .build()
            ).toList();
            return experienceVOList;
        }
        return Collections.emptyList();
    }
}
