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

V1 keeps test headers for local development. Real WeChat code exchange can be
enabled later through configuration without changing the public response shape.

## WeChat Login

`POST /api/auth/wechat-login`

### Request

```json
{
  "code": "wx-login-code"
}
```

### Behavior

- In local development, creates or reuses the current account from
  `X-Test-Openid`.
- Returns a temporary application token and current user summary.
- Does not require clients to guess bootstrap fields from the login response.

### Success Response

```json
{
  "success": true,
  "code": "OK",
  "message": "ok",
  "data": {
    "token": "test-token-1001",
    "user": {
      "id": 1001,
      "openid": "test-openid-001",
      "nickname": "Parent"
    }
  }
}
```

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

## Out Of Scope

- Production WeChat AppSecret handling and token refresh.
- Habit template/library APIs.
- Child habit configuration APIs.
- Today check-in APIs.
- Account deletion or logout APIs.
