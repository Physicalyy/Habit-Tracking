package com.physicalyy.habittracking.modules.auth.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.physicalyy.habittracking.common.entity.BaseEntity;
import org.springframework.util.StringUtils;

@TableName("auth_user_account")
public class UserAccount extends BaseEntity {

    public static final String DEFAULT_NICKNAME = "微信用户";

    private String openid;

    private String unionid;

    private String nickname;

    private String avatarUrl;

    public String getOpenid() {
        return openid;
    }

    public void setOpenid(String openid) {
        this.openid = openid;
    }

    public String getUnionid() {
        return unionid;
    }

    public void setUnionid(String unionid) {
        this.unionid = unionid;
    }

    public String getNickname() {
        return nickname;
    }

    public void setNickname(String nickname) {
        this.nickname = nickname;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }

    public boolean isProfileCompleted() {
        return (StringUtils.hasText(nickname) && !DEFAULT_NICKNAME.equals(nickname)) || StringUtils.hasText(avatarUrl);
    }
}
