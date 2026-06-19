# Backend Onboarding API V1

This document describes the first backend APIs used by the miniprogram
onboarding flow. Production clients authenticate with a backend-issued Bearer
Token obtained through real WeChat miniprogram login.

## Response Envelope

All public API responses use the same envelope:

```json
{
  "success": true,
  "code": "OK",
  "message": "ok",
  "data": {}
}
```

## ID Field Format

All database-backed `Long` identifier fields in API responses are serialized as
JSON strings. This includes fields such as `id`, `familyId`, `childId`,
`childHabitId`, `checkinId`, `memberId`, `userId`, `createdByMemberId`,
`checkedByMemberId`, and `allowedMemberIds`.

Reason: MyBatis-Plus Snowflake IDs can exceed JavaScript's safe integer range,
and the WeChat miniprogram runtime would otherwise lose precision before using
the ID in a later request path. Count fields such as `totalCheckinCount` and
`totalCheckinDays` remain JSON numbers.

Error responses keep the same shape:

```json
{
  "success": false,
  "code": "UNAUTHORIZED",
  "message": "Authentication is required",
  "data": null
}
```

## Authentication

`POST /api/auth/wechat-login` does not require `Authorization`. All other
business APIs require:

```http
Authorization: Bearer <token>
```

The backend test suite may enable `X-Test-Openid` / `X-Test-Nickname` through
`auth.test-headers.enabled=true`. These headers are compatibility-only test
inputs and must not be used by the production miniprogram.

## WeChat Login

`POST /api/auth/wechat-login`

### Request

```json
{
  "code": "wx-login-code"
}
```

### Behavior

- Uses WeChat `code2Session` with server-side `WECHAT_MINIPROGRAM_APPID` and
  `WECHAT_MINIPROGRAM_SECRET`.
- Creates or reuses `auth_user_account` by returned `openid`, and saves
  `unionid` when WeChat returns it.
- Does not store, return, or log `session_key`.
- Returns a signed application token and current user summary.
- Does not require clients to guess bootstrap fields from the login response.

### Success Response

```json
{
  "success": true,
  "code": "OK",
  "message": "ok",
  "data": {
    "token": "eyJ-or-signed-token",
    "user": {
      "id": 1001,
      "openid": "wechat-openid",
      "nickname": "微信用户",
      "avatarUrl": null,
      "profileCompleted": false
    }
  }
}
```

## Bootstrap Current User

`GET /api/me/bootstrap`

### Behavior

- Requires a valid Bearer Token.
- Loads the current `auth_user_account` from the token payload.
- Returns `needOnboarding=true` when the user has no active family membership.
- Returns active families, default family, and default child when the user has
  active family membership.
- Calculates `family.admin` from `family_group.admin_member_id`.

### Empty Onboarding Response

```json
{
  "success": true,
  "code": "OK",
  "message": "ok",
  "data": {
    "needOnboarding": true,
    "currentUser": {
      "id": 1001,
      "openid": "test-openid-001",
      "nickname": "Parent",
      "avatarUrl": "/api/public/avatars/1001-example.png",
      "profileCompleted": true
    },
    "families": [],
    "defaultFamily": null,
    "defaultChild": null
  }
}
```

### Existing Family Response

```json
{
  "success": true,
  "code": "OK",
  "message": "ok",
  "data": {
    "needOnboarding": false,
    "currentUser": {
      "id": 1001,
      "openid": "test-openid-001",
      "nickname": "Parent",
      "avatarUrl": "/api/public/avatars/1001-example.png",
      "profileCompleted": true
    },
    "families": [
      {
        "id": 2001,
        "name": "Little Bao Family",
        "admin": true
      }
    ],
    "defaultFamily": {
      "id": 2001,
      "name": "Little Bao Family",
      "admin": true
    },
    "defaultChild": {
      "id": 3001,
      "familyId": 2001,
      "nickname": "Little Bao"
    }
  }
}
```

### Errors

| HTTP Status | Code | Message |
| --- | --- | --- |
| 401 | `UNAUTHORIZED` | `Authentication is required` |
| 401 | `UNAUTHORIZED` | `Authentication token is invalid` |
| 401 | `UNAUTHORIZED` | `Authentication token is expired` |

## Current User Profile

`POST /api/me/avatar`

Uploads the current user's avatar as multipart form data. The request field is
`file`.

### Behavior

- Requires a valid Bearer Token.
- Accepts only JPEG, PNG, or WebP image files up to 2 MB.
- Validates both content type and image magic bytes.
- Ignores the original file name and stores the file under the configured
  avatar storage directory.
- Returns a relative public URL. The response never contains a local filesystem
  path.
- Replacing an avatar deletes the previous local avatar when possible. Deletion
  failure is logged as a non-sensitive warning and does not fail the upload.

### Success Response

```json
{
  "success": true,
  "code": "OK",
  "message": "ok",
  "data": {
    "avatarUrl": "/api/public/avatars/1001-example.png"
  }
}
```

`PATCH /api/me/profile`

Updates the current user's display profile.

### Request

```json
{
  "nickname": "Parent",
  "avatarUrl": "/api/public/avatars/1001-example.png"
}
```

### Behavior

- Requires a valid Bearer Token.
- Uses the existing nickname when `nickname` is blank or omitted.
- Uses the existing avatar when `avatarUrl` is blank or omitted.
- Accepts only avatar URLs previously uploaded by the current user.
- Synchronizes the new nickname to all active `family_member.display_name` rows
  for the current user.
- `profileCompleted` is true when nickname is not the default `微信用户` or
  `avatarUrl` is not blank.

### Success Response

```json
{
  "success": true,
  "code": "OK",
  "message": "ok",
  "data": {
    "id": 1001,
    "openid": "wechat-openid",
    "nickname": "Parent",
    "avatarUrl": "/api/public/avatars/1001-example.png",
    "profileCompleted": true
  }
}
```

`GET /api/public/avatars/{filename}`

Publicly reads an uploaded avatar file. The backend only serves files inside
the configured avatar storage directory.

## Create Family

`POST /api/families`

### Request

```json
{
  "name": "Little Bao Family",
  "childNickname": "Little Bao"
}
```

### Validation

| Field | Required | Limit |
| --- | --- | --- |
| `name` | Yes | 64 characters max |
| `childNickname` | Yes | 64 characters max |

### Behavior

Within one transaction, the backend:

1. Loads the current user account from the Bearer Token.
2. Creates `family_group`.
3. Creates the main parent `family_member`.
4. Updates `family_group.admin_member_id`.
5. Creates the default `child_profile`.
6. Creates one active 6-digit invite code valid for 7 days.

V1 allows one account to create multiple families. V1 does not implement a
client idempotency key for repeated button taps.

### Success Response

```json
{
  "success": true,
  "code": "OK",
  "message": "ok",
  "data": {
    "family": {
      "id": 2001,
      "name": "Little Bao Family",
      "admin": true
    },
    "child": {
      "id": 3001,
      "familyId": 2001,
      "nickname": "Little Bao"
    },
    "inviteCode": {
      "code": "123456",
      "status": "active",
      "expiresTime": "2026-06-20T12:00:00"
    }
  }
}
```

### Errors

| HTTP Status | Code | Message |
| --- | --- | --- |
| 401 | `UNAUTHORIZED` | `Authentication is required` |
| 400 | `BAD_REQUEST` | `Request validation failed` |

## Join Family

`POST /api/families/join`

### Request

```json
{
  "inviteCode": "123456"
}
```

### Behavior

- Validates that the invite code is 6 digits, active, not deleted, and not
  expired.
- Creates or reactivates the current user's family member record.
- Returns the joined family, default child, and current member summary.

### Success Response

```json
{
  "success": true,
  "code": "OK",
  "message": "ok",
  "data": {
    "family": {
      "id": 2001,
      "name": "Little Bao Family",
      "admin": false
    },
    "child": {
      "id": 3001,
      "familyId": 2001,
      "nickname": "Little Bao"
    },
    "member": {
      "id": 4002,
      "familyId": 2001,
      "userId": 1002,
      "displayName": "Grandma",
      "admin": false
    }
  }
}
```

## Family Invite Code

`GET /api/families/{familyId}/invite`

Returns the current active invite code. Only the family admin can query it.

`POST /api/families/{familyId}/invite/refresh`

Invalidates existing active invite codes for the family and creates a new
6-digit code valid for 7 days. Only the family admin can refresh it.

### Success Response

```json
{
  "success": true,
  "code": "OK",
  "message": "ok",
  "data": {
    "code": "654321",
    "status": "active",
    "expiresTime": "2026-06-20T12:00:00"
  }
}
```

### Errors

| HTTP Status | Code | Message |
| --- | --- | --- |
| 400 | `BAD_REQUEST` | `Request validation failed` |
| 400 | `BAD_REQUEST` | `Invite code is invalid or expired` |
| 400 | `BAD_REQUEST` | `Only family admin can manage invite code` |

## Family Members

`GET /api/families/{familyId}/members`

Returns active parent members in the family. Any active family member can query
the list; management-only actions remain limited to the family admin.

### Success Response

```json
{
  "success": true,
  "code": "OK",
  "message": "ok",
  "data": [
    {
      "id": 4001,
      "familyId": 2001,
      "userId": 1001,
      "displayName": "Parent",
      "admin": true
    },
    {
      "id": 4002,
      "familyId": 2001,
      "userId": 1002,
      "displayName": "Grandma",
      "admin": false
    }
  ]
}
```

### Errors

| HTTP Status | Code | Message |
| --- | --- | --- |
| 400 | `BAD_REQUEST` | `Family not found` |
| 400 | `BAD_REQUEST` | `Current user is not a family member` |

## Habit Template Library

`GET /api/habit-templates`

Lists enabled habit templates for the V1 miniprogram habit library.

### Query Parameters

| Name | Required | Description |
| --- | --- | --- |
| `category` | No | Template category. Current system categories are `HEALTH`, `LIFE_SKILLS`, `LEARNING`, `SPORTS`, `SOCIAL_EMOTION`, and `SAFETY`. |
| `keyword` | No | Keyword matched against template name or description. |
| `sourceType` | No | Template source. V1 system library uses `SYSTEM`. |

### Behavior

- Returns only rows where `status=active` and `del_flag=0`.
- Supports combining category, keyword, and source-type filters.
- System templates are maintained by Flyway migration and the public
  `db/seeds/seed_system_habit_templates_v1.sql` artifact.

### Success Response

```json
{
  "success": true,
  "code": "OK",
  "message": "ok",
  "data": [
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
}
```

## Child Habit Configuration

All child-habit APIs require a valid Bearer Token and the current user to be an
active member of the child's family.

### List Child Habits

`GET /api/children/{childId}/habits`

Returns configured child-habit snapshots. Disabled habits remain visible for
management, but later today-check-in APIs should only use active rows.

### Add System Template To Child

`POST /api/children/{childId}/habits`

Request:

```json
{
  "templateId": 1
}
```

Behavior:

- Validates the child belongs to a family where the current user is an active
  member.
- Validates the template exists, is active, and has `sourceType=SYSTEM`.
- Copies template display fields into `habit_child_config` as a snapshot.
- Sets `permissionType=ALL_PARENTS` and `status=active`.
- Rejects duplicate `childId + templateId` rows.

### Update Child Habit

`PATCH /api/children/{childId}/habits/{childHabitId}`

Request:

```json
{
  "name": "每天主动喝水",
  "description": "早中晚提醒喝水",
  "iconKey": "water_drop",
  "imageUrl": "/assets/habits/drink-water.png"
}
```

Updates only the basic snapshot display fields in this slice. Permission edits
are handled by the later family-members-and-permissions task.

### Update Child Habit Status

`PATCH /api/children/{childId}/habits/{childHabitId}/status`

Request:

```json
{
  "status": "disabled"
}
```

Allowed status values: `active`, `disabled`.

### Update Child Habit Permissions

`PUT /api/children/{childId}/habits/{childHabitId}/permissions`

Only the family admin can update child-habit permissions. `SPECIFIC_PARENTS`
replaces the allowed family-member set in `habit_child_allowed_member`.

Request:

```json
{
  "permissionType": "SPECIFIC_PARENTS",
  "allowedMemberIds": [4001, 4002]
}
```

Allowed `permissionType` values:

| Value | Meaning |
| --- | --- |
| `ALL_PARENTS` | Any active parent member in the family can check in. |
| `OWNER_ONLY` | Only the member who created the child habit can check in. |
| `SPECIFIC_PARENTS` | Only listed family member IDs can check in. |

Success response:

```json
{
  "success": true,
  "code": "OK",
  "message": "ok",
  "data": {
    "childHabitId": 10001,
    "childId": 3001,
    "permissionType": "SPECIFIC_PARENTS",
    "allowedMemberIds": [4001, 4002]
  }
}
```

### Create Custom Habit

`POST /api/habit-templates/custom`

Request:

```json
{
  "childId": 3001,
  "name": "Practice Piano",
  "description": "Practice for ten minutes.",
  "category": "LEARNING",
  "iconKey": "piano",
  "imageUrl": "/assets/habits/drink-water.png"
}
```

Behavior:

- Creates `habit_template` with `sourceType=CUSTOM`, current family, current
  member, generated slug, and `status=active`.
- Creates the linked child habit snapshot in the same transaction.
- Sets child-habit `permissionType=ALL_PARENTS` and `status=active`.

### Delete Child Habit

`DELETE /api/children/{childId}/habits/{childHabitId}`

Only the family admin can delete a configured child habit.

Behavior:

- Soft-deletes `habit_child_config`; historical check-in records stay intact.
- Clears `habit_child_allowed_member` rows for this child habit.
- Excludes the deleted habit from management and today's check-in lists.
- Releases the active child/template uniqueness slot, so the same system
  template can be added to the child again.

Success response:

```json
{
  "success": true,
  "code": "OK",
  "message": "ok",
  "data": null
}
```

### Child Habit Response Shape

```json
{
  "success": true,
  "code": "OK",
  "message": "ok",
  "data": {
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
}
```

### Errors

| HTTP Status | Code | Message |
| --- | --- | --- |
| 400 | `BAD_REQUEST` | `Child not found` |
| 400 | `BAD_REQUEST` | `Current user is not a family member` |
| 400 | `BAD_REQUEST` | `Habit template not found` |
| 400 | `BAD_REQUEST` | `Child habit already exists` |
| 400 | `BAD_REQUEST` | `Child habit status is invalid` |
| 400 | `BAD_REQUEST` | `Only family admin can manage habit permissions` |
| 400 | `BAD_REQUEST` | `Child habit permission type is invalid` |
| 400 | `BAD_REQUEST` | `Allowed members are required` |
| 400 | `BAD_REQUEST` | `Allowed member is invalid` |

## Today Check-In

### List Today Habits

`GET /api/children/{childId}/today`

Returns active child habits for the current child and merges today's check-in
state plus the current member's permission state. Disabled habits are excluded.

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

### Create Check-In

`POST /api/children/{childId}/habits/{childHabitId}/checkins`

Creates today's check-in record for the child habit. The backend validates
family membership, child ownership, active habit status, permission, and the
one-record-per-habit-per-day unique rule.

Response `data`: same item shape as `GET /api/children/{childId}/today`, with
`checked=true` and check-in fields filled.

### Undo Today's Check-In

`DELETE /api/children/{childId}/habits/{childHabitId}/checkins/today`

Soft-deletes today's check-in record for the child habit. The backend validates
family membership, child ownership, active habit status, permission, and that a
today record exists.

Response `data`: same item shape as `GET /api/children/{childId}/today`, with
`checked=false` and check-in fields empty.

### Errors

| HTTP Status | Code | Message |
| --- | --- | --- |
| 400 | `BAD_REQUEST` | `Child not found` |
| 400 | `BAD_REQUEST` | `Current user is not a family member` |
| 400 | `BAD_REQUEST` | `Child habit not found or disabled` |
| 400 | `BAD_REQUEST` | `Current member cannot check in this habit` |
| 400 | `BAD_REQUEST` | `Current member cannot undo this check-in` |
| 400 | `BAD_REQUEST` | `Habit already checked in today` |
| 400 | `BAD_REQUEST` | `Habit is not checked in today` |

## Check-In History

### List Check-In History

`GET /api/children/{childId}/checkins`

Returns historical check-in records for the child. The backend validates that
the current user is an active member of the child's family. History display
uses the child-habit snapshot fields from `habit_child_config`, so disabled
habits remain visible in history.

Response `data`:

```json
[
  {
    "checkinId": 9001,
    "childId": 3001,
    "childHabitId": 10001,
    "habitName": "Drink Water",
    "description": "Drink water during the day.",
    "iconKey": "water_drop",
    "imageUrl": "/assets/habits/drink-water.png",
    "checkinDate": "2026-06-13",
    "checkedTime": "2026-06-13T12:00:00",
    "checkedByMemberId": 4001,
    "note": ""
  }
]
```

### Get Check-In Summary

`GET /api/children/{childId}/checkins/summary`

Returns V1 basic summary fields for the child. The miniprogram profile page
uses `totalCheckinCount` as growth points, with 1 check-in = 1 point.

Response `data`:

```json
{
  "childId": 3001,
  "totalCheckinCount": 12,
  "totalCheckinDays": 5
}
```

### Errors

| HTTP Status | Code | Message |
| --- | --- | --- |
| 400 | `BAD_REQUEST` | `Child not found` |
| 400 | `BAD_REQUEST` | `Current user is not a family member` |

## Deployment Notes

- Backend container environment variables:
  - `WECHAT_MINIPROGRAM_APPID`
  - `WECHAT_MINIPROGRAM_SECRET`
  - `AUTH_TOKEN_SECRET`
  - `AUTH_TOKEN_TTL_SECONDS`, default `604800`
  - `AVATAR_STORAGE_DIR`, default `/app/data/avatars` in Docker deployment
  - `SPRING_SERVLET_MULTIPART_MAX_FILE_SIZE`, recommended `2MB`
  - `SPRING_SERVLET_MULTIPART_MAX_REQUEST_SIZE`, recommended `2MB`
- WeChat public platform must add the deployed backend HTTPS domain as a
  request legal domain.
- WeChat public platform must add the deployed backend HTTPS domain as an
  uploadFile legal domain for avatar upload.
- The HTTPS reverse proxy must allow avatar upload size, for example
  `client_max_body_size 2m` or higher.
- If WeChat server IP whitelist is enabled, add the backend server's outbound
  IP from your server or from the WeChat error response.

## Out Of Scope

- WeChat Pay APIv3 keys, merchant certificates, safe keyboard certificates.
- Phone number authorization, object storage, CDN, image cropping, or image
  review.
- Account deletion or logout APIs.
