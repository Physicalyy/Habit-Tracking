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
  "GET /api/habit-templates",
];

const requiredAssets = [
  "assets/onboarding/start-family-growth.png",
  "assets/onboarding/create-family-home.png",
  "assets/onboarding/join-family-welcome.png",
  "assets/onboarding/today-empty-sprout.png",
  "assets/fonts/material-symbols-outlined-subset.ttf",
  "assets/fonts/material-symbols-filled-subset.ttf",
  "assets/fonts/material-symbols-outlined-actions-subset.ttf",
  "assets/fonts/material-symbols.wxss",
  "assets/icons/bubble-chart-teal.png",
  "assets/icons/help-outline-dark.png",
  "assets/icons/eco-gold.png",
  "assets/icons/favorite-teal.png",
  "assets/icons/add-home-white.png",
  "assets/icons/group-add-teal.png",
  "assets/icons/bubble-chart-teal.svg",
  "assets/icons/help-outline-dark.svg",
  "assets/icons/eco-gold.svg",
  "assets/icons/favorite-teal.svg",
  "assets/icons/add-home-white.svg",
  "assets/icons/group-add-teal.svg",
];

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

function assertFile(path) {
  assert.ok(existsSync(path), `Missing required file: ${path}`);
}

function collectFiles(dir) {
  const entries = readdirSync(dir);
  const files = [];

  for (const entry of entries) {
    const path = join(dir, entry);
    const stat = statSync(path);

    if (stat.isDirectory()) {
      files.push(...collectFiles(path));
      continue;
    }

    files.push(path);
  }

  return files;
}

function assertNoUtf8Bom(path) {
  const bytes = readFileSync(path);
  assert.ok(
    bytes.length < 3 ||
      bytes[0] !== 0xef ||
      bytes[1] !== 0xbb ||
      bytes[2] !== 0xbf,
    `${path} must be saved as UTF-8 without BOM for WeChat WXSS/WXML compatibility`,
  );
}

function assertNoTextFileBom() {
  const textFilePattern = /\.(js|json|mjs|wxml|wxss)$/;

  for (const path of collectFiles(rootDir)) {
    if (textFilePattern.test(path)) {
      assertNoUtf8Bom(path);
    }
  }
}

function assertJsonFile(path) {
  assertFile(path);
  readJson(path);
}

function assertTextIncludes(path, value) {
  const content = readFileSync(path, "utf8");
  assert.ok(content.includes(value), `${path} must include ${value}`);
}

function assertNoRawApiUrls(pagePath) {
  const jsPath = join(rootDir, pagePath + ".js");
  const source = readFileSync(jsPath, "utf8");
  for (const apiPath of requiredApiPaths) {
    const rawPath = apiPath.replace(/^[A-Z]+ /, "");
    assert.ok(
      !source.includes(rawPath),
      `${jsPath} must not contain raw API path ${rawPath}`,
    );
  }
}

function assertApiConfiguration() {
  const apiSource = readFileSync(join(rootDir, "core/api.js"), "utf8");
  for (const apiPath of requiredApiPaths) {
    const rawPath = apiPath.replace(/^[A-Z]+ /, "");
    const prefix = rawPath.split("{")[0];
    assert.ok(
      apiSource.includes(prefix),
      `core/api.js must define endpoint prefix ${prefix}`,
    );
  }
  assert.ok(
    apiSource.includes("function familyInvite") &&
      apiSource.includes("function refreshFamilyInvite"),
    "core/api.js must expose dynamic invite endpoint builders",
  );

  const requestSource = readFileSync(join(rootDir, "utils/request.js"), "utf8");
  assert.ok(
    !requestSource.includes("const USE_MOCK_API = true"),
    "utils/request.js must not force mock API on by default",
  );
  assert.ok(
    requestSource.includes("setRequestConfig") &&
      requestSource.includes("useMockApi"),
    "utils/request.js must expose explicit request configuration",
  );
  assert.ok(
    requestSource.includes('"X-Test-Openid"') &&
      requestSource.includes('"X-Test-Nickname"'),
    "utils/request.js must support development test identity headers",
  );

  const familyServiceSource = readFileSync(join(rootDir, "services/family-service.js"), "utf8");
  assert.ok(
    familyServiceSource.includes("getFamilyInvite") &&
      familyServiceSource.includes("refreshFamilyInvite"),
    "family-service.js must expose invite query and refresh functions",
  );

  const habitServiceSource = readFileSync(join(rootDir, "services/habit-service.js"), "utf8");
  assert.ok(
    habitServiceSource.includes("listHabitTemplates") &&
      habitServiceSource.includes("API_ENDPOINTS.HABIT_TEMPLATES"),
    "habit-service.js must expose listHabitTemplates through centralized API endpoints",
  );
}

function assertHabitLibraryStructure() {
  const routesSource = readFileSync(join(rootDir, "core/routes.js"), "utf8");
  assert.ok(
    routesSource.includes("HABIT_LIBRARY") &&
      routesSource.includes("/pages/habit-library/index"),
    "core/routes.js must define HABIT_LIBRARY",
  );

  const meSource = readFileSync(join(rootDir, "pages/me/index.js"), "utf8");
  assert.ok(
    meSource.includes("ROUTES.HABIT_LIBRARY") &&
      meSource.includes("goHabitLibrary"),
    "me page must navigate to habit library through route constants",
  );

  const libraryJsPath = join(rootDir, "pages/habit-library/index.js");
  const libraryJs = readFileSync(libraryJsPath, "utf8");
  for (const token of [
    "listHabitTemplates",
    "categories",
    "selectedCategory",
    "searchKeyword",
    "onCategoryTap",
    "onSearchInput",
    "onAddTap",
  ]) {
    assertTextIncludes(libraryJsPath, token);
  }
  assert.ok(
    !libraryJs.includes("/api/habit-templates"),
    "habit library page must not contain raw habit template API path",
  );

  const libraryWxmlPath = join(rootDir, "pages/habit-library/index.wxml");
  for (const token of [
    "habit-library-page",
    "search-input",
    "category-scroll",
    "template-card",
    "template-icon",
    "template-name",
    "template-desc",
    "template-age",
    "add-template",
  ]) {
    assertTextIncludes(libraryWxmlPath, token);
  }
}

function assertCommonJsRuntimeModule(path) {
  const source = readFileSync(path, "utf8");
  assert.ok(
    !/^\s*import\s/m.test(source) && !/^\s*export\s/m.test(source),
    `${path} must use CommonJS for native miniprogram runtime compatibility`,
  );
}

function assertNoWxmlFunctionCalls(pagePath) {
  const wxmlPath = join(rootDir, pagePath + ".wxml");
  const source = readFileSync(wxmlPath, "utf8");
  assert.ok(
    !/\{\{[^}]*\([^}]*\)[^}]*\}\}/.test(source),
    `${wxmlPath} must not use function calls inside WXML bindings`,
  );
}

function assertWxssCompatibility(pagePath) {
  const wxssPath = join(rootDir, pagePath + ".wxss");
  const source = readFileSync(wxssPath, "utf8");
  assert.ok(
    !source.includes("gap:"),
    `${wxssPath} must avoid gap for miniprogram compatibility`,
  );
  assert.ok(
    !source.includes("::before") && !source.includes("::after"),
    `${wxssPath} must avoid pseudo-elements for miniprogram compatibility`,
  );
}

function assertNoLocalFontPathInWxss(path) {
  const source = readFileSync(path, "utf8");
  assert.ok(
    !/@font-face[\s\S]*url\(['"]?\/assets\//.test(source),
    `${path} must not load local font files through WXSS @font-face; use a data URL font source instead`,
  );
}

function assertNoRuntimeFontLoading(path) {
  const source = readFileSync(path, "utf8");
  assert.ok(
    !source.includes("wx.loadFontFace"),
    `${path} must not call wx.loadFontFace for start-page icons; use WXSS @font-face data URL instead`,
  );
}

function assertStartPrototypeStructure() {
  const startJsonPath = join(rootDir, "pages/start/index.json");
  const startWxmlPath = join(rootDir, "pages/start/index.wxml");
  const startWxssPath = join(rootDir, "pages/start/index.wxss");
  const appWxssPath = join(rootDir, "app.wxss");

  assertTextIncludes(startJsonPath, "\"navigationStyle\": \"custom\"");
  assertTextIncludes(appWxssPath, '@import "/assets/fonts/material-symbols.wxss";');
  assertTextIncludes(
    join(rootDir, "assets/fonts/material-symbols.wxss"),
    "data:font/truetype;charset=utf-8;base64,",
  );
  assertTextIncludes(
    join(rootDir, "assets/fonts/material-symbols.wxss"),
    ".material-symbols-outlined",
  );
  assertTextIncludes(
    join(rootDir, "assets/fonts/material-symbols.wxss"),
    ".material-symbols-filled",
  );
  assertTextIncludes(join(rootDir, "pages/start/index.js"), 'bubbleChart: "\\ue6dd"');
  assertTextIncludes(join(rootDir, "pages/start/index.js"), 'addHome: "\\uf8eb"');
  assertTextIncludes(
    join(rootDir, "pages/start/index.js"),
    'const { getBootstrap } = require("../../services/bootstrap-service.js");',
  );
  assertTextIncludes(join(rootDir, "pages/start/index.js"), "await getBootstrap()");
  assertTextIncludes(join(rootDir, "pages/start/index.js"), "wx.switchTab({ url: ROUTES.TODAY })");

  for (const token of [
    "brand-bar",
    "brand-name",
    "hero-blob primary-blob",
    "hero-blob secondary-blob",
    "float-animation",
    "/assets/onboarding/start-family-growth.png",
    "floating-chip growth-chip",
    "floating-chip love-chip",
    "material-symbols-filled brand-symbol",
    "/assets/icons/eco-gold.png",
    "/assets/icons/favorite-teal.png",
    "material-symbols-outlined button-icon",
    "{{icons.bubbleChart}}",
    "{{icons.addHome}}",
    "{{icons.groupAdd}}",
  ]) {
    assertTextIncludes(startWxmlPath, token);
  }

  const startWxml = readFileSync(startWxmlPath, "utf8");
  for (const token of [
    "social-proof",
    "proof-stack",
    "proof-avatar",
    "proof-overlap",
    "proof-text",
    "footer-note",
    "/assets/onboarding/proof-parent-1.png",
    "/assets/onboarding/proof-parent-2.png",
    "/assets/onboarding/proof-parent-3.png",
    "10,000+",
    "2024",
    "create-button-icon",
  ]) {
    assert.ok(
      !startWxml.includes(token),
      `${startWxmlPath} must not render removed start-page footer/proof token ${token}`,
    );
  }

  assert.ok(
    !startWxml.includes("<button"),
    `${startWxmlPath} must avoid native button default styling on prototype-critical controls`,
  );
  for (const token of [
    "brand-node",
    "home-roof",
    "group-head",
    "chip-glyph leaf-icon",
    "chip-glyph heart-icon",
    "/assets/icons/bubble-chart-teal.png",
    "/assets/icons/add-home-white.png",
    "/assets/icons/group-add-teal.png",
    ">bubble_chart<",
    ">help_outline<",
    ">eco<",
    ">favorite<",
    ">add_home<",
    ">group_add<",
    "&#xe6dd;",
    "&#xe8fd;",
    "&#xea35;",
    "&#xe87e;",
    "&#xf8eb;",
    "&#xe7f0;",
  ]) {
    assert.ok(
      !startWxml.includes(token),
      `${startWxmlPath} must use local Material Symbols instead of handmade icon node ${token}`,
    );
  }

  for (const token of [
    "justify-content: flex-start",
    "height: 176rpx",
    "padding: 88rpx 176rpx 0 40rpx",
    "width: 300rpx",
    "font-size: 32rpx",
    "font-size: 54rpx",
    "margin-bottom: 74rpx",
    "font-size: 34rpx",
    "font-size: 44rpx",
    "white-space: nowrap",
    "width: 100%",
    "max-width: 640rpx",
    "height: 540rpx",
    "padding-top: 200rpx",
    "animation: start-float 6s ease-in-out infinite",
    "rotate(12deg)",
    "translateY(-30rpx)",
    "filter: blur(48rpx)",
    "safe-area-inset-bottom",
  ]) {
    assertTextIncludes(startWxssPath, token);
  }

  const startWxss = readFileSync(startWxssPath, "utf8");
  for (const token of ["create-button-icon", "create-icon-sway"]) {
    assert.ok(
      !startWxss.includes(token),
      `${startWxssPath} must not animate the create-family button icon with ${token}`,
    );
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
  } = requireFromRoot("./services/family-service.js");
  const { listHabitTemplates } = requireFromRoot("./services/habit-service.js");

  setRequestConfig({ useMockApi: true });
  resetMockSession();
  const emptyBootstrap = await getBootstrap();
  assert.equal(emptyBootstrap.needOnboarding, true);
  assert.equal(emptyBootstrap.defaultFamily, null);
  assert.equal(emptyBootstrap.defaultChild, null);

  const created = await createFamily({
    familyName: "小宝之家",
    childNickname: "小宝",
  });
  assert.equal(created.family.name, "小宝之家");
  assert.equal(created.child.nickname, "小宝");
  assert.equal(created.inviteCode.code, "123456");
  assert.equal((await getFamilyInvite(created.family.id)).code, "123456");
  assert.equal((await refreshFamilyInvite(created.family.id)).code, "654321");

  const createdBootstrap = await getBootstrap();
  assert.equal(createdBootstrap.needOnboarding, false);
  assert.equal(createdBootstrap.defaultFamily.name, "小宝之家");
  assert.equal(createdBootstrap.defaultChild.nickname, "小宝");

  resetMockSession();
  const joined = await joinFamily({ inviteCode: "123456" });
  assert.equal(joined.family.name, "阳光家庭");
  assert.equal(joined.family.admin, false);
  assert.equal(joined.member.admin, false);
  assert.equal((await getBootstrap()).needOnboarding, false);

  const healthTemplates = await listHabitTemplates({
    category: "HEALTH",
    keyword: "喝水",
    sourceType: "SYSTEM",
  });
  assert.equal(healthTemplates.length, 1);
  assert.equal(healthTemplates[0].slug, "drink-water");
  assert.equal(healthTemplates[0].iconKey, "water_drop");
}

const appJsonPath = join(rootDir, "app.json");
const projectConfigPath = join(rootDir, "project.config.json");
assertNoTextFileBom();
assertJsonFile(appJsonPath);
assertJsonFile(projectConfigPath);
const appConfig = readJson(appJsonPath);
const projectConfig = readJson(projectConfigPath);
assert.equal(
  projectConfig.libVersion,
  "3.14.3",
  "project.config.json must pin libVersion to 3.14.3 during miniprogram prototype work",
);
assert.deepEqual(appConfig.pages, requiredPages);
assert.deepEqual(
  appConfig.tabBar.list.map((item) => item.pagePath),
  tabPages,
);

for (const page of requiredPages) {
  assertFile(join(rootDir, page + ".js"));
  assertCommonJsRuntimeModule(join(rootDir, page + ".js"));
  assertJsonFile(join(rootDir, page + ".json"));
  assertFile(join(rootDir, page + ".wxml"));
  assertFile(join(rootDir, page + ".wxss"));
  assertNoRawApiUrls(page);
  assertNoWxmlFunctionCalls(page);
  assertWxssCompatibility(page);
}

assertFile(join(rootDir, "core/api.js"));
assertCommonJsRuntimeModule(join(rootDir, "core/api.js"));
assertApiConfiguration();
assertFile(join(rootDir, "core/routes.js"));
assertCommonJsRuntimeModule(join(rootDir, "core/routes.js"));
assertFile(join(rootDir, "utils/request.js"));
assertCommonJsRuntimeModule(join(rootDir, "utils/request.js"));
assertFile(join(rootDir, "utils/mock-api.js"));
assertCommonJsRuntimeModule(join(rootDir, "utils/mock-api.js"));
assertFile(join(rootDir, "services/bootstrap-service.js"));
assertCommonJsRuntimeModule(join(rootDir, "services/bootstrap-service.js"));
assertFile(join(rootDir, "services/family-service.js"));
assertCommonJsRuntimeModule(join(rootDir, "services/family-service.js"));
assertFile(join(rootDir, "services/habit-service.js"));
assertCommonJsRuntimeModule(join(rootDir, "services/habit-service.js"));
assertFile(join(rootDir, "services/session-state.js"));
assertCommonJsRuntimeModule(join(rootDir, "services/session-state.js"));

for (const asset of requiredAssets) {
  assertFile(join(rootDir, asset));
}

assertNoLocalFontPathInWxss(join(rootDir, "app.wxss"));
assertNoRuntimeFontLoading(join(rootDir, "app.js"));
for (const page of requiredPages) {
  assertNoLocalFontPathInWxss(join(rootDir, page + ".wxss"));
  assertNoRuntimeFontLoading(join(rootDir, page + ".js"));
}

assertTextIncludes(
  join(rootDir, "pages/start/index.wxml"),
  "/assets/onboarding/start-family-growth.png",
);
assertTextIncludes(
  join(rootDir, "pages/create-family/index.wxml"),
  "/assets/onboarding/create-family-home.png",
);
assertTextIncludes(
  join(rootDir, "pages/join-family/index.wxml"),
  "/assets/onboarding/join-family-welcome.png",
);
assertTextIncludes(
  join(rootDir, "pages/today/index.wxml"),
  "/assets/onboarding/today-empty-sprout.png",
);
assertStartPrototypeStructure();
assertHabitLibraryStructure();

const contractPath = join(repoDir, "docs/api/miniprogram-onboarding-v1.md");
assertFile(contractPath);
for (const apiPath of requiredApiPaths) {
  assertTextIncludes(contractPath, apiPath);
}

await assertMockFlow();

console.log("miniprogram static validation passed");
