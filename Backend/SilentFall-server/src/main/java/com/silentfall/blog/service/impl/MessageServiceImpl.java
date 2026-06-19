package com.silentfall.blog.service.impl;

import com.silentfall.blog.constant.MessageConstant;
import com.silentfall.blog.constant.StatusConstant;
import com.silentfall.blog.dto.MessageDTO;
import com.silentfall.blog.dto.MessageEditDTO;
import com.silentfall.blog.dto.MessagePageQueryDTO;
import com.silentfall.blog.dto.MessageReplyDTO;
import com.silentfall.blog.entity.Messages;
import com.silentfall.blog.exception.ValidationException;
import com.silentfall.blog.repository.MessageRepository;
import com.silentfall.blog.properties.WebsiteProperties;
import com.silentfall.blog.result.PageResult;
import com.silentfall.blog.service.MessageService;
import com.silentfall.blog.service.UserAgentService;
import com.silentfall.blog.utils.IpUtil;
import com.silentfall.blog.utils.MarkdownUtil;
import com.silentfall.blog.vo.MessageVO;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * 留言服务实现
 */
@Slf4j
@Service
public class MessageServiceImpl implements MessageService {

    @Autowired
    private MessageRepository messageRepository;

    @Autowired
    private MongoTemplate mongoTemplate;

    @Autowired
    private UserAgentService userAgentService;

    @Autowired
    private WebsiteProperties websiteProperties;

    // 邮箱正则
    private static final Pattern EMAIL_PATTERN = Pattern.compile(
            "^[a-zA-Z0-9_+&*-]+(?:\\.[a-zA-Z0-9_+&*-]+)*@(?:[a-zA-Z0-9-]+\\.)+[a-zA-Z]{2,7}$"
    );

    // QQ号正则 (5-11位数字)
    private static final Pattern QQ_PATTERN = Pattern.compile("^[1-9][0-9]{4,10}$");

    /**
     * 访客提交留言
     * @param messageDTO
     * @param request
     */
    public void submitMessage(MessageDTO messageDTO, HttpServletRequest request) {
        // 1. 校验邮箱或QQ号（可选，填写时校验格式）
        validateEmailOrQq(messageDTO.getEmailOrQq());

        // 2. 创建留言实体
        Messages messages = new Messages();
        BeanUtils.copyProperties(messageDTO, messages);

        // 3. 处理Markdown内容
        if (messageDTO.getIsMarkdown() != null && messageDTO.getIsMarkdown() == 1) {
            // 如果是Markdown，转换为HTML（已包含XSS防护）
            String html = MarkdownUtil.toHtml(messageDTO.getContent());
            messages.setContentHtml(html);
        } else {
            // 非Markdown内容也需XSS清洗
            messages.setContentHtml(MarkdownUtil.sanitize(messageDTO.getContent()));
        }

        // 4. 设置访客ID（已由Controller层验证）
        String visitorId = messageDTO.getVisitorId();
        messages.setVisitorId(visitorId);

        // 5. 获取IP地址信息
        String clientIp = IpUtil.getClientIp(request);
        Map<String, String> geoInfo = IpUtil.getGeoInfo(clientIp);
        // 拼接地址: 省份-城市
        String province = geoInfo.getOrDefault("province", "");
        String city = geoInfo.getOrDefault("city", "");
        String location = province.isEmpty() && city.isEmpty() ? null
                : province.equals(city) ? province
                : String.format("%s-%s", province, city).replaceAll("^-|-$", "");
        if(location != null && !location.isEmpty()) {
            messages.setLocation(location);
        }

        // 6. 解析UserAgent
        String userAgent = request.getHeader("User-Agent");
        String osName = userAgentService.getOsName(userAgent);
        String browserName = userAgentService.getBrowserName(userAgent);
        messages.setUserAgentOs(osName);
        messages.setUserAgentBrowser(browserName);

        // 7. 设置默认值
        messages.setIsApproved(0); // 默认未审核
        messages.setIsEdited(0);   // 默认未编辑
        messages.setCreateTime(LocalDateTime.now());
        messages.setUpdateTime(LocalDateTime.now());

        // 8. 保存到数据库
        messageRepository.save(messages);

        log.info("访客提交留言成功: {}", messages);
    }

    /**
     * 校验邮箱或QQ号（可选，为空时跳过校验）
     * @param emailOrQq
     */
    private void validateEmailOrQq(String emailOrQq) {
        if (emailOrQq == null || emailOrQq.trim().isEmpty()) {
            return;
        }

        emailOrQq = emailOrQq.trim();

        // 先判断是否是QQ号
        if (QQ_PATTERN.matcher(emailOrQq).matches()) {
            return; // QQ号格式正确
        }

        // 再判断是否是邮箱
        if (EMAIL_PATTERN.matcher(emailOrQq).matches()) {
            return; // 邮箱格式正确
        }

        // 都不匹配，抛出异常
        // 判断更像QQ号还是邮箱
        if (emailOrQq.matches("^[0-9]+$")) {
            throw new ValidationException(MessageConstant.INVALID_QQ_FORMAT);
        } else {
            throw new ValidationException(MessageConstant.INVALID_EMAIL_FORMAT);
        }
    }

    /**
     * 分页查询留言
     * @param messagePageQueryDTO
     * @return
     */
    public PageResult pageQuery(MessagePageQueryDTO messagePageQueryDTO) {
        int page = messagePageQueryDTO.getPage();
        int pageSize = messagePageQueryDTO.getPageSize();
        Pageable pageable = PageRequest.of(page - 1, pageSize, Sort.by(Sort.Direction.DESC, "createTime"));

        // 构建查询条件
        Query query = new Query().with(pageable);
        Criteria criteria = new Criteria();

        if (messagePageQueryDTO.getIsApproved() != null) {
            criteria.and("isApproved").is(messagePageQueryDTO.getIsApproved());
        }
        if (messagePageQueryDTO.getBeginTime() != null) {
            criteria.and("createTime").gte(messagePageQueryDTO.getBeginTime());
        }
        if (messagePageQueryDTO.getEndTime() != null) {
            criteria.and("createTime").lte(messagePageQueryDTO.getEndTime());
        }

        if (criteria.getCriteriaObject().keySet().size() > 0) {
            query.addCriteria(criteria);
        }

        long total = mongoTemplate.count(query, Messages.class);
        List<Messages> records = mongoTemplate.find(query, Messages.class);
        return new PageResult(total, records);
    }

    /**
     * 批量审核留言
     * @param ids
     */
    public void batchApprove(List<String> ids) {
        Query query = new Query(Criteria.where("id").in(ids));
        Update update = new Update().set("isApproved", StatusConstant.ENABLE);
        mongoTemplate.updateMulti(query, update, Messages.class);
    }

    /**
     * 批量删除留言
     * @param ids
     */
    public void batchDelete(List<String> ids) {
        // 如果是根留言，级联删除所有子留言
        for (String id : ids) {
            Messages message = messageRepository.findById(id).orElse(null);
            if (message != null && (message.getRootId() == null || message.getRootId().isEmpty() || "0".equals(message.getRootId()))) {
                // 删除所有子留言
                mongoTemplate.remove(new Query(Criteria.where("rootId").is(id)), Messages.class);
            }
        }
        messageRepository.deleteAllById(ids);
    }

    /**
     * 管理员回复留言
     * @param messageReplyDTO
     */
    public void adminReply(MessageReplyDTO messageReplyDTO, HttpServletRequest request) {
        // 1. 创建留言实体
        Messages messages = new Messages();
        BeanUtils.copyProperties(messageReplyDTO, messages);

        // 2. 处理Markdown内容
        if (messageReplyDTO.getIsMarkdown() != null && messageReplyDTO.getIsMarkdown() == 1) {
            String html = MarkdownUtil.toHtml(messageReplyDTO.getContent());
            messages.setContentHtml(html);
        } else {
            messages.setContentHtml(MarkdownUtil.sanitize(messageReplyDTO.getContent()));
        }

        // 3. 设置管理员回复标识
        messages.setIsAdminReply(StatusConstant.ENABLE);
        messages.setIsApproved(StatusConstant.ENABLE); // 管理员回复自动审核通过
        messages.setIsEdited(StatusConstant.DISABLE);
        messages.setNickname(websiteProperties.getTitle());
        messages.setCreateTime(LocalDateTime.now());
        messages.setUpdateTime(LocalDateTime.now());

        // 4. 捕获 IP / 地理位置 / UserAgent
        if (request != null) {
            String clientIp = IpUtil.getClientIp(request);
            Map<String, String> geoInfo = IpUtil.getGeoInfo(clientIp);
            String province = geoInfo.getOrDefault("province", "");
            String city = geoInfo.getOrDefault("city", "");
            String location = province.isEmpty() && city.isEmpty() ? null
                    : province.equals(city) ? province
                    : String.format("%s-%s", province, city).replaceAll("^-|-$", "");
            if(location != null && !location.isEmpty()) {
                messages.setLocation(location);
            }
            String userAgent = request.getHeader("User-Agent");
            messages.setUserAgentOs(userAgentService.getOsName(userAgent));
            messages.setUserAgentBrowser(userAgentService.getBrowserName(userAgent));
        }

        // 5. 保存到数据库
        messageRepository.save(messages);

        log.info("管理员回复留言成功: parentId={}, content={}", messageReplyDTO.getParentId(), messageReplyDTO.getContent());
    }

    // ===== 博客端方法 =====

    public List<MessageVO> getMessageTree(String visitorId) {
        // 查询已审核的留言 + 当前访客的未审核留言
        Criteria criteria = new Criteria();
        Criteria approvedCriteria = Criteria.where("isApproved").is(1);
        if (visitorId != null && !visitorId.isEmpty()) {
            criteria.orOperator(approvedCriteria, Criteria.where("visitorId").is(visitorId));
        } else {
            criteria.andOperator(approvedCriteria);
        }

        Query query = new Query(criteria).with(Sort.by(Sort.Direction.DESC, "createTime"));
        List<Messages> allMessages = mongoTemplate.find(query, Messages.class);

        // 转换为VO
        List<MessageVO> allMessageVOs = allMessages.stream()
                .map(this::convertToMessageVO)
                .collect(Collectors.toList());

        // 构建树形结构：根留言（rootId为null或空或"0"）作为一级，其余挂到根留言下
        List<MessageVO> rootMessages = new ArrayList<>();
        Map<String, MessageVO> messageMap = allMessageVOs.stream()
                .collect(Collectors.toMap(MessageVO::getId, m -> m));

        for (MessageVO msg : allMessageVOs) {
            if (msg.getRootId() == null || msg.getRootId().isEmpty() || "0".equals(msg.getRootId())) {
                msg.setChildren(new ArrayList<>());
                rootMessages.add(msg);
            } else {
                MessageVO rootMsg = messageMap.get(msg.getRootId());
                if (rootMsg != null) {
                    if (rootMsg.getChildren() == null) {
                        rootMsg.setChildren(new ArrayList<>());
                    }
                    rootMsg.getChildren().add(msg);
                }
            }
        }
        return rootMessages;
    }

    /**
     * 访客编辑留言
     */
    public void editMessage(MessageEditDTO editDTO) {
        Messages message = messageRepository.findById(editDTO.getId())
                .orElseThrow(() -> new ValidationException("留言不存在"));
        if (!message.getVisitorId().equals(editDTO.getVisitorId())) {
            throw new ValidationException("无权编辑此留言");
        }

        Query query = new Query(Criteria.where("id").is(editDTO.getId()));
        Update update = new Update().set("content", editDTO.getContent());

        if (editDTO.getIsMarkdown() != null && editDTO.getIsMarkdown() == 1) {
            update.set("contentHtml", MarkdownUtil.toHtml(editDTO.getContent()));
        } else {
            update.set("contentHtml", MarkdownUtil.sanitize(editDTO.getContent()));
        }

        mongoTemplate.updateFirst(query, update, Messages.class);
        log.info("访客编辑留言成功: id={}, visitorId={}", editDTO.getId(), editDTO.getVisitorId());
    }

    /**
     * 访客删除留言
     */
    public void visitorDeleteMessage(String id, String visitorId) {
        Messages message = messageRepository.findById(id)
                .orElseThrow(() -> new ValidationException("留言不存在"));
        if (!message.getVisitorId().equals(visitorId)) {
            throw new ValidationException("无权删除此留言");
        }

        // 如果是根留言，级联删除所有子留言
        if (message.getRootId() == null || message.getRootId().isEmpty() || "0".equals(message.getRootId())) {
            mongoTemplate.remove(new Query(Criteria.where("rootId").is(id)), Messages.class);
        }

        messageRepository.deleteById(id);
        log.info("访客删除留言成功: id={}, visitorId={}", id, visitorId);
    }

    /**
     * 转换为MessageVO
     */
    private MessageVO convertToMessageVO(Messages message) {
        return MessageVO.builder()
                .id(message.getId())
                .rootId(message.getRootId())
                .parentId(message.getParentId())
                .parentNickname(message.getParentNickname())
                .content(message.getContent())
                .contentHtml(message.getContentHtml())
                .isMarkdown(message.getIsMarkdown())
                .visitorId(message.getVisitorId())
                .nickname(message.getNickname())
                .emailOrQq(message.getEmailOrQq())
                .location(message.getLocation())
                .userAgentOs(message.getUserAgentOs())
                .userAgentBrowser(message.getUserAgentBrowser())
                .isApproved(message.getIsApproved())
                .isSecret(message.getIsSecret())
                .isAdminReply(message.getIsAdminReply())
                .createTime(message.getCreateTime())
                .build();
    }
}
