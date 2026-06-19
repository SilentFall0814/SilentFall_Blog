package com.silentfall.blog.service.impl;

import com.silentfall.blog.constant.StatusConstant;
import com.silentfall.blog.dto.SkillDTO;
import com.silentfall.blog.entity.Skills;
import com.silentfall.blog.repository.SkillRepository;
import com.silentfall.blog.service.SkillService;
import com.silentfall.blog.vo.SkillVO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;

@Service
@Slf4j
public class SkillServiceImpl implements SkillService {

    @Autowired
    private SkillRepository skillRepository;

    /**
     * 获取所有技能信息
     * @return
     */
    @Cacheable(value = "skills", key = "'all'")
    public List<Skills> getAllSkill() {
        return skillRepository.findAll();
    }

    /**
     * 添加技能信息
     * @param skillDTO
     */
    @CacheEvict(value = "skills", allEntries = true)
    public void addSkill(SkillDTO skillDTO) {
        Skills skills = new Skills();
        BeanUtils.copyProperties(skillDTO, skills);
        skillRepository.save(skills);
    }

    /**
     * 批量删除技能信息
     * @param ids
     */
    @CacheEvict(value = "skills", allEntries = true)
    public void batchDelete(List<String> ids) {
        skillRepository.deleteAllById(ids);
    }

    /**
     * 修改技能信息
     * @param skillDTO
     */
    @CacheEvict(value = "skills", allEntries = true)
    public void updateSkill(SkillDTO skillDTO) {
        Skills skills = new Skills();
        BeanUtils.copyProperties(skillDTO, skills);
        skillRepository.save(skills);
    }

    /**
     * 简历端获取技能信息
     * @return
     */
    @Cacheable(value = "skills", key = "'visible'")
    public List<SkillVO> getSkillVO() {
        List<Skills> skills = skillRepository.findByIsVisible(StatusConstant.ENABLE);
        if(skills!=null && !skills.isEmpty()){
            List<SkillVO> skillVOList = skills.stream().map(skill -> SkillVO.builder()
                    .id(skill.getId())
                    .name(skill.getName())
                    .description(skill.getDescription())
                    .icon(skill.getIcon())
                    .sort(skill.getSort())
                    .build()
            ).toList();
            return skillVOList;
        }
        return Collections.emptyList();
    }
}
