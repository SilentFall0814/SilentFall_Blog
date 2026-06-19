package com.silentfall.blog.controller.blog;

import com.silentfall.blog.result.Result;
import com.silentfall.blog.service.FriendLinkService;
import com.silentfall.blog.vo.FriendLinkVO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * 博客端友链接口
 */
@RestController("blogFriendLinkController")
@RequestMapping("/blog/friendLink")
public class FriendLinkController {

    @Autowired
    private FriendLinkService friendLinkService;

    /**
     * 获取可见友情链接
     */
    @GetMapping
    public Result<List<FriendLinkVO>> getVisibleFriendLink() {
        List<FriendLinkVO> friendLinkVOList = friendLinkService.getVisibleFriendLink();
        return Result.success(friendLinkVOList);
    }
}
