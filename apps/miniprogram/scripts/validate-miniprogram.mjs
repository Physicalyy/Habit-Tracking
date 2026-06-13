import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const scriptDir = dirname(fileURLToPath(import.meta.url));
const rootDir = join(scriptDir, "..");
const repoDir = join(rootDir, "..", "..");
const requireFromRoot = createRequire(pathToFileURL(join(rootDir, "package.json")));

const requiredPages = [
  "pages/start/index",
  "pages/create-family/index",
  "pages/join-family/index",
  "pages/today/index",
  "pages/records/index",
  "pages/me/index",
  "pages/habit-library/index",
  "pages/habit-manage/index",
  "pages/custom-habit/index",
  "pages/family-members/index",
  "pages/family-invite/index",
  "pages/habit-permission/index",
];

const tabPages = [
  "pages/today/index",
  "pages/records/index",
  "pages/me/index",
];

const requiredApiPaths = [
  "POST /api/auth/wechat-login",
  "GET /api/me/bootstrap",
  "POST /api/families",
  "POST /api/families/join",
  "GET /api/families/{familyId}/invite",
  "POST /api/families/{familyId}/invite/refresh",
  "GET /api/families/{familyId}/members",
  "GET /api/habit-templates",
  "GET /api/children/{childId}/habits",
  "POST /api/children/{childId}/habits",
  "PATCH /api/children/{childId}/habits/{childHabitId}",
  "PATCH /api/children/{childId}/habits/{childHabitId}/status",
  "PUT /api/children/{childId}/habits/{childHabitId}/permissions",
  "POST /api/habit-templates/custom",
];

const requiredAssets = [
  "assets/onboarding/start-family-growth.png",
  "assets/onboarding/create-family-home.png",
  "assets/onboarding/join-family-welcome.png",
  "assets/onboarding/today-empty-sprout.png",
  "assets/fonts/material-symbols.wxss",
  "assets/icons/bubble-chart-teal.png",
  "assets/icons/help-outline-dark.png",
  "assets/icons/eco-gold.png",
  "assets/icons/favorite-teal.png",
  "assets/icons/add-home-white.png",
  "assets/icons/group-add-teal.png",
];

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function assertFile(path) {
  assert.ok(existsSync(path), `Missing required file: ${path}`);
}

function assertTextIncludes(path, value) {
  const content = readFileSync(path, "utf8");
  assert.ok(content.includes(value), `${path} must include ${value}`);
}

function collectFiles(dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    const stat = statSync(path);
    if (stat.isDirectory()) {
      files.push(...collectFiles(path));
    } else {
      files.push(path);
    }
  }
  return files;
}

function assertNoTextFileBom() {
  for (const path of collectFiles(rootDir)) {
    if (!/\.(js|json|mjs|wxml|wxss)$/.test(path)) {
      continue;
    }
    const bytes = readFileSync(path);
    assert.ok(
      bytes.length < 3 || bytes[0] !== 0xef || bytes[1] !== 0xbb || bytes[2] !== 0xbf,
      `${path} must be saved as UTF-8 without BOM`,
    );
  }
}

function assertCommonJs(path) {
  const source = readFileSync(path, "utf8");
  assert.ok(!/^\s*import\s/m.test(source) && !/^\s*export\s/m.test(source), `${path} must use CommonJS`);
}

function assertNoWxmlFunctionCalls(pagePath) {
  const source = readFileSync(join(rootDir, pagePath + ".wxml"), "utf8");
  assert.ok(!/\{\{[^}]*\([^}]*\)[^}]*\}\}/.test(source), `${pagePath}.wxml must not use function calls`);
}

function assertWxssCompatibility(pagePath) {
  const source = readFileSync(join(rootDir, pagePath + ".wxss"), "utf8");
  assert.ok(!source.includes("gap:"), `${pagePath}.wxss must avoid gap`);
  assert.ok(!source.includes("::before") && !source.includes("::after"), `${pagePath}.wxss must avoid pseudo-elements`);
}

function assertNoRawApiUrls(pagePath) {
  const source = readFileSync(join(rootDir, pagePath + ".js"), "utf8");
  for (const apiPath of requiredApiPaths) {
    const rawPath = apiPath.replace(/^[A-Z]+ /, "");
    assert.ok(!source.includes(rawPath), `${pagePath}.js must not contain raw API path ${rawPath}`);
  }
}

function assertAppConfig() {
  const appConfig = readJson(join(rootDir, "app.json"));
  const projectConfig = readJson(join(rootDir, "project.config.json"));
  assert.equal(projectConfig.libVersion, "3.14.3");
  assert.deepEqual(appConfig.pages, requiredPages);
  assert.deepEqual(appConfig.tabBar.list.map((item) => item.pagePath), tabPages);
}

function assertApiConfiguration() {
  const apiSource = readFileSync(join(rootDir, "core/api.js"), "utf8");
  for (const apiPath of requiredApiPaths) {
    const rawPath = apiPath.replace(/^[A-Z]+ /, "");
    assert.ok(apiSource.includes(rawPath.split("{")[0]), `core/api.js must define ${rawPath}`);
  }
  for (const token of [
    "function familyInvite",
    "function refreshFamilyInvite",
    "function familyMembers",
    "function childHabits",
    "function childHabitPermissions",
  ]) {
    assertTextIncludes(join(rootDir, "core/api.js"), token);
  }

  const requestSource = readFileSync(join(rootDir, "utils/request.js"), "utf8");
  assert.ok(!requestSource.includes("const USE_MOCK_API = true"), "mock API must be explicit");
  assertTextIncludes(join(rootDir, "utils/request.js"), "setRequestConfig");
  assertTextIncludes(join(rootDir, "utils/request.js"), '"X-Test-Openid"');
  assertTextIncludes(join(rootDir, "utils/request.js"), '"X-Test-Nickname"');
}

function assertRoutesAndServices() {
  for (const token of [
    "HABIT_LIBRARY",
    "HABIT_MANAGE",
    "CUSTOM_HABIT",
    "FAMILY_MEMBERS",
    "FAMILY_INVITE",
    "HABIT_PERMISSION",
  ]) {
    assertTextIncludes(join(rootDir, "core/routes.js"), token);
  }

  const checks = [
    ["services/family-service.js", ["getFamilyInvite", "refreshFamilyInvite", "listFamilyMembers", "familyMembers("]],
    ["services/habit-service.js", ["listHabitTemplates", "API_ENDPOINTS.HABIT_TEMPLATES"]],
    ["services/child-habit-service.js", ["listChildHabits", "addSystemTemplateToChild", "createCustomHabit", "updateChildHabit", "updateChildHabitStatus", "updateChildHabitPermission", "childHabitPermissions("]],
    ["pages/me/index.js", ["ROUTES.FAMILY_MEMBERS", "ROUTES.FAMILY_INVITE", "goFamilyMembers", "goFamilyInvite", "isFamilyAdmin"]],
    ["pages/habit-manage/index.js", ["ROUTES.HABIT_PERMISSION", "goHabitPermission", "canManageHabits", "permissionTypeText"]],
    ["pages/family-members/index.js", ["listFamilyMembers", "getBootstrap", "goFamilyInvite", "memberCount", "isFamilyAdmin"]],
    ["pages/family-invite/index.js", ["getFamilyInvite", "refreshFamilyInvite", "copyInviteCode", "refreshInvite", "isFamilyAdmin"]],
    ["pages/habit-permission/index.js", ["listFamilyMembers", "updateChildHabitPermission", "permissionOptions", "SPECIFIC_PARENTS", "allowedMemberIds", "savePermission"]],
  ];
  for (const [path, tokens] of checks) {
    for (const token of tokens) {
      assertTextIncludes(join(rootDir, path), token);
    }
  }
}

async function assertMockFlow() {
  const { setRequestConfig } = requireFromRoot("./utils/request.js");
  const { resetMockSession } = requireFromRoot("./services/session-state.js");
  const { getBootstrap } = requireFromRoot("./services/bootstrap-service.js");
  const {
    createFamily,
    joinFamily,
    getFamilyInvite,
    refreshFamilyInvite,
    listFamilyMembers,
  } = requireFromRoot("./services/family-service.js");
  const { listHabitTemplates } = requireFromRoot("./services/habit-service.js");
  const {
    listChildHabits,
    addSystemTemplateToChild,
    createCustomHabit,
    updateChildHabit,
    updateChildHabitStatus,
    updateChildHabitPermission,
  } = requireFromRoot("./services/child-habit-service.js");

  setRequestConfig({ useMockApi: true });
  resetMockSession();
  assert.equal((await getBootstrap()).needOnboarding, true);

  const created = await createFamily({ familyName: "小宝之家", childNickname: "小宝" });
  assert.equal(created.family.admin, true);
  assert.equal((await getFamilyInvite(created.family.id)).code, "123456");
  const ownerMembers = await listFamilyMembers(created.family.id);
  assert.equal(ownerMembers.length, 1);
  assert.equal(ownerMembers[0].admin, true);
  assert.equal((await refreshFamilyInvite(created.family.id)).code, "654321");

  const templates = await listHabitTemplates({ category: "HEALTH", keyword: "喝水", sourceType: "SYSTEM" });
  assert.equal(templates.length, 1);
  const childId = created.child.id;
  const addedHabit = await addSystemTemplateToChild(childId, templates[0].id);
  assert.equal(addedHabit.permissionType, "ALL_PARENTS");
  await assert.rejects(() => addSystemTemplateToChild(childId, templates[0].id), /已添加/);
  const updatedHabit = await updateChildHabit(childId, addedHabit.id, {
    name: "每天主动喝水",
    description: "早中晚提醒喝水",
    iconKey: "water_drop",
    imageUrl: "",
  });
  assert.equal(updatedHabit.name, "每天主动喝水");
  assert.equal((await updateChildHabitStatus(childId, addedHabit.id, "disabled")).status, "disabled");
  assert.equal((await updateChildHabitStatus(childId, addedHabit.id, "active")).status, "active");
  const permission = await updateChildHabitPermission(childId, addedHabit.id, {
    permissionType: "SPECIFIC_PARENTS",
    allowedMemberIds: [ownerMembers[0].id],
  });
  assert.equal(permission.permissionType, "SPECIFIC_PARENTS");
  assert.deepEqual(permission.allowedMemberIds, [ownerMembers[0].id]);

  const custom = await createCustomHabit({
    childId,
    name: "练习钢琴",
    description: "每天十分钟",
    category: "LEARNING",
    iconKey: "piano",
  });
  assert.equal(custom.template.sourceType, "CUSTOM");
  assert.equal(custom.childHabit.permissionType, "ALL_PARENTS");
  assert.equal((await listChildHabits(childId)).length, 2);

  resetMockSession();
  const joined = await joinFamily({ inviteCode: "123456" });
  assert.equal(joined.family.admin, false);
  assert.equal(joined.member.admin, false);
  assert.equal((await listFamilyMembers(joined.family.id)).length, 2);
  await assert.rejects(() => refreshFamilyInvite(joined.family.id), /主家长/);
  const memberHabit = await addSystemTemplateToChild(joined.child.id, templates[0].id);
  await assert.rejects(
    () => updateChildHabitPermission(joined.child.id, memberHabit.id, { permissionType: "OWNER_ONLY" }),
    /主家长/,
  );
}

assertNoTextFileBom();
assertAppConfig();

for (const page of requiredPages) {
  assertFile(join(rootDir, page + ".js"));
  assertFile(join(rootDir, page + ".json"));
  assertFile(join(rootDir, page + ".wxml"));
  assertFile(join(rootDir, page + ".wxss"));
  assertCommonJs(join(rootDir, page + ".js"));
  assertNoRawApiUrls(page);
  assertNoWxmlFunctionCalls(page);
  assertWxssCompatibility(page);
}

for (const path of [
  "core/api.js",
  "core/routes.js",
  "utils/request.js",
  "utils/mock-api.js",
  "services/bootstrap-service.js",
  "services/family-service.js",
  "services/habit-service.js",
  "services/child-habit-service.js",
  "services/session-state.js",
]) {
  assertFile(join(rootDir, path));
  assertCommonJs(join(rootDir, path));
}

for (const asset of requiredAssets) {
  assertFile(join(rootDir, asset));
}

assertApiConfiguration();
assertRoutesAndServices();

const contractPath = join(repoDir, "docs/api/miniprogram-onboarding-v1.md");
assertFile(contractPath);
for (const apiPath of requiredApiPaths) {
  assertTextIncludes(contractPath, apiPath);
}

await assertMockFlow();

console.log("miniprogram static validation passed");
