package com.silentfall.blog.vo;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

@Data
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class SkillVO implements Serializable {

    private String id;

    // 技能名称
    private String name;

    // 技能描述
    private String description;

    // 图标url
    private String icon;

    // 排序，越小越靠前
    private Integer sort;

}
