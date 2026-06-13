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

## POST /api/auth/wechat-login

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

## GET /api/me/bootstrap

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
      "admin": true
    }
  ],
  "defaultFamily": {
    "id": "family_mock_created",
    "name": "小宝之家",
    "admin": true
  },
  "defaultChild": {
    "id": "child_mock_created",
    "familyId": "family_mock_created",
    "nickname": "小宝"
  },
  "needOnboarding": false
}
```

## POST /api/families

用途：创建家庭、主家长成员关系和默认孩子。

请求：

```json
{
  "name": "小宝之家",
  "childNickname": "小宝"
}
```

响应 `data`：

```json
{
  "family": {
    "id": "family_mock_created",
    "name": "小宝之家",
    "admin": true
  },
  "child": {
    "id": "child_mock_created",
    "familyId": "family_mock_created",
    "nickname": "小宝"
  },
  "inviteCode": {
    "code": "123456",
    "status": "active",
    "expiresTime": "2026-06-20T12:00:00"
  }
}
```

校验：

- `name` 必填。
- `childNickname` 必填。

## POST /api/families/join

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
    "admin": false
  },
  "child": {
    "id": "child_mock_joined",
    "familyId": "family_mock_joined",
    "nickname": "小朋友"
  },
  "member": {
    "id": "member_mock_joined",
    "familyId": "family_mock_joined",
    "userId": "user_mock_parent",
    "displayName": "我",
    "admin": false
  }
}
```

校验：

- `inviteCode` 必须是 6 位数字。
## GET /api/families/{familyId}/invite

用途：查询当前家庭有效邀请码。

响应 `data`：

```json
{
  "code": "123456",
  "status": "active",
  "expiresTime": "2026-06-20T12:00:00"
}
```

## POST /api/families/{familyId}/invite/refresh

用途：刷新当前家庭邀请码。刷新后旧邀请码失效，新邀请码可加入家庭。

响应 `data`：

```json
{
  "code": "654321",
  "status": "active",
  "expiresTime": "2026-06-20T12:00:00"
}
```

## GET /api/habit-templates

Purpose: list enabled habit templates for the miniprogram habit library.

Query parameters:

| Name | Required | Description |
| --- | --- | --- |
| `category` | No | Template category, such as `HEALTH`, `LIFE_SKILLS`, `LEARNING`, `SPORTS`, `SOCIAL_EMOTION`, or `SAFETY`. |
| `keyword` | No | Search keyword matched against template name or description. |
| `sourceType` | No | Template source. V1 habit library uses `SYSTEM`. |

Response `data`:

```json
[
  {
    "id": 1,
    "slug": "drink-water",
    "name": "每天喝水",
    "category": "HEALTH",
    "description": "养成主动喝水的习惯，减少含糖饮料摄入。",
    "ageMin": 3,
    "ageMax": 12,
    "iconKey": "water_drop",
    "imageUrl": "",
    "sourceType": "SYSTEM",
    "status": "active"
  }
]
```

Notes:

- The backend only returns templates with `status=active` and `del_flag=0`.
- The miniprogram must call this endpoint through `core/api.js` and `services/habit-service.js`; page files must not embed raw API paths.
- The Add action is an entry point for the later child-habit task and must not invent a child-habit URL in this slice.
