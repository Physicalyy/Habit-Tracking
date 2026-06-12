# Backend Onboarding API V1

This document describes the first backend APIs used by the miniprogram
onboarding flow. V1 uses test headers to simulate the current WeChat user.

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

Error responses keep the same shape:

```json
{
  "success": false,
  "code": "BAD_REQUEST",
  "message": "X-Test-Openid is required",
  "data": null
}
```

## Test Login Headers

| Header | Required | Description |
| --- | --- | --- |
| `X-Test-Openid` | Yes | Mock current user's WeChat openid. |
| `X-Test-Nickname` | No | Mock current user's nickname. |

V1 does not implement real WeChat login, JWT, or token refresh.

## Bootstrap Current User

`GET /api/me/bootstrap`

### Behavior

- Creates `auth_user_account` when `X-Test-Openid` is new.
- Reuses the existing account when `X-Test-Openid` already exists.
- Updates nickname when `X-Test-Nickname` is present and changed.
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
      "nickname": "Parent"
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
      "nickname": "Parent"
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
| 400 | `BAD_REQUEST` | `X-Test-Openid is required` |

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

1. Creates or reuses the current user account.
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
| 400 | `BAD_REQUEST` | `X-Test-Openid is required` |
| 400 | `BAD_REQUEST` | `Request validation failed` |

## Out Of Scope

- Real WeChat login and session management.
- Join family by invite code.
- Refresh, invalidate, or share invite code APIs.
- Habit template/library APIs.
- Child habit configuration APIs.
- Today check-in APIs.
- Account deletion or logout APIs.
