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
    "nickname": "微信用户",
    "avatarUrl": null,
    "profileCompleted": false
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
    "nickname": "新手家长",
    "avatarUrl": null,
    "profileCompleted": false
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
    "nickname": "新手家长",
    "avatarUrl": "/api/public/avatars/user_mock_parent-example.png",
    "profileCompleted": true
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

## POST /api/me/avatar

用途：上传当前登录用户主动选择的微信头像。小程序使用
`button open-type="chooseAvatar"` 获取临时文件路径，再通过
`wx.uploadFile` 上传。

认证：需要 `Authorization: Bearer <token>`。

表单字段：`file`

响应 `data`：

```json
{
  "avatarUrl": "/api/public/avatars/user_mock_parent-example.png"
}
```

约束：

- 仅支持 jpg、png、webp。
- 最大 2MB。
- 小程序展示相对 `avatarUrl` 时，使用本地配置的 `apiBaseUrl` 拼接成
  HTTPS 图片地址。

## PATCH /api/me/profile

用途：保存当前用户昵称和头像，用于展示家庭成员身份。昵称输入使用
`input type="nickname"`。

认证：需要 `Authorization: Bearer <token>`。

请求：

```json
{
  "nickname": "妈妈",
  "avatarUrl": "/api/public/avatars/user_mock_parent-example.png"
}
```

响应 `data`：

```json
{
  "id": "user_mock_parent",
  "openid": "mock-openid",
  "nickname": "妈妈",
  "avatarUrl": "/api/public/avatars/user_mock_parent-example.png",
  "profileCompleted": true
}
```

说明：

- `wx.login` 和 `code2Session` 不返回头像昵称，小程序不得写“自动获取”。
- 用户可跳过资料完善，不影响家庭、习惯和打卡主流程。
- 后端保存资料后会同步当前用户所有 active 家庭成员展示名。

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

## GET /api/growth-partner-templates

Purpose: list available growth partner templates for the selection page. V1 only
returns `thunder-war-tiger`, but the shape supports multiple templates and
stages.

Response `data`:

```json
[
  {
    "templateCode": "thunder-war-tiger",
    "name": "雷纹战虎",
    "description": "陪孩子一起积累习惯成长分的雷纹战虎伙伴。",
    "defaultAnimationType": "css",
    "stages": [
      {
        "stageCode": "thunder-war-tiger-egg",
        "name": "雷纹虎蛋",
        "requiredGrowthPoints": 0,
        "imageUrl": "/assets/partners/thunder-war-tiger-stage-0.png",
        "previewImageUrl": "/assets/partners/thunder-war-tiger-stage-0.png",
        "unlocked": true
      },
      {
        "stageCode": "thunder-war-tiger-cub",
        "name": "幼年雷纹虎",
        "requiredGrowthPoints": 20,
        "imageUrl": "/assets/partners/thunder-war-tiger-stage-1.png",
        "previewImageUrl": "/assets/partners/thunder-war-tiger-stage-1.png",
        "unlocked": false
      },
      {
        "stageCode": "thunder-war-tiger-spark",
        "name": "跃电雷纹虎",
        "requiredGrowthPoints": 40,
        "imageUrl": "/assets/partners/thunder-war-tiger-stage-2.png",
        "previewImageUrl": "/assets/partners/thunder-war-tiger-stage-2.png",
        "unlocked": false
      },
      {
        "stageCode": "thunder-war-tiger-battle",
        "name": "战纹雷虎",
        "requiredGrowthPoints": 60,
        "imageUrl": "/assets/partners/thunder-war-tiger-stage-3.png",
        "previewImageUrl": "/assets/partners/thunder-war-tiger-stage-3.png",
        "unlocked": false
      },
      {
        "stageCode": "thunder-war-tiger-armor",
        "name": "雷铠战虎",
        "requiredGrowthPoints": 80,
        "imageUrl": "/assets/partners/thunder-war-tiger-stage-4.png",
        "previewImageUrl": "/assets/partners/thunder-war-tiger-stage-4.png",
        "unlocked": false
      },
      {
        "stageCode": "thunder-war-tiger-wing",
        "name": "雷翼战虎",
        "requiredGrowthPoints": 100,
        "imageUrl": "/assets/partners/thunder-war-tiger-stage-5.png",
        "previewImageUrl": "/assets/partners/thunder-war-tiger-stage-5.png",
        "unlocked": false
      }
    ]
  }
]
```

## GET /api/children/{childId}/growth-partner

Purpose: load the current child's growth partner state for the today page,
records page, and selection page.

Response `data` when unadopted:

```json
{
  "adopted": false,
  "partner": null,
  "currentStage": null,
  "nextStage": null,
  "stages": [
    {
      "stageCode": "thunder-war-tiger-egg",
      "name": "雷纹虎蛋",
      "requiredGrowthPoints": 0,
      "imageUrl": "/assets/partners/thunder-war-tiger-stage-0.png",
      "previewImageUrl": "/assets/partners/thunder-war-tiger-stage-0.png",
      "unlocked": true
    },
    {
      "stageCode": "thunder-war-tiger-cub",
      "name": "幼年雷纹虎",
      "requiredGrowthPoints": 20,
      "imageUrl": "/assets/partners/thunder-war-tiger-stage-1.png",
      "previewImageUrl": "/assets/partners/thunder-war-tiger-stage-1.png",
      "unlocked": false
    },
    {
      "stageCode": "thunder-war-tiger-spark",
      "name": "跃电雷纹虎",
      "requiredGrowthPoints": 40,
      "imageUrl": "/assets/partners/thunder-war-tiger-stage-2.png",
      "previewImageUrl": "/assets/partners/thunder-war-tiger-stage-2.png",
      "unlocked": false
    },
    {
      "stageCode": "thunder-war-tiger-battle",
      "name": "战纹雷虎",
      "requiredGrowthPoints": 60,
      "imageUrl": "/assets/partners/thunder-war-tiger-stage-3.png",
      "previewImageUrl": "/assets/partners/thunder-war-tiger-stage-3.png",
      "unlocked": false
    },
    {
      "stageCode": "thunder-war-tiger-armor",
      "name": "雷铠战虎",
      "requiredGrowthPoints": 80,
      "imageUrl": "/assets/partners/thunder-war-tiger-stage-4.png",
      "previewImageUrl": "/assets/partners/thunder-war-tiger-stage-4.png",
      "unlocked": false
    },
    {
      "stageCode": "thunder-war-tiger-wing",
      "name": "雷翼战虎",
      "requiredGrowthPoints": 100,
      "imageUrl": "/assets/partners/thunder-war-tiger-stage-5.png",
      "previewImageUrl": "/assets/partners/thunder-war-tiger-stage-5.png",
      "unlocked": false
    }
  ]
}
```

Response `data` when adopted:

```json
{
  "adopted": true,
  "partner": {
    "id": "30001",
    "childId": "3001",
    "templateCode": "thunder-war-tiger",
    "templateName": "雷纹战虎",
    "nickname": "雷纹战虎",
    "growthPoints": 42
  },
  "currentStage": {
    "stageCode": "thunder-war-tiger-spark",
    "name": "跃电雷纹虎",
    "requiredGrowthPoints": 40,
    "imageUrl": "/assets/partners/thunder-war-tiger-stage-2.png",
    "previewImageUrl": "/assets/partners/thunder-war-tiger-stage-2.png",
    "unlocked": true
  },
  "nextStage": {
    "stageCode": "thunder-war-tiger-battle",
    "name": "战纹雷虎",
    "requiredGrowthPoints": 60,
    "imageUrl": "/assets/partners/thunder-war-tiger-stage-3.png",
    "previewImageUrl": "/assets/partners/thunder-war-tiger-stage-3.png",
    "unlocked": false
  },
  "stages": []
}
```

The miniprogram must not calculate stage unlocks locally. It should render
`currentStage`, `nextStage`, and `stages` exactly as returned.

## POST /api/children/{childId}/growth-partner/adopt

Purpose: adopt the selected growth partner. V1 accepts only
`templateCode=thunder-war-tiger`; repeated calls return the already adopted
partner without resetting growth points.

Request body:

```json
{
  "templateCode": "thunder-war-tiger"
}
```

Response `data`: same shape as `GET /api/children/{childId}/growth-partner`.

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
    "checkedTime": null,
    "growthPartnerChange": null
  }
]
```

## POST /api/children/{childId}/habits/{childHabitId}/checkins

Purpose: create today's check-in for the child habit. Duplicate check-ins and
unauthorized parent members return the common error envelope.

Response `data`: same item shape as `GET /api/children/{childId}/today`, with
`checked=true`. If the child has adopted a growth partner, the response includes
`growthPartnerChange.delta=1`. Same-stage growth uses
`growthPartnerChange.animationType=energy_gain`; a forward stage boundary such
as `39 -> 40` uses `stage_upgrade`. If the child has no adopted growth partner,
`growthPartnerChange` is `null`.

## DELETE /api/children/{childId}/habits/{childHabitId}/checkins/today

Purpose: undo today's check-in for the child habit. The backend soft-deletes
the current-day check-in record, so today's list shows the habit as unchecked,
history no longer displays that record, and `totalCheckinCount` decreases by 1.

Response `data`: same item shape as `GET /api/children/{childId}/today`, with
`checked=false` and empty check-in fields. If the removed check-in had produced
growth, `growthPartnerChange.delta=-1`; when the undo crosses a stage boundary
such as `40 -> 39`, `growthPartnerChange.animationType=stage_downgrade`.
Otherwise it is `null`.

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
    "note": "",
    "growthPartnerDelta": 1
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
