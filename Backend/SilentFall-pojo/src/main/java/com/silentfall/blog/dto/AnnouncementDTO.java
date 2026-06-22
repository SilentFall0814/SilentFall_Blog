package com.silentfall.blog.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.io.Serializable;

/**
 * 公告DTO
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AnnouncementDTO implements Serializable {

    // 公告内容
    @NotBlank(message = "公告内容不能为空")
    @Size(max = 500, message = "公告内容不能超过500字")
    private String content;
}
