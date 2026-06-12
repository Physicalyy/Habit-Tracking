package com.physicalyy.habittracking.modules.auth.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.physicalyy.habittracking.common.exception.MissingOpenidException;
import com.physicalyy.habittracking.modules.auth.entity.UserAccount;
import com.physicalyy.habittracking.modules.auth.mapper.UserAccountMapper;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class CurrentUserService {

    private final UserAccountMapper userAccountMapper;

    public CurrentUserService(UserAccountMapper userAccountMapper) {
        this.userAccountMapper = userAccountMapper;
    }

    public UserAccount requireCurrentUser(String openid, String nickname) {
        if (!StringUtils.hasText(openid)) {
            throw new MissingOpenidException();
        }

        UserAccount account = userAccountMapper.selectOne(new LambdaQueryWrapper<UserAccount>()
                .eq(UserAccount::getOpenid, openid)
                .eq(UserAccount::getDelFlag, "0"));
        if (account == null) {
            account = new UserAccount();
            account.setOpenid(openid);
            account.setNickname(StringUtils.hasText(nickname) ? nickname : "微信用户");
            account.touchForCreate(openid);
            userAccountMapper.insert(account);
            return account;
        }

        if (StringUtils.hasText(nickname) && !nickname.equals(account.getNickname())) {
            account.setNickname(nickname);
            account.touchForUpdate(openid);
            userAccountMapper.updateById(account);
        }
        return account;
    }
}
