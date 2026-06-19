package com.silentfall.blog.entity;

import com.fasterxml.jackson.annotation.JsonFormat;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.io.Serializable;
import java.time.LocalDateTime;

/**
 * 管理员
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "admin")
public class Admin implements Serializable {

    private static final long serialVersionUID = 1L;

    @Id
    private String id;

    // 用户名
    private String username;

    // 加密后的密码
    private String password;

    // 盐值
    private String salt;

    // 昵称
    private String nickname;

    // 角色 1-管理员 0-游客
    private Integer role;

    // 创建时间
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime createTime;

    // 更新时间
    @JsonFormat(pattern = "yyyy-MM-dd HH:mm:ss")
    private LocalDateTime updateTime;
}
