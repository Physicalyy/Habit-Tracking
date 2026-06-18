# V1 Integration Acceptance

Date: 2026-06-13

## Scope

V1 foreground scope is the WeChat miniprogram. `apps/web/` is not part of this
acceptance pass.

## Contract Checks

- Backend public APIs use the `/api` prefix and the common `ApiResult` envelope.
- Miniprogram page files do not contain raw `/api` URLs; API paths are
  centralized in `apps/miniprogram/core/api.js` and called through service
  modules.
- Miniprogram mock mode is explicit through `setRequestConfig({ useMockApi:
  true })`; the default request config keeps `useMockApi: false`.
- Bootstrap current-user field is `currentUser`, matching backend
  `BootstrapResponse`.
- System habit templates are loaded by Flyway migration
  `apps/backend/habit-admin/src/main/resources/db/migration/V2__seed_system_habit_templates.sql`.

## Automated Verification

- `cd apps/backend; mvn test`
  - Result: passed.
  - Coverage: 29 tests, including `V1IntegrationSmokeTest`.
- `cd apps/miniprogram; npm run validate`
  - Result: passed.
  - Coverage: route/page files, raw API URL guard, explicit mock guard,
    contract path coverage, service tokens, and mock V1 flow.
- `git diff --check`
  - Result: passed with Windows LF-to-CRLF warnings only.

## HTTP Smoke

Command shape:

1. Build local backend modules for the runtime classpath:
   `cd apps/backend; mvn install -DskipTests`
2. Start `habit-admin` on a temporary H2 database and local port `18081`.
3. Execute HTTP requests against `http://localhost:18081`.
4. Stop the Spring Boot and Maven processes started for this smoke pass.

Smoke result:

```text
HTTP_V1_SMOKE_PASS familyId=2065731040139407362 childId=2065731040139407364 systemHabitId=2065731040395259905 customHabitId=2065731040458174467 historyIcon=water_drop
```

Covered path:

- new user login,
- empty bootstrap,
- create family,
- refresh invite code,
- old invite code fails,
- new parent joins family,
- family member list,
- add system habit,
- create custom habit,
- update habit permission,
- member without permission cannot check in,
- owner checks in,
- duplicate check-in fails,
- disabled habit leaves today's list,
- disabled habit remains visible in history,
- summary returns one check-in count and one check-in day.

## HTTP Smoke On MySQL

Command shape:

1. Stop the local Windows `MySQL80` service so port `3306` is free.
2. Start the existing `mysql:8.0` container named `mysql` with the local root
   password supplied outside source control and `3306:3306` published.
3. Recreate `habit_tracking_v1_smoke` on `localhost:3306`.
4. Start `habit-admin` on local port `18082` with the smoke database URL.
5. Execute the same V1 HTTP requests against `http://localhost:18082`.
6. Stop the Spring Boot process started for this smoke pass.

Smoke result:

```text
MYSQL_V1_SMOKE_PASS familyId=2065959365080281089 childId=2065959365080281091 systemHabitId=2065959370247663618 customHabitId=2065959370717425666 historyIcon=water_drop
```

Covered path:

- new user login,
- empty bootstrap,
- create family,
- refresh invite code,
- old invite code fails,
- new parent joins family,
- family member list,
- add system habit,
- create custom habit,
- update habit permission,
- member without permission cannot check in,
- owner checks in,
- duplicate check-in fails,
- disabled habit leaves today's list,
- disabled habit remains visible in history,
- summary returns one check-in count and one check-in day.

## Notes

- The HTTP smoke used ASCII test nicknames in headers because the local
  PowerShell HTTP client rejects non-ASCII header values. JSON request/response
  bodies still validated the V1 business flow.
- No schema change was needed for this acceptance task.
