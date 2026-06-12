package com.physicalyy.habittracking.modules.auth.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.physicalyy.habittracking.modules.auth.entity.UserAccount;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface UserAccountMapper extends BaseMapper<UserAccount> {
}
