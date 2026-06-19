package com.silentfall.blog.controller.admin;

import com.silentfall.blog.annotation.OperationLog;
import com.silentfall.blog.dto.PersonalInfoDTO;
import com.silentfall.blog.entity.PersonalInfo;
import com.silentfall.blog.enumeration.OperationType;
import com.silentfall.blog.result.Result;
import com.silentfall.blog.service.PersonalInfoService;
import com.silentfall.blog.vo.PersonalInfoVO;
import jakarta.validation.Valid;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

/**
 * 管理端个人信息接口
 */
@RestController("adminPersonalInfoController")
@RequestMapping("/admin/personalInfo")
@Slf4j
public class PersonalInfoController {

    @Autowired
    private PersonalInfoService personalInfoService;

    /**
     * 获取个人信息
     */
    @GetMapping
    public Result<PersonalInfo> getPersonalInfo() {
        PersonalInfo personalInfo = personalInfoService.getAllPersonalInfo();
        return Result.success(personalInfo);
    }

    /**
     * 更新个人信息
     */
    @PutMapping
    @OperationLog(value = OperationType.UPDATE, target = "personalInfo", targetId = "#personalInfoDTO.id")
    public Result updatePersonalInfo(@Valid @RequestBody PersonalInfoDTO personalInfoDTO) {
        log.info("更新个人信息: {}", personalInfoDTO);
        personalInfoService.updatePersonalInfo(personalInfoDTO);
        return Result.success();
    }
}
