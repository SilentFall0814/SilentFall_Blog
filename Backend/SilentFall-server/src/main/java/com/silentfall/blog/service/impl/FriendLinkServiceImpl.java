package com.silentfall.blog.service.impl;

import com.silentfall.blog.constant.StatusConstant;
import com.silentfall.blog.dto.FriendLinkDTO;
import com.silentfall.blog.entity.FriendLinks;
import com.silentfall.blog.repository.FriendLinkRepository;
import com.silentfall.blog.service.FriendLinkService;
import com.silentfall.blog.vo.FriendLinkVO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;

@Service
@Slf4j
public class FriendLinkServiceImpl implements FriendLinkService {

    @Autowired
    private FriendLinkRepository friendLinkRepository;

    /**
     * 获取所有友链
     * @return
     */
    @Cacheable(value = "friendLinks", key = "'all'")
    public List<FriendLinks> getAllFriendLink() {
        List<FriendLinks> friendLinkList = friendLinkRepository.findAll();
        if(friendLinkList != null && friendLinkList.size() > 0){
            return friendLinkList;
        }
        return Collections.emptyList();
    }

    /**
     * 添加友链
     * @param friendLink
     */
    @CacheEvict(value = "friendLinks", allEntries = true)
    public void addFriendLink(FriendLinkDTO friendLinkDTO) {
        FriendLinks friendLink = new FriendLinks();
        BeanUtils.copyProperties(friendLinkDTO, friendLink);
        friendLinkRepository.save(friendLink);
    }

    /**
     * 批量删除友链
     * @param ids
     */
    @CacheEvict(value = "friendLinks", allEntries = true)
    public void batchDelete(List<String> ids) {
        friendLinkRepository.deleteAllById(ids);
    }

    /**
     * 修改友链
     * @param friendLink
     */
    @CacheEvict(value = "friendLinks", allEntries = true)
    public void updateFriendLink(FriendLinkDTO friendLinkDTO) {
        FriendLinks friendLink = new FriendLinks();
        BeanUtils.copyProperties(friendLinkDTO, friendLink);
        friendLinkRepository.save(friendLink);
    }

    /**
     * 博客端获取可见的友链
     * @return
     */
    @Cacheable(value = "friendLinks", key = "'visible'")
    public List<FriendLinkVO> getVisibleFriendLink() {
        List<FriendLinks> friendLinkList = friendLinkRepository.findByIsVisible(StatusConstant.ENABLE);
        if(friendLinkList != null && friendLinkList.size() > 0){
            List<FriendLinkVO> friendLinkVOList = friendLinkList.stream().map(friendLink -> FriendLinkVO.builder()
                    .id(friendLink.getId())
                    .name(friendLink.getName())
                    .url(friendLink.getUrl())
                    .avatarUrl(friendLink.getAvatarUrl())
                    .description(friendLink.getDescription())
                    .sort(friendLink.getSort())
                    .build()).toList();
            return friendLinkVOList;
        }
        return Collections.emptyList();
    }
}
