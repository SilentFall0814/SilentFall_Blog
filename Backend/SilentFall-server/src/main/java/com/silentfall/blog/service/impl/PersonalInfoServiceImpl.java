package com.silentfall.blog.service.impl;


import com.silentfall.blog.dto.PersonalInfoDTO;
import com.silentfall.blog.entity.PersonalInfo;
import com.silentfall.blog.repository.PersonalInfoRepository;
import com.silentfall.blog.service.PersonalInfoService;
import com.silentfall.blog.vo.PersonalInfoVO;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PersonalInfoServiceImpl implements PersonalInfoService {

    @Autowired
    private PersonalInfoRepository personalInfoRepository;

    /**
     * 管理端获取所有个人信息
     * @return
     */
    @Cacheable(value = "personalInfo", key = "'all'", unless = "#result == null")
    public PersonalInfo getAllPersonalInfo() {
        // MongoDB中通常只有一条个人信息记录，仅查第一条避免全表扫描
        List<PersonalInfo> list = personalInfoRepository.findAll(PageRequest.of(0, 1)).getContent();
        return list.isEmpty() ? null : list.get(0);
    }

    /**
     * 管理端更新个人信息
     * @param personalInfo
     */
    @CacheEvict(value = "personalInfo", allEntries = true)
    public void updatePersonalInfo(PersonalInfoDTO personalInfoDTO) {
        List<PersonalInfo> list = personalInfoRepository.findAll(PageRequest.of(0, 1)).getContent();
        PersonalInfo personalInfo = list.isEmpty() ? new PersonalInfo() : list.get(0);
        BeanUtils.copyProperties(personalInfoDTO, personalInfo);
        personalInfoRepository.save(personalInfo);
    }

    /**
     * 其他端获取个人信息
     * @return
     */
    @Cacheable(value = "personalInfo", key = "'vo'", unless = "#result == null")
    public PersonalInfoVO getPersonalInfo() {
        List<PersonalInfo> list = personalInfoRepository.findAll(PageRequest.of(0, 1)).getContent();
        if (list.isEmpty()) {
            return null;
        }
        PersonalInfo personalInfo = list.get(0);
        PersonalInfoVO personalInfoVO = PersonalInfoVO.builder()
                .id(personalInfo.getId())
                .nickname(personalInfo.getNickname())
                .tag(personalInfo.getTag())
                .description(personalInfo.getDescription())
                .avatar(personalInfo.getAvatar())
                .website(personalInfo.getWebsite())
                .email(personalInfo.getEmail())
                .github(personalInfo.getGithub())
                .location(personalInfo.getLocation())
                .build();
        return personalInfoVO;
    }
}
