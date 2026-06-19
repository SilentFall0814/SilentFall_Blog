package com.silentfall.blog.service.impl;

import com.silentfall.blog.constant.StatusConstant;
import com.silentfall.blog.dto.VisitorPageQueryDTO;
import com.silentfall.blog.dto.VisitorRecordDTO;
import com.silentfall.blog.entity.Visitors;
import com.silentfall.blog.repository.VisitorRepository;
import com.silentfall.blog.result.PageResult;
import com.silentfall.blog.service.AsyncVisitorService;
import com.silentfall.blog.service.BlockService;
import com.silentfall.blog.service.FingerprintService;
import com.silentfall.blog.service.VisitorService;
import com.silentfall.blog.service.VisitorTokenService;
import com.silentfall.blog.utils.IpUtil;
import com.silentfall.blog.vo.VisitorRecordVO;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Service
@Slf4j
public class VisitorServiceImpl implements VisitorService {

    @Autowired
    private VisitorRepository visitorRepository;
    @Autowired
    private MongoTemplate mongoTemplate;
    @Autowired
    private AsyncVisitorService asyncVisitorService;
    @Autowired
    private RedisTemplate redisTemplate;
    @Autowired
    private FingerprintService fingerprintService;
    @Autowired
    private BlockService blockService;
    @Autowired
    private VisitorTokenService visitorTokenService;

    // Redis键前缀
    public static final String VISITOR_KEY = "visitor:fingerprint:";

    /**
     * 记录访客访问信息
     * @param visitorRecordDTO
     * @param request
     * @return
     */
    public VisitorRecordVO recordVisitorViewInfo(VisitorRecordDTO visitorRecordDTO, HttpServletRequest request) {

        // 生成/获取会话Id
        String sessionId = getOrCreateSessionId(request);

        // 生成设备指纹
        String fingerprint = fingerprintService.generateVisitorFingerprint(visitorRecordDTO,request);

        // 获取IP
        String ip = IpUtil.getClientIp(request);
        String userAgent = request.getHeader("User-Agent");

        // 检查访客是否在缓存中有封禁记录
        blockService.checkIfBlocked(fingerprint);

        // 检查请求频率
        blockService.checkRateLimit(fingerprint,ip);

        // 查找或创建访客记录
        Visitors visitor = findOrCreateVisitor(fingerprint, sessionId, userAgent, ip);

        // 异步处理：IP地理位置查询 + 访客地理信息更新 + 浏览记录写入
        // 传递 visitorId 而非对象引用，避免主线程与异步线程共享可变对象导致竞态条件
        asyncVisitorService.processGeoAndRecordViewAsync(
                visitor.getId(), ip, userAgent,
                visitorRecordDTO.getPagePath(),
                visitorRecordDTO.getReferer(),
                visitorRecordDTO.getPageTitle()
        );

        // 封装VO（立即返回，不等待异步操作完成）
        VisitorRecordVO visitorRecordVO = VisitorRecordVO.builder()
                .visitorFingerprint(fingerprint)
                .sessionId(sessionId)
                .visitorId(visitor.getId())
            .visitorToken(visitorTokenService.generateToken(visitor.getId(), fingerprint))
                .isNewVisitor(visitor.getTotalViews() <= 1)
                .build();
        return visitorRecordVO;
    }

    /**
     * 获取或创建会话ID
     * @param request
     * @return
     */
    private String getOrCreateSessionId(HttpServletRequest request) {
        HttpSession session = request.getSession(false);
        if(session==null){
            session = request.getSession(true);
            // 设置会话属性创建时间
            session.setAttribute("visitTime", LocalDateTime.now());
        }
        return session.getId();
    }


    /**
     * 查找或创建访客记录（不含地理位置，地理位置由异步服务填充）
     * @param fingerprint
     * @param sessionId
     * @param userAgent
     * @param ip
     * @return
     */
    private Visitors findOrCreateVisitor(String fingerprint, String sessionId,
                                         String userAgent, String ip){
        // 尝试从Redis中获取访客信息
        String cacheKey = VISITOR_KEY + fingerprint;
        Visitors visitor = (Visitors) redisTemplate.opsForValue().get(cacheKey);

        if(visitor!=null){
            // 缓存命中,更新基本信息
            log.info("【访客追踪】缓存命中: id={}, fingerprint={}, ip={}, cachedViews={}",
                    visitor.getId(), fingerprint, ip, visitor.getTotalViews());
            visitor.setSessionId(sessionId);
            visitor.setIp(ip);
            visitor.setLastVisitTime(LocalDateTime.now());
            visitor.setTotalViews(visitor.getTotalViews() + 1);
            visitorRepository.save(visitor);
            // 回写Redis缓存，保持缓存数据与数据库同步
            redisTemplate.opsForValue().set(cacheKey, visitor, 1, TimeUnit.HOURS);
            return visitor;
        }

        // 缓存未命中，通过指纹查找访客
        Query fpQuery = new Query(Criteria.where("fingerprint").is(fingerprint));
        visitor = mongoTemplate.findOne(fpQuery, Visitors.class);

        if(visitor==null){
            // 新访客：创建记录（地理位置字段由异步任务填充）
            log.info("【访客追踪】新访客创建: fingerprint={}, ip={}", fingerprint, ip);
            visitor = Visitors.builder()
                    .fingerprint(fingerprint)
                    .sessionId(sessionId)
                    .ip(ip)
                    .userAgent(userAgent)
                    .firstVisitTime(LocalDateTime.now())
                    .lastVisitTime(LocalDateTime.now())
                    .totalViews(1L)
                    .isBlocked(StatusConstant.DISABLE)
                    .build();
            try {
                visitorRepository.save(visitor);
                log.info("【访客追踪】新访客插入成功: id={}, fingerprint={}", visitor.getId(), fingerprint);
            } catch (DuplicateKeyException e) {
                // 并发场景：另一个请求已经插入了相同指纹的访客，回退到数据库查询
                log.warn("【访客追踪】并发创建，回退查询: fingerprint={}", fingerprint);
                visitor = mongoTemplate.findOne(fpQuery, Visitors.class);
                if (visitor != null) {
                    visitor.setLastVisitTime(LocalDateTime.now());
                    visitor.setTotalViews(visitor.getTotalViews() + 1);
                    visitor.setSessionId(sessionId);
                    visitor.setIp(ip);
                    visitorRepository.save(visitor);
                }
            }
        }else{
            // 老访客：更新基本信息
            log.info("【访客追踪】老访客更新: id={}, fingerprint={}, ip={}, dbViews={}",
                    visitor.getId(), fingerprint, ip, visitor.getTotalViews());
            visitor.setLastVisitTime(LocalDateTime.now());
            visitor.setTotalViews(visitor.getTotalViews() + 1);

            // 如果session已过期或不同，则视为新的浏览器会话
            boolean sessionExpired = !sessionId.equals(visitor.getSessionId());
            if(sessionExpired){
                visitor.setSessionId(sessionId);
            }

            visitor.setIp(ip);
            visitorRepository.save(visitor);
        }

        // 统一写入/更新Redis缓存
        if (visitor != null) {
            redisTemplate.opsForValue().set(cacheKey, visitor, 1, TimeUnit.HOURS);
        }
        return visitor;
    }

    /**
     * 分页查询访客列表
     * @param visitorPageQueryDTO
     * @return
     */
    public PageResult pageQuery(VisitorPageQueryDTO visitorPageQueryDTO) {
        Pageable pageable = PageRequest.of(visitorPageQueryDTO.getPage() - 1,
                visitorPageQueryDTO.getPageSize(), Sort.by(Sort.Direction.DESC, "lastVisitTime"));
        Page<Visitors> page = visitorRepository.findAllByOrderByLastVisitTimeDesc(pageable);
        return new PageResult(page.getTotalElements(), page.getContent());
    }

    /**
     * 批量封禁访客
     * @param ids
     */
    public void batchBlock(List<String> ids) {
        Query query = new Query(Criteria.where("id").in(ids));
        Update update = new Update().set("isBlocked", StatusConstant.ENABLE);
        mongoTemplate.updateMulti(query, update, Visitors.class);
    }

    /**
     * 批量解封访客（同时清除 Redis 封禁缓存）
     * @param ids
     */
    public void batchUnblock(List<String> ids) {
        // 批量查询访客的 fingerprint，用于清除 Redis 封禁缓存（避免 N+1）
        List<Visitors> visitors = visitorRepository.findAllById(ids);
        for (Visitors visitor : visitors) {
            if (visitor.getFingerprint() != null) {
                String blockedKey = "visitor:blocked:" + visitor.getFingerprint();
                redisTemplate.delete(blockedKey);
                // 同时清除访客信息缓存，避免旧的 isBlocked=1 状态残留
                String visitorKey = VISITOR_KEY + visitor.getFingerprint();
                redisTemplate.delete(visitorKey);
            }
        }
        Query query = new Query(Criteria.where("id").in(ids));
        Update update = new Update().set("isBlocked", StatusConstant.DISABLE);
        mongoTemplate.updateMulti(query, update, Visitors.class);
    }
}
