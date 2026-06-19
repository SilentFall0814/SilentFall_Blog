package com.silentfall.blog.service;

import com.silentfall.blog.dto.VisitorRecordDTO;
import jakarta.servlet.http.HttpServletRequest;

/**
 * 访客指纹服务
 */
public interface FingerprintService {
    
    /**
     * 生成访客指纹
     * @param dto
     * @param request
     * @return
     */
    String generateVisitorFingerprint(VisitorRecordDTO dto, HttpServletRequest request);
}
