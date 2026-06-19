package com.silentfall.blog.controller.home;

import com.silentfall.blog.result.Result;
import com.silentfall.blog.service.PersonalInfoService;
import com.silentfall.blog.vo.PersonalInfoVO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 *  首页端个人信息接口
 */
@RestController("homePersonalInfoController")
@RequestMapping("/home/personalInfo")
public class PersonalInfoController {

    @Autowired
    private PersonalInfoService personalInfoService;

    /**
     * 获取个人信息
     */
    @GetMapping
    public Result<PersonalInfoVO> getPersonalInfo() {
        PersonalInfoVO personalInfoVO = personalInfoService.getPersonalInfo();
        return Result.success(personalInfoVO);
    }
}
