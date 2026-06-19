package com.silentfall.blog.utils;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

/**
 * IP地址工具类
 */
@Slf4j
public class IpUtil {
    // IP地址查询接口（太平洋网络 IP 查询，返回中文地理位置数据）
    public static final String IP_API = "https://whois.pconline.com.cn/ipJson.jsp";

    // 获取真实IP地址（兼容CDN/反向代理）
    public static String getClientIp(HttpServletRequest request) {
        // CDN专用头（优先级最高）
        String ip = request.getHeader("CF-Connecting-IP");      // Cloudflare
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("True-Client-IP");            // Cloudflare Enterprise / Akamai
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("Ali-CDN-Real-IP");           // 阿里云CDN
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP");                 // Nginx / 通用CDN
        }
        // 标准代理头
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Forwarded-For");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("WL-Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }

        // 多级代理时，取第一个IP（即真实客户端IP）
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }

        return ip;
    }

    // 获取IP地址信息
    public static Map<String, String> getGeoInfo(String ip){
        // 对 localhost / 内网 IP 直接返回空 Map，避免调用外部 API 失败导致业务异常
        if (ip == null || ip.isEmpty() || isLocalOrPrivateIp(ip)) {
            log.info("本地或内网IP，跳过地理位置查询：{}", ip);
            return new HashMap<>();
        }

        // 太平洋网络 IP 查询接口参数：ip=目标IP&json=true 返回 JSON 格式数据
        Map<String,String> params = new HashMap<>();
        params.put("ip", ip);
        params.put("json", "true");
        String doneGet = HttpClientUtil.doGet(IP_API, params);
        log.info("IP地址信息查询结果：{}", doneGet);
        // 封装返回结果
        Map<String, String> geoInfo = new HashMap<>();

        try {
            // 使用Jackson ObjectMapper解析JSON
            ObjectMapper mapper = new ObjectMapper();
            Map<String, Object> jsonMap = mapper.readValue(doneGet, Map.class);

            // 提取需要的信息（null 值统一转为空字符串，避免序列化/前端展示出现 "null"）
            // pconline 返回字段：addr（含国家，可能带前导空格）、pro（省）、city（市）
            String addr = nullToEmpty((String) jsonMap.get("addr")).trim();
            String pro = nullToEmpty((String) jsonMap.get("pro"));
            String city = nullToEmpty((String) jsonMap.get("city"));

            geoInfo.put("country", addr);
            geoInfo.put("province", stripAdminSuffix(pro));
            geoInfo.put("city", stripAdminSuffix(city));
            // pconline 不提供经纬度，保留空字符串以兼容下游字段
            geoInfo.put("latitude", "");
            geoInfo.put("longitude", "");

        } catch (Exception e) {
            log.error("解析IP地址信息失败", e);
        }
        return geoInfo;
    }

    /** 将 null 转为空字符串，避免 Map 中存在 null 值导致下游展示 "null" */
    private static String nullToEmpty(String s) {
        return s == null ? "" : s;
    }

    /**
     * 判断是否为本地或内网IP
     * 包括：127.x.x.x、0:0:0:0:0:0:0:1、::1、10.x.x.x、172.16-31.x.x、192.168.x.x
     */
    private static boolean isLocalOrPrivateIp(String ip) {
        // 去除 IPv6 方括号
        if (ip.startsWith("[") && ip.endsWith("]")) {
            ip = ip.substring(1, ip.length() - 1);
        }
        // IPv6 localhost
        if ("0:0:0:0:0:0:0:1".equals(ip) || "::1".equals(ip)) {
            return true;
        }
        // IPv4 解析
        if (ip.contains(".")) {
            String[] parts = ip.split("\\.");
            if (parts.length != 4) {
                return false;
            }
            try {
                int first = Integer.parseInt(parts[0]);
                int second = Integer.parseInt(parts[1]);
                // 127.x.x.x / 10.x.x.x / 192.168.x.x
                if (first == 127 || first == 10 || (first == 192 && second == 168)) {
                    return true;
                }
                // 172.16-31.x.x
                if (first == 172 && second >= 16 && second <= 31) {
                    return true;
                }
            } catch (NumberFormatException e) {
                return false;
            }
        }
        return false;
    }

    /**
     * 去掉行政区划后缀（省、市、自治区、特别行政区）
     * 每个字段都独立校验"省"和"市"后缀
     */
    private static String stripAdminSuffix(String name) {
        if (name == null || name.isEmpty()) return name;
        // 先去除复杂的行政区划后缀
        name = name.replaceAll("壮族自治区|维吾尔自治区|回族自治区|自治区|特别行政区", "");
        // 再去除末尾的"省"或"市"（保证去除后至少保留 1 个字符）
        if (name.length() > 1 && (name.endsWith("省") || name.endsWith("市"))) {
            name = name.substring(0, name.length() - 1);
        }
        return name;
    }
}
