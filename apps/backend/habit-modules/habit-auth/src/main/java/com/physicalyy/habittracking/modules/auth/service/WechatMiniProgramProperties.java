package com.physicalyy.habittracking.modules.auth.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class WechatMiniProgramProperties {

    private final String appid;
    private final String secret;
    private final String codeToSessionUrl;

    public WechatMiniProgramProperties(
            @Value("${WECHAT_MINIPROGRAM_APPID:${wechat.miniprogram.appid:}}") String appid,
            @Value("${WECHAT_MINIPROGRAM_SECRET:${wechat.miniprogram.secret:}}") String secret,
            @Value("${WECHAT_CODE_TO_SESSION_URL:${wechat.miniprogram.code-to-session-url:https://api.weixin.qq.com/sns/jscode2session}}") String codeToSessionUrl
    ) {
        this.appid = appid;
        this.secret = secret;
        this.codeToSessionUrl = codeToSessionUrl;
    }

    public String appid() {
        return appid;
    }

    public String secret() {
        return secret;
    }

    public String codeToSessionUrl() {
        return codeToSessionUrl;
    }
}
