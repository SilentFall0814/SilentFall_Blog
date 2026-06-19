package com.silentfall.blog.service.impl;

import com.silentfall.blog.entity.Views;
import com.silentfall.blog.entity.Visitors;
import com.silentfall.blog.repository.ViewRepository;
import com.silentfall.blog.repository.VisitorRepository;
import com.silentfall.blog.service.AsyncVisitorService;
import com.silentfall.blog.utils.IpUtil;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * 异步访客服务实现（地理位置查询和浏览记录写入异步化）
 */
@Service
@Slf4j
public class AsyncVisitorServiceImpl implements AsyncVisitorService {

    @Autowired
    private VisitorRepository visitorRepository;

    @Autowired
    private ViewRepository viewRepository;

    @Autowired
    private MongoTemplate mongoTemplate;

    /**
     * 异步处理：IP地理位置查询 + 访客地理信息更新 + 浏览记录写入
     * 接收 visitorId 而非 Visitors 对象引用，避免主线程与异步线程共享可变对象导致竞态条件
     */
    @Async("taskExecutor")
    public void processGeoAndRecordViewAsync(String visitorId, String ip, String userAgent,
                                              String pagePath, String referer, String pageTitle) {
        try {
            // 耗时操作：IP地理位置查询
            Map<String, String> geoInfo = IpUtil.getGeoInfo(ip);

            String country = geoInfo.get("country");
            String province = geoInfo.get("province");
            String city = geoInfo.get("city");

            // 只要任意一个地理位置字段有效就更新（避免 country 为空但 province/city 有值时不更新）
            boolean hasAnyGeo = (country != null && !country.isEmpty())
                    || (province != null && !province.isEmpty())
                    || (city != null && !city.isEmpty());

            if (hasAnyGeo) {
                // 从数据库重新读取访客记录，确保拿到最新数据
                Visitors current = visitorRepository.findById(visitorId).orElse(null);
                if (current != null) {
                    boolean geoChanged = !equalsNullSafe(current.getCountry(), country)
                            || !equalsNullSafe(current.getProvince(), province)
                            || !equalsNullSafe(current.getCity(), city);

                    if (geoChanged) {
                        // 仅更新地理位置字段，避免与主线程的访问计数产生竞态
                        Query query = new Query(Criteria.where("id").is(visitorId));
                        Update update = new Update()
                                .set("country", country != null ? country : "")
                                .set("province", province != null ? province : "")
                                .set("city", city != null ? city : "")
                                .set("longitude", geoInfo.get("longitude"))
                                .set("latitude", geoInfo.get("latitude"));
                        mongoTemplate.updateFirst(query, update, Visitors.class);
                    }
                }
            }

            // 写入浏览记录
            Views view = Views.builder()
                    .visitorId(visitorId)
                    .pagePath(pagePath)
                    .referer(referer)
                    .pageTitle(pageTitle)
                    .ipAddress(ip)
                    .userAgent(userAgent)
                    .viewTime(LocalDateTime.now())
                    .build();
            viewRepository.save(view);

            log.debug("异步处理访客记录完成: visitorId={}, ip={}", visitorId, ip);
        } catch (Exception e) {
            log.error("异步处理访客记录失败: visitorId={}, ip={}, ex={}", visitorId, ip, e.getMessage());
        }
    }

    private boolean equalsNullSafe(String a, String b) {
        if (a == null && b == null) return true;
        if (a == null || b == null) return false;
        return a.equals(b);
    }
}
