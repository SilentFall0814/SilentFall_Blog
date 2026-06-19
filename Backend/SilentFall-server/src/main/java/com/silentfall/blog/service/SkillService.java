package com.silentfall.blog.service;

import com.silentfall.blog.dto.SkillDTO;
import com.silentfall.blog.entity.Skills;
import com.silentfall.blog.vo.SkillVO;

import java.util.List;

public interface SkillService {
    /**
     * 获取所有技能信息
     * @return
     */
    List<Skills> getAllSkill();

    /**
     * 添加技能
     * @param skillDTO
     */
    void addSkill(SkillDTO skillDTO);

    /**
     * 批量删除技能
     * @param ids
     */
    void batchDelete(List<String> ids);

    /**
     * 修改技能
     * @param skillDTO
     */
    void updateSkill(SkillDTO skillDTO);

    /**
     * 简历端获取技能信息
     * @return
     */
    List<SkillVO> getSkillVO();
}
