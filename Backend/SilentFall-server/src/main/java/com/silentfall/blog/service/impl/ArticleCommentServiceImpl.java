package com.silentfall.blog.service.impl;

import com.silentfall.blog.constant.StatusConstant;
import com.silentfall.blog.dto.ArticleCommentDTO;
import com.silentfall.blog.dto.ArticleCommentEditDTO;
import com.silentfall.blog.dto.ArticleCommentPageQueryDTO;
import com.silentfall.blog.dto.ArticleCommentReplyDTO;
import com.silentfall.blog.entity.ArticleComments;
import com.silentfall.blog.exception.ValidationException;
import com.silentfall.blog.repository.ArticleCommentRepository;
import com.silentfall.blog.repository.ArticleRepository;
import com.silentfall.blog.properties.WebsiteProperties;
import com.silentfall.blog.result.PageResult;
import com.silentfall.blog.service.ArticleCommentService;
import com.silentfall.blog.service.UserAgentService;
import com.silentfall.blog.utils.IpUtil;
import com.silentfall.blog.utils.MarkdownUtil;
import com.silentfall.blog.vo.ArticleCommentVO;
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

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * 文章评论服务实现
 */
@Slf4j
@Service
public class ArticleCommentServiceImpl implements ArticleCommentService {

    @Autowired
    private ArticleCommentRepository articleCommentRepository;

    @Autowired
    private ArticleRepository articleRepository;

    @Autowired
    private MongoTemplate mongoTemplate;

    @Autowired
    private UserAgentService userAgentService;

    @Autowired
    private WebsiteProperties websiteProperties;

    /**
     * 分页条件查询评论（时间、是否审核）
     * @param articleCommentPageQueryDTO
     * @return
     */
    public PageResult pageQuery(ArticleCommentPageQueryDTO articleCommentPageQueryDTO) {
        int page = articleCommentPageQueryDTO.getPage();
        int pageSize = articleCommentPageQueryDTO.getPageSize();
        Pageable pageable = PageRequest.of(page - 1, pageSize, Sort.by(Sort.Direction.DESC, "createTime"));

        // 构建查询条件
        Query query = new Query().with(pageable);
        Criteria criteria = new Criteria();

        if (articleCommentPageQueryDTO.getArticleId() != null && !articleCommentPageQueryDTO.getArticleId().isEmpty()) {
            criteria.and("articleId").is(articleCommentPageQueryDTO.getArticleId());
        }
        if (articleCommentPageQueryDTO.getIsApproved() != null) {
            criteria.and("isApproved").is(articleCommentPageQueryDTO.getIsApproved());
        }
        if (articleCommentPageQueryDTO.getBeginTime() != null) {
            criteria.and("createTime").gte(articleCommentPageQueryDTO.getBeginTime());
        }
        if (articleCommentPageQueryDTO.getEndTime() != null) {
            criteria.and("createTime").lte(articleCommentPageQueryDTO.getEndTime());
        }

        if (criteria.getCriteriaObject().keySet().size() > 0) {
            query.addCriteria(criteria);
        }

        long total = mongoTemplate.count(query, ArticleComments.class);
        List<ArticleComments> records = mongoTemplate.find(query, ArticleComments.class);
        return new PageResult(total, records);
    }

    /**
     * 根据文章ID查询评论
     * @param articleId
     * @return
     */
    public List<ArticleComments> getByArticleId(String articleId) {
        Query query = new Query(Criteria.where("articleId").is(articleId))
                .with(Sort.by(Sort.Direction.DESC, "createTime"));
        return mongoTemplate.find(query, ArticleComments.class);
    }

    /**
     * 批量审核通过评论
     * @param ids
     */
    public void batchApprove(List<String> ids) {
        // 批量查询评论，只对"当前未审核"的评论增加文章评论数（避免 N+1）
        List<ArticleComments> comments = articleCommentRepository.findAllById(ids);
        for (ArticleComments comment : comments) {
            if (comment.getArticleId() != null
                    && (comment.getIsApproved() == null || comment.getIsApproved() == 0)) {
                incrementCommentCount(comment.getArticleId());
            }
        }
        // 批量更新审核状态
        Query query = new Query(Criteria.where("id").in(ids));
        Update update = new Update().set("isApproved", StatusConstant.ENABLE);
        mongoTemplate.updateMulti(query, update, ArticleComments.class);
    }

    /**
     * 批量删除评论
     * @param ids
     */
    public void batchDelete(List<String> ids) {
        // 批量查询所有评论，避免 N+1
        List<ArticleComments> comments = articleCommentRepository.findAllById(ids);
        for (ArticleComments comment : comments) {
            if (comment.getArticleId() == null) {
                continue;
            }
            // 如果是根评论，级联删除所有子评论
            if (comment.getRootId() == null || comment.getRootId().isEmpty() || "0".equals(comment.getRootId())) {
                // 只对已审核的子评论减少评论数
                long approvedChildCount = countApprovedByRootId(comment.getId());
                if (approvedChildCount > 0) {
                    for (int i = 0; i < approvedChildCount; i++) {
                        decrementCommentCount(comment.getArticleId());
                    }
                }
                // 删除所有子评论
                mongoTemplate.remove(new Query(Criteria.where("rootId").is(comment.getId())), ArticleComments.class);
            }
            // 只有已审核的评论才减少文章评论数
            if (comment.getIsApproved() != null && comment.getIsApproved() == 1) {
                decrementCommentCount(comment.getArticleId());
            }
        }
        articleCommentRepository.deleteAllById(ids);
    }

    /**
     * 管理员回复评论
     * @param articleCommentReplyDTO
     */
    public void adminReply(ArticleCommentReplyDTO articleCommentReplyDTO, HttpServletRequest request) {
        ArticleComments articleComments = new ArticleComments();
        BeanUtils.copyProperties(articleCommentReplyDTO, articleComments);

        // 处理Markdown内容
        if (articleCommentReplyDTO.getIsMarkdown() != null && articleCommentReplyDTO.getIsMarkdown() == 1) {
            String html = MarkdownUtil.toHtml(articleCommentReplyDTO.getContent());
            articleComments.setContentHtml(html);
        } else {
            articleComments.setContentHtml(MarkdownUtil.sanitize(articleCommentReplyDTO.getContent()));
        }

        // 设置管理员回复标识
        articleComments.setIsAdminReply(StatusConstant.ENABLE);
        articleComments.setIsApproved(StatusConstant.ENABLE);
        articleComments.setIsEdited(StatusConstant.DISABLE);
        articleComments.setNickname(websiteProperties.getTitle());

        // 捕获 IP / 地理位置 / UserAgent
        if (request != null) {
            String clientIp = IpUtil.getClientIp(request);
            Map<String, String> geoInfo = IpUtil.getGeoInfo(clientIp);
            String province = geoInfo.getOrDefault("province", "");
            String city = geoInfo.getOrDefault("city", "");
            String location = province.isEmpty() && city.isEmpty() ? null
                    : province.equals(city) ? province
                    : String.format("%s-%s", province, city).replaceAll("^-|-$", "");
            if(location != null && !location.isEmpty()) {
                articleComments.setLocation(location);
            }
            String userAgent = request.getHeader("User-Agent");
            articleComments.setUserAgentOs(userAgentService.getOsName(userAgent));
            articleComments.setUserAgentBrowser(userAgentService.getBrowserName(userAgent));
        }

        articleCommentRepository.save(articleComments);

        // 管理员回复自动通过审核，文章评论数+1
        if (articleCommentReplyDTO.getArticleId() != null) {
            incrementCommentCount(articleCommentReplyDTO.getArticleId());
        }
    }

    // ===== 博客端方法 =====

    /**
     * 根据文章ID获取评论列表（树形结构）
     * @param articleId
     * @return
     */
    public List<ArticleCommentVO> getCommentTree(String articleId, String visitorId) {
        // 查询已审核的评论 + 当前访客的未审核评论
        Criteria criteria = new Criteria().and("articleId").is(articleId);
        Criteria approvedCriteria = Criteria.where("isApproved").is(1);
        if (visitorId != null && !visitorId.isEmpty()) {
            // 已审核 或 当前访客的未审核评论
            criteria.orOperator(approvedCriteria, Criteria.where("visitorId").is(visitorId));
        } else {
            criteria.andOperator(approvedCriteria);
        }

        Query query = new Query(criteria).with(Sort.by(Sort.Direction.ASC, "createTime"));
        List<ArticleComments> allComments = mongoTemplate.find(query, ArticleComments.class);

        // 转换为VO
        List<ArticleCommentVO> allCommentVOs = allComments.stream()
                .map(this::convertToCommentVO)
                .collect(Collectors.toList());

        // 构建树形结构：根评论（rootId为null或空或"0"）作为一级，其余挂到根评论下
        List<ArticleCommentVO> rootComments = new ArrayList<>();
        Map<String, ArticleCommentVO> commentMap = allCommentVOs.stream()
                .collect(Collectors.toMap(ArticleCommentVO::getId, c -> c));

        for (ArticleCommentVO comment : allCommentVOs) {
            if (comment.getRootId() == null || comment.getRootId().isEmpty() || "0".equals(comment.getRootId())) {
                // 根评论
                comment.setChildren(new ArrayList<>());
                rootComments.add(comment);
            } else {
                // 子评论，挂到根评论下
                ArticleCommentVO rootComment = commentMap.get(comment.getRootId());
                if (rootComment != null) {
                    if (rootComment.getChildren() == null) {
                        rootComment.setChildren(new ArrayList<>());
                    }
                    rootComment.getChildren().add(comment);
                }
            }
        }
        return rootComments;
    }

    /**
     * 提交评论（添加评论/回复评论）
     * @param articleCommentDTO
     */
    public void submitComment(ArticleCommentDTO articleCommentDTO, HttpServletRequest request) {
        // 1. 校验邮箱或QQ号（可选，填写时校验格式）
        validateEmailOrQq(articleCommentDTO.getEmailOrQq());

        // 2. 创建评论实体
        ArticleComments articleComments = new ArticleComments();
        BeanUtils.copyProperties(articleCommentDTO, articleComments);

        // 3. 处理Markdown内容
        if (articleCommentDTO.getIsMarkdown() != null && articleCommentDTO.getIsMarkdown() == 1) {
            String html = MarkdownUtil.toHtml(articleCommentDTO.getContent());
            articleComments.setContentHtml(html);
        } else {
            articleComments.setContentHtml(MarkdownUtil.sanitize(articleCommentDTO.getContent()));
        }

        // 4. 设置访客ID
        String visitorId = articleCommentDTO.getVisitorId();
        articleComments.setVisitorId(visitorId);

        // 5. 获取IP地址信息
        String clientIp = IpUtil.getClientIp(request);
        Map<String, String> geoInfo = IpUtil.getGeoInfo(clientIp);
        String province = geoInfo.getOrDefault("province", "");
        String city = geoInfo.getOrDefault("city", "");
        String location = province.isEmpty() && city.isEmpty() ? null
                : province.equals(city) ? province
                : String.format("%s-%s", province, city).replaceAll("^-|-$", "");
        if(location != null && !location.isEmpty()) {
            articleComments.setLocation(location);
        }

        // 6. 解析UserAgent
        String userAgent = request.getHeader("User-Agent");
        String osName = userAgentService.getOsName(userAgent);
        String browserName = userAgentService.getBrowserName(userAgent);
        articleComments.setUserAgentOs(osName);
        articleComments.setUserAgentBrowser(browserName);

        // 7. 设置默认值
        articleComments.setIsApproved(0);
        articleComments.setIsEdited(0);
        articleComments.setIsAdminReply(0);

        // 8. 保存到数据库
        articleCommentRepository.save(articleComments);

        // 9. 评论数不在提交时+1，改为审核通过时+1（见 batchApprove）

        log.info("访客提交文章评论成功: {}", articleComments);
    }

    /**
     * 访客编辑评论
     */
    public void editComment(ArticleCommentEditDTO editDTO) {
        ArticleComments comment = articleCommentRepository.findById(editDTO.getId())
                .orElseThrow(() -> new ValidationException("评论不存在"));
        if (!comment.getVisitorId().equals(editDTO.getVisitorId())) {
            throw new ValidationException("无权编辑此评论");
        }

        Query query = new Query(Criteria.where("id").is(editDTO.getId()));
        Update update = new Update().set("content", editDTO.getContent());

        if (editDTO.getIsMarkdown() != null && editDTO.getIsMarkdown() == 1) {
            update.set("contentHtml", MarkdownUtil.toHtml(editDTO.getContent()));
        } else {
            update.set("contentHtml", MarkdownUtil.sanitize(editDTO.getContent()));
        }

        mongoTemplate.updateFirst(query, update, ArticleComments.class);
        log.info("访客编辑评论成功: id={}, visitorId={}", editDTO.getId(), editDTO.getVisitorId());
    }

    /**
     * 访客删除评论
     */
    public void visitorDeleteComment(String id, String visitorId) {
        ArticleComments comment = articleCommentRepository.findById(id)
                .orElseThrow(() -> new ValidationException("评论不存在"));
        if (!comment.getVisitorId().equals(visitorId)) {
            throw new ValidationException("无权删除此评论");
        }

        // 如果是根评论，级联删除所有子评论
        if (comment.getRootId() == null || comment.getRootId().isEmpty() || "0".equals(comment.getRootId())) {
            // 只对已审核的子评论减少评论数
            long approvedChildCount = countApprovedByRootId(id);
            if (approvedChildCount > 0) {
                for (int i = 0; i < approvedChildCount; i++) {
                    decrementCommentCount(comment.getArticleId());
                }
            }
            // 删除所有子评论
            mongoTemplate.remove(new Query(Criteria.where("rootId").is(id)), ArticleComments.class);
        }
        // 只有已审核的评论才减少文章评论数
        if (comment.getIsApproved() != null && comment.getIsApproved() == 1) {
            decrementCommentCount(comment.getArticleId());
        }

        articleCommentRepository.deleteById(id);
        log.info("访客删除评论成功: id={}, visitorId={}", id, visitorId);
    }

    // ===== 辅助方法 =====

    /**
     * 统计某根评论下已审核的子评论数
     */
    private long countApprovedByRootId(String rootId) {
        Query query = new Query(Criteria.where("rootId").is(rootId).and("isApproved").is(1));
        return mongoTemplate.count(query, ArticleComments.class);
    }

    /**
     * 文章评论数+1
     */
    private void incrementCommentCount(String articleId) {
        Query query = new Query(Criteria.where("id").is(articleId));
        Update update = new Update().inc("commentCount", 1);
        mongoTemplate.updateFirst(query, update, com.silentfall.blog.entity.Articles.class);
    }

    /**
     * 文章评论数-1
     */
    private void decrementCommentCount(String articleId) {
        Query query = new Query(Criteria.where("id").is(articleId));
        Update update = new Update().inc("commentCount", -1);
        mongoTemplate.updateFirst(query, update, com.silentfall.blog.entity.Articles.class);
    }

    /**
     * 校验邮箱或QQ号格式（可选，为空时跳过校验）
     */
    private void validateEmailOrQq(String emailOrQq) {
        if (emailOrQq == null || emailOrQq.isEmpty()) {
            return;
        }
        String emailRegex = "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$";
        String qqRegex = "^[1-9]\\d{4,10}$";
        if (!emailOrQq.matches(emailRegex) && !emailOrQq.matches(qqRegex)) {
            throw new ValidationException("邮箱或QQ号格式不正确");
        }
    }

    /**
     * 转换为ArticleCommentVO
     */
    private ArticleCommentVO convertToCommentVO(ArticleComments comment) {
        return ArticleCommentVO.builder()
                .id(comment.getId())
                .articleId(comment.getArticleId())
                .rootId(comment.getRootId())
                .parentId(comment.getParentId())
                .parentNickname(comment.getParentNickname())
                .content(comment.getContent())
                .contentHtml(comment.getContentHtml())
                .isMarkdown(comment.getIsMarkdown())
                .visitorId(comment.getVisitorId())
                .nickname(comment.getNickname())
                .emailOrQq(comment.getEmailOrQq())
                .location(comment.getLocation())
                .userAgentOs(comment.getUserAgentOs())
                .userAgentBrowser(comment.getUserAgentBrowser())
                .isApproved(comment.getIsApproved())
                .isSecret(comment.getIsSecret())
                .isAdminReply(comment.getIsAdminReply())
                .createTime(comment.getCreateTime())
                .build();
    }
}
