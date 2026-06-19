package com.silentfall.blog.service;

import com.silentfall.blog.dto.PersonalInfoDTO;
import com.silentfall.blog.entity.PersonalInfo;
import com.silentfall.blog.vo.PersonalInfoVO;

public interface PersonalInfoService {
    /**
     * 获取个人信息
     * @return
     */
    PersonalInfo getAllPersonalInfo();

    /**
     * 更新个人信息
     * @param personalInfoDTO
     */
    void updatePersonalInfo(PersonalInfoDTO personalInfoDTO);

    /**
     * 其他端获取个人信息
     * @return
     */
    PersonalInfoVO getPersonalInfo();
}
