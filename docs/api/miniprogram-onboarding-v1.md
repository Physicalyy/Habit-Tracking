# 微信小程序首登到今日空态接口契约

本文档描述小程序首阶段使用的最小接口契约。当前小程序实现先走本地 mock 适配层，后端业务接口落地后应保持字段语义一致。

## 通用返回

```json
{
  "code": "OK",
  "message": "ok",
  "data": {}
}
```

## POST /auth/wechat-login

用途：用微信登录 code 换取应用登录态。

请求：

```json
{
  "code": "wx-login-code"
}
```

响应 `data`：

```json
{
  "token": "mock-token",
  "user": {
    "id": "user_mock_parent",
    "nickname": "新手家长",
    "avatarUrl": ""
  }
}
```

## GET /me/bootstrap

用途：获取小程序启动所需的当前态。

响应 `data`：

```json
{
  "user": {
    "id": "user_mock_parent",
    "nickname": "新手家长",
    "avatarUrl": ""
  },
  "families": [],
  "defaultFamily": null,
  "defaultChild": null,
  "needOnboarding": true
}
```

当用户已创建或加入家庭时：

```json
{
  "user": {
    "id": "user_mock_parent",
    "nickname": "新手家长",
    "avatarUrl": ""
  },
  "families": [
    {
      "id": "family_mock_created",
      "name": "小宝之家",
      "role": "OWNER"
    }
  ],
  "defaultFamily": {
    "id": "family_mock_created",
    "name": "小宝之家",
    "role": "OWNER"
  },
  "defaultChild": {
    "id": "child_mock_created",
    "familyId": "family_mock_created",
    "nickname": "小宝"
  },
  "needOnboarding": false
}
```

## POST /families

用途：创建家庭、主家长成员关系和默认孩子。

请求：

```json
{
  "familyName": "小宝之家",
  "childNickname": "小宝"
}
```

响应 `data`：

```json
{
  "family": {
    "id": "family_mock_created",
    "name": "小宝之家",
    "role": "OWNER"
  },
  "child": {
    "id": "child_mock_created",
    "familyId": "family_mock_created",
    "nickname": "小宝"
  },
  "member": {
    "id": "member_mock_owner",
    "role": "OWNER",
    "displayName": "我"
  }
}
```

校验：

- `familyName` 必填。
- `childNickname` 必填。

## POST /families/join

用途：通过 6 位邀请码加入家庭。

请求：

```json
{
  "inviteCode": "123456"
}
```

响应 `data`：

```json
{
  "family": {
    "id": "family_mock_joined",
    "name": "阳光家庭",
    "role": "MEMBER"
  },
  "child": {
    "id": "child_mock_joined",
    "familyId": "family_mock_joined",
    "nickname": "小朋友"
  },
  "member": {
    "id": "member_mock_joined",
    "role": "MEMBER",
    "displayName": "我"
  }
}
```

校验：

- `inviteCode` 必须是 6 位数字。
- 当前 mock 阶段任意 6 位数字都视为可加入。
