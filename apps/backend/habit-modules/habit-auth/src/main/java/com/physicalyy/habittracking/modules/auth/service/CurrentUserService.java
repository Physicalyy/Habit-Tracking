package com.physicalyy.habittracking.modules.auth.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.physicalyy.habittracking.common.exception.MissingOpenidException;
import com.physicalyy.habittracking.common.exception.UnauthorizedException;
import com.physicalyy.habittracking.modules.auth.entity.UserAccount;
import com.physicalyy.habittracking.modules.auth.mapper.UserAccountMapper;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class CurrentUserService {

    private final UserAccountMapper userAccountMapper;
    private final AuthenticationContext authenticationContext;

    public CurrentUserService(UserAccountMapper userAccountMapper, AuthenticationContext authenticationContext) {
        this.userAccountMapper = userAccountMapper;
        this.authenticationContext = authenticationContext;
    }

    public UserAccount requireCurrentUser() {
        CurrentUserIdentity identity = authenticationContext.requireCurrentUserIdentity();
        UserAccount account = userAccountMapper.selectById(identity.userId());
        if (account == null || !"0".equals(account.getDelFlag()) || !identity.openid().equals(account.getOpenid())) {
            throw new UnauthorizedException("Authentication token is invalid");
        }
        return account;
    }

    public UserAccount requireCurrentUser(String openid, String nickname) {
        return findOrCreateByOpenid(openid, nickname, null);
    }

    public UserAccount findOrCreateByOpenid(String openid, String nickname, String unionid) {
        if (!StringUtils.hasText(openid)) {
            throw new MissingOpenidException();
        }

        UserAccount account = userAccountMapper.selectOne(new LambdaQueryWrapper<UserAccount>()
                .eq(UserAccount::getOpenid, openid)
                .eq(UserAccount::getDelFlag, "0"));
        if (account == null) {
            account = new UserAccount();
            account.setOpenid(openid);
            account.setUnionid(StringUtils.hasText(unionid) ? unionid : null);
            account.setNickname(StringUtils.hasText(nickname) ? nickname : "微信用户");
            account.touchForCreate(openid);
            userAccountMapper.insert(account);
            return account;
        }

        boolean changed = false;
        if (StringUtils.hasText(nickname) && !nickname.equals(account.getNickname())) {
            account.setNickname(nickname);
            changed = true;
        }
        if (StringUtils.hasText(unionid) && !unionid.equals(account.getUnionid())) {
            account.setUnionid(unionid);
            changed = true;
        }
        if (changed) {
            account.touchForUpdate(openid);
            userAccountMapper.updateById(account);
        }
        return account;
    }

    public UserAccount requireUserByTokenPayload(AuthTokenPayload payload) {
        UserAccount account = userAccountMapper.selectById(payload.userId());
        if (account == null || !"0".equals(account.getDelFlag()) || !payload.openid().equals(account.getOpenid())) {
            throw new UnauthorizedException("Authentication token is invalid");
        }
        return account;
    }
}
