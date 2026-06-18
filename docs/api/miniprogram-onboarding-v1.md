# 微信小程序首登到今日空态接口契约

本文档描述小程序首阶段使用的最小接口契约。正式环境中，小程序先用
`wx.login` 获取微信 code，再调用后端登录接口换取应用 Bearer Token。

## 通用返回

```json
{
  "code": "OK",
  "message": "ok",
  "data": {}
}
```

## ID Field Format

All backend `Long` identifier fields are JSON strings in responses, including
`id`, `familyId`, `childId`, `childHabitId`, `checkinId`, `memberId`, `userId`,
`createdByMemberId`, `checkedByMemberId`, and `allowedMemberIds`.

The miniprogram must keep these values as strings when building API paths or
request bodies. Do not coerce them with `Number(...)`; Snowflake IDs can exceed
JavaScript's safe integer range. Count fields such as `totalCheckinCount` and
`totalCheckinDays` remain JSON numbers.

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
  "token": "signed-backend-token",
  "user": {
    "id": "1001",
    "openid": "wechat-openid",
    "nickname": "微信用户"
  }
}
```

后端用服务器环境变量 `WECHAT_MINIPROGRAM_APPID` 和
`WECHAT_MINIPROGRAM_SECRET` 调用微信 `code2Session`。小程序不得保存或接触
`AppSecret`、`session_key`。

登录成功后，小程序必须持久化 `token`，后续业务请求统一带：

```http
Authorization: Bearer <token>
```

收到 HTTP `401` 或响应 `code=UNAUTHORIZED` 时，小程序清理本地 token，重新
调用一次 `wx.login` 和 `POST /api/auth/wechat-login`，然后重试当前请求一次。
重试仍失败时提示登录失效。

## GET /api/me/bootstrap

用途：获取小程序启动所需的当前态。

认证：需要 `Authorization: Bearer <token>`。

响应 `data`：

```json
{
  "currentUser": {
    "id": "user_mock_parent",
    "openid": "mock-openid",
    "nickname": "新手家长"
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
  "currentUser": {
    "id": "user_mock_parent",
    "openid": "mock-openid",
    "nickname": "新手家长"
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

加入页支持 URL 参数 `inviteCode` 预填，例如：
`/pages/join-family/index?inviteCode=123456`。扫码内容可以是 6 位数字，
也可以是包含该参数的小程序路径。

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
    "imageUrl": "/assets/habits/drink-water.png",
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
    "imageUrl": "/assets/habits/drink-water.png",
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

## GET /api/children/{childId}/today

Purpose: list active habits for today's check-in page. The response merges the
child-habit snapshot, today's check-in state, and the current member's check-in
permission.

Response `data`:

```json
[
  {
    "childHabitId": 10001,
    "childId": 3001,
    "name": "Drink Water",
    "description": "Drink water during the day.",
    "iconKey": "water_drop",
    "imageUrl": "/assets/habits/drink-water.png",
    "permissionType": "ALL_PARENTS",
    "canCheckin": true,
    "checked": false,
    "checkinId": null,
    "checkedByMemberId": null,
    "checkinDate": null,
    "checkedTime": null
  }
]
```

## POST /api/children/{childId}/habits/{childHabitId}/checkins

Purpose: create today's check-in for the child habit. Duplicate check-ins and
unauthorized parent members return the common error envelope.

Response `data`: same item shape as `GET /api/children/{childId}/today`, with
`checked=true`.

## DELETE /api/children/{childId}/habits/{childHabitId}/checkins/today

Purpose: undo today's check-in for the child habit. The backend soft-deletes
the current-day check-in record, so today's list shows the habit as unchecked,
history no longer displays that record, and `totalCheckinCount` decreases by 1.

Response `data`: same item shape as `GET /api/children/{childId}/today`, with
`checked=false` and empty check-in fields.

## GET /api/children/{childId}/checkins

Purpose: list historical check-in records for the current child. Disabled
habits still appear in history through the saved child-habit snapshot fields.

Response `data`:

```json
[
  {
    "checkinId": 9001,
    "childId": 3001,
    "childHabitId": 10001,
    "habitName": "主动喝水",
    "description": "白天主动喝水，保持身体水分充足。",
    "iconKey": "water_drop",
    "imageUrl": "/assets/habits/drink-water.png",
    "checkinDate": "2026-06-13",
    "checkedTime": "2026-06-13T12:00:00",
    "checkedByMemberId": 4001,
    "note": ""
  }
]
```

## GET /api/children/{childId}/checkins/summary

Purpose: return V1 basic summary for the records page and profile growth
points. The miniprogram uses `totalCheckinCount` as growth points, with
1 check-in = 1 point.

Response `data`:

```json
{
  "childId": 3001,
  "totalCheckinCount": 12,
  "totalCheckinDays": 5
}
```

## DELETE /api/children/{childId}/habits/{childHabitId}

Purpose: soft-delete a configured child habit. The habit no longer appears in
management or today's check-in list, historical check-in records remain
visible, permission relations are cleared, and the same system template can be
added again later.

Response `data`: `null`.

## PATCH /api/children/{childId}/habits/{childHabitId}

Purpose: update basic snapshot fields for a child habit. Permission is not edited in this slice.

Request:

```json
{
  "name": "每天主动喝水",
  "description": "早中晚提醒喝水",
  "iconKey": "water_drop",
  "imageUrl": "/assets/habits/drink-water.png"
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
  "imageUrl": "/assets/habits/drink-water.png"
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
    "imageUrl": "/assets/habits/drink-water.png",
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
    "imageUrl": "/assets/habits/drink-water.png",
    "permissionType": "ALL_PARENTS",
    "createdByMemberId": 4001,
    "status": "active",
    "sortOrder": 0
  }
}
```
