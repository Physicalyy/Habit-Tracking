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

## V1 Family Members And Habit Permissions

This section extends the miniprogram V1 contract for family member visibility,
invite-code management, and child-habit permission editing.

### GET /api/families/{familyId}/members

Purpose: list active family parent members. Any active family member can view
the list. The `admin` boolean identifies the main parent.

Response `data`:

```json
[
  {
    "id": 4001,
    "familyId": 2001,
    "userId": 1001,
    "displayName": "Parent",
    "admin": true
  }
]
```

### PUT /api/children/{childId}/habits/{childHabitId}/permissions

Purpose: update the check-in permission for a configured child habit. Only the
main parent can call this endpoint.

Request:

```json
{
  "permissionType": "SPECIFIC_PARENTS",
  "allowedMemberIds": [4001, 4002]
}
```

Allowed `permissionType` values are `ALL_PARENTS`, `OWNER_ONLY`, and
`SPECIFIC_PARENTS`. `SPECIFIC_PARENTS` requires `allowedMemberIds`.

Response `data`:

```json
{
  "childHabitId": 10001,
  "childId": 3001,
  "permissionType": "SPECIFIC_PARENTS",
  "allowedMemberIds": [4001, 4002]
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

## GET /api/children/{childId}/habits

Purpose: list configured habits for the current child.

Response `data`:

```json
[
  {
    "id": 10001,
    "familyId": 2001,
    "childId": 3001,
    "templateId": 1,
    "name": "主动喝水",
    "description": "白天主动喝水，保持身体水分充足。",
    "iconKey": "water_drop",
    "imageUrl": "",
    "permissionType": "ALL_PARENTS",
    "createdByMemberId": 4001,
    "status": "active",
    "sortOrder": 0
  }
]
```

## POST /api/children/{childId}/habits

Purpose: add a system habit template to the child. Duplicate active child/template pairs return the common error envelope.

Request:

```json
{
  "templateId": 1
}
```

Response `data`: same shape as one child habit item in `GET /api/children/{childId}/habits`.

## PATCH /api/children/{childId}/habits/{childHabitId}

Purpose: update basic snapshot fields for a child habit. Permission is not edited in this slice.

Request:

```json
{
  "name": "每天主动喝水",
  "description": "早中晚提醒喝水",
  "iconKey": "water_drop",
  "imageUrl": ""
}
```

Response `data`: same shape as one child habit item in `GET /api/children/{childId}/habits`.

## PATCH /api/children/{childId}/habits/{childHabitId}/status

Purpose: enable or disable a configured child habit.

Request:

```json
{
  "status": "disabled"
}
```

Allowed `status` values: `active`, `disabled`.

Response `data`: same shape as one child habit item in `GET /api/children/{childId}/habits`.

## POST /api/habit-templates/custom

Purpose: create a custom habit template and immediately add it to the child.

Request:

```json
{
  "childId": 3001,
  "name": "练习钢琴",
  "description": "每天十分钟",
  "category": "CUSTOM",
  "iconKey": "piano",
  "imageUrl": ""
}
```

Response `data`:

```json
{
  "template": {
    "id": 101,
    "slug": "practice-piano-a1b2c3d4",
    "name": "练习钢琴",
    "category": "CUSTOM",
    "description": "每天十分钟",
    "iconKey": "piano",
    "imageUrl": "",
    "sourceType": "CUSTOM",
    "familyId": 2001,
    "createdByMemberId": 4001,
    "status": "active"
  },
  "childHabit": {
    "id": 10002,
    "familyId": 2001,
    "childId": 3001,
    "templateId": 101,
    "name": "练习钢琴",
    "description": "每天十分钟",
    "iconKey": "piano",
    "imageUrl": "",
    "permissionType": "ALL_PARENTS",
    "createdByMemberId": 4001,
    "status": "active",
    "sortOrder": 0
  }
}
```
