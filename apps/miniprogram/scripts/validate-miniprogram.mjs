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

const tabPageSelections = [
  ["pages/today/index", 0],
  ["pages/records/index", 1],
  ["pages/me/index", 2],
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
  "GET /api/children/{childId}/today",
  "POST /api/children/{childId}/habits/{childHabitId}/checkins",
  "GET /api/children/{childId}/checkins",
  "GET /api/children/{childId}/checkins/summary",
  "POST /api/habit-templates/custom",
];

const requiredAssets = [
  "assets/onboarding/start-family-growth.png",
  "assets/onboarding/create-family-home.png",
  "assets/onboarding/join-family-welcome.png",
  "assets/onboarding/today-empty-sprout.png",
  "assets/fonts/material-symbols.wxss",
  "assets/fonts/material-symbols-outlined-habit-library-subset.ttf",
  "assets/icons/bubble-chart-teal.png",
  "assets/icons/help-outline-dark.png",
  "assets/icons/eco-gold.png",
  "assets/icons/favorite-teal.png",
  "assets/icons/add-home-white.png",
  "assets/icons/group-add-teal.png",
];

const systemHabitSlugs = [
  "brush-teeth",
  "wash-hands",
  "drink-water",
  "sleep-on-time",
  "make-bed",
  "clean-up-toys",
  "organize-desk",
  "prepare-schoolbag",
  "read-books",
  "finish-homework",
  "review-lesson",
  "practice-writing",
  "jump-rope",
  "outdoor-activity",
  "eye-exercises",
  "morning-run",
  "say-thanks",
  "share-feelings",
  "help-others",
  "deep-breathing",
  "watch-traffic",
  "stranger-danger",
  "know-phone",
  "no-outlets",
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

function fontHasCodepoint(path, codepoint) {
  const bytes = readFileSync(path);
  const uint16 = (offset) => bytes.readUInt16BE(offset);
  const uint32 = (offset) => bytes.readUInt32BE(offset);
  const tableCount = uint16(4);
  let cmapOffset = -1;
  for (let index = 0; index < tableCount; index += 1) {
    const offset = 12 + index * 16;
    if (bytes.toString("latin1", offset, offset + 4) === "cmap") {
      cmapOffset = uint32(offset + 8);
      break;
    }
  }
  assert.ok(cmapOffset >= 0, `${path} must include a cmap table`);
  const encodingCount = uint16(cmapOffset + 2);
  for (let index = 0; index < encodingCount; index += 1) {
    const recordOffset = cmapOffset + 4 + index * 8;
    const subtableOffset = cmapOffset + uint32(recordOffset + 4);
    const format = uint16(subtableOffset);
    if (format === 4) {
      const segmentCount = uint16(subtableOffset + 6) / 2;
      const endCodeOffset = subtableOffset + 14;
      const startCodeOffset = endCodeOffset + 2 + segmentCount * 2;
      for (let segment = 0; segment < segmentCount; segment += 1) {
        const endCode = uint16(endCodeOffset + segment * 2);
        const startCode = uint16(startCodeOffset + segment * 2);
        if (startCode <= codepoint && codepoint <= endCode) {
          return true;
        }
      }
    }
    if (format === 12) {
      const groupCount = uint32(subtableOffset + 12);
      const groupOffset = subtableOffset + 16;
      for (let group = 0; group < groupCount; group += 1) {
        const startCode = uint32(groupOffset + group * 12);
        const endCode = uint32(groupOffset + group * 12 + 4);
        if (startCode <= codepoint && codepoint <= endCode) {
          return true;
        }
      }
    }
  }
  return false;
}

function assertCommonJs(path) {
  const source = readFileSync(path, "utf8");
  assert.ok(!/^\s*import\s/m.test(source) && !/^\s*export\s/m.test(source), `${path} must use CommonJS`);
}

function assertNoWxmlFunctionCalls(pagePath) {
  const source = readFileSync(join(rootDir, pagePath + ".wxml"), "utf8");
  assert.ok(!/\{\{[^}]*\([^}]*\)[^}]*\}\}/.test(source), `${pagePath}.wxml must not use function calls`);
  assert.ok(!/\{\{[^}]*\.length\s*[=!<>]/.test(source), `${pagePath}.wxml must not compare array length`);
  assert.ok(!/\{\{[^}]*\?[^}]*:/.test(source), `${pagePath}.wxml must use JS-derived fields instead of ternary bindings`);
  assert.ok(
    !/\{\{[^}]*(?:===|!==|==|!=|&&|\|\|)[^}]*\}\}/.test(source),
    `${pagePath}.wxml must use JS-derived fields instead of comparison/logical bindings`,
  );
}

function assertWxssCompatibility(pagePath) {
  const source = readFileSync(join(rootDir, pagePath + ".wxss"), "utf8");
  assert.ok(!source.includes("gap:"), `${pagePath}.wxss must avoid gap`);
  assert.ok(!source.includes("::before") && !source.includes("::after"), `${pagePath}.wxss must avoid pseudo-elements`);
  assert.ok(!source.includes("fit-content"), `${pagePath}.wxss must avoid fit-content`);
  assert.ok(!/display:\s*grid/.test(source), `${pagePath}.wxss must avoid CSS grid`);
  assert.ok(!/filter:\s*/.test(source), `${pagePath}.wxss must avoid CSS filter effects`);
}

function assertFixedActionSafeArea(pagePath) {
  const wxmlSource = readFileSync(join(rootDir, pagePath + ".wxml"), "utf8");
  if (!wxmlSource.includes("fixed-action")) {
    return;
  }

  assert.ok(
    wxmlSource.includes("fixed-action-spacer"),
    `${pagePath}.wxml must include fixed-action-spacer before fixed bottom actions`,
  );
}

function assertTodayEmptyPrototypeGuard() {
  const wxmlSource = readFileSync(join(rootDir, "pages/today/index.wxml"), "utf8");
  const wxssSource = readFileSync(join(rootDir, "pages/today/index.wxss"), "utf8");

  for (const token of [
    "arrowBack",
    "moreHoriz",
    "addCircle",
    "\\ue5e0",
    "\\ue5d3",
    "\\ue147",
  ]) {
    assertTextIncludes(join(rootDir, "pages/today/index.js"), token);
  }

  for (const token of [
    "empty-visual",
    "floating-anim",
    "empty-orbit",
    "empty-orbit-inner",
    "empty-image-shell",
    "empty-action-icon",
    "today-empty-sprout.png",
  ]) {
    assert.ok(
      wxmlSource.includes(token) || wxssSource.includes(token),
      `today empty state must preserve prototype visual token: ${token}`,
    );
  }

  assert.ok(/\.empty-visual\s*\{[\s\S]*width:\s*512rpx;[\s\S]*height:\s*512rpx;/.test(wxssSource), "today empty visual must use prototype 512rpx square stage");
  assert.ok(wxmlSource.includes('class="empty-visual floating-anim"'), "today empty visual must use the prototype floating-anim class");
  assert.ok(/\.floating-anim\s*\{[\s\S]*animation:\s*floating 3s ease-in-out infinite;/.test(wxssSource), "today empty visual must use prototype floating animation class");
  assert.ok(/\.empty-orbit\s*\{[\s\S]*border-radius:\s*999rpx;/.test(wxssSource), "today empty state must include rounded outer orbit");
  assert.ok(/\.empty-orbit-inner\s*\{[\s\S]*border-radius:\s*999rpx;/.test(wxssSource), "today empty state must include rounded inner orbit");
  assert.ok(/\.empty-orbit\s*\{[\s\S]*transform:\s*translate\(-50%, -50%\) scale\(1\.1\);/.test(wxssSource), "today empty outer orbit must preserve the prototype scale-110 layer");
  assert.ok(/\.empty-orbit-inner\s*\{[\s\S]*transform:\s*translate\(-50%, -50%\) scale\(0\.75\);/.test(wxssSource), "today empty inner orbit must preserve the prototype scale-75 layer");
  assert.ok(/\.empty-image-shell\s*\{[\s\S]*width:\s*384rpx;[\s\S]*height:\s*384rpx;[\s\S]*border-radius:\s*999rpx;/.test(wxssSource), "today empty image must sit in a 384rpx circular shell");
  assert.ok(!/\.empty-image\s*\{[\s\S]*width:\s*100%;[\s\S]*height:\s*100%;/.test(wxssSource), "today empty image must not fill the whole square stage");
  assert.ok(/\.empty-action\s*\{[\s\S]*width:\s*calc\(100% - 48rpx\);[\s\S]*max-width:\s*640rpx;[\s\S]*height:\s*112rpx;/.test(wxssSource), "today empty action must match prototype full-width button proportions");
  assert.ok(wxssSource.includes("@keyframes floating"), "today empty state must define prototype floating animation");
  assert.ok(wxssSource.includes("animation: floating 3s ease-in-out infinite"), "today empty visual must use prototype floating animation");
  assert.ok(wxssSource.includes("@keyframes empty-pulse"), "today empty state must define inner orbit pulse animation");
  assert.ok(wxmlSource.includes('class="material-symbols-outlined empty-action-icon"'), "today empty action must render the prototype add_circle Material Symbol before text");
  assert.ok(wxssSource.includes(".empty-action-icon"), "today empty action must style the add_circle icon");
}

function assertHabitLibraryPrototypeGuard() {
  const pageConfig = readJson(join(rootDir, "pages/habit-library/index.json"));
  const jsSource = readFileSync(join(rootDir, "pages/habit-library/index.js"), "utf8");
  const wxmlSource = readFileSync(join(rootDir, "pages/habit-library/index.wxml"), "utf8");
  const wxssSource = readFileSync(join(rootDir, "pages/habit-library/index.wxss"), "utf8");
  const fontSource = readFileSync(join(rootDir, "assets/fonts/material-symbols.wxss"), "utf8");
  const mockSource = readFileSync(join(rootDir, "utils/mock-api.js"), "utf8");
  const expectedCategoryKeys = ["HEALTH", "LIFE_SKILLS", "LEARNING", "SPORTS", "SOCIAL_EMOTION", "SAFETY"];
  const unsupportedCategoryKeys = ["INTEREST", "CHARACTER", "EMOTION", "MONEY", "CUSTOM"];
  const seedIconKeys = [
    "dentistry",
    "soap",
    "water_drop",
    "bedtime",
    "bed",
    "toys",
    "desk",
    "backpack",
    "menu_book",
    "assignment",
    "history_edu",
    "draw",
    "sports_gymnastics",
    "nature_people",
    "visibility",
    "directions_run",
    "volunteer_activism",
    "chat",
    "groups",
    "self_improvement",
    "traffic",
    "shield",
    "phone",
    "power_off",
  ];

  assert.equal(pageConfig.navigationStyle, "custom", "habit-library must use custom navigation to match prototype header");
  assert.ok(!Object.hasOwn(pageConfig, "navigationBarTitleText"), "habit-library must not render a duplicate native title");

  for (const token of [
    "library-header",
    "library-title",
    "search-wrap",
    "search-icon",
    "category-scroll",
    "template-grid",
    "library-template-card",
    "template-icon-shell",
    "template-add-button",
    "custom-cta",
    "custom-button",
  ]) {
    assert.ok(
      wxmlSource.includes(token) || wxssSource.includes(token),
      `habit-library must preserve prototype visual token: ${token}`,
    );
  }

  for (const token of [
    "全部",
    "健康卫生",
    "生活自理",
    "学习成长",
    "运动锻炼",
    "社交情绪",
    "安全教育",
    "创建自定义习惯",
  ]) {
    assert.ok(wxmlSource.includes(token) || jsSource.includes(token), `habit-library must include prototype copy: ${token}`);
  }

  for (const categoryKey of expectedCategoryKeys) {
    assert.ok(jsSource.includes(`key: "${categoryKey}"`), `habit-library must expose DB-backed category ${categoryKey}`);
  }
  for (const categoryKey of unsupportedCategoryKeys) {
    assert.ok(!jsSource.includes(`key: "${categoryKey}"`), `habit-library must not hard-code unsupported prototype category ${categoryKey}`);
  }
  assert.ok(!jsSource.includes('selectedCategory === "CUSTOM"'), "habit-library must not use CUSTOM as a category filter");
  assert.ok(jsSource.includes("hasFamily"), "habit-library must track family state for secondary actions");
  assert.ok(jsSource.includes('wx.showToast({ title: "请先加入家庭", icon: "none" })'), "habit-library custom habit entry must block users without family");
  assert.ok(jsSource.includes('sourceType: "SYSTEM"'), "habit-library must query system templates from the backend seed");
  assert.ok(jsSource.includes("listHabitTemplates"), "habit-library must load templates through the service layer");
  assert.ok(jsSource.includes("listChildHabits"), "habit-library must load child habits to initialize already-added template state");
  assert.ok(
    /await listChildHabits\(bootstrap\.defaultChild\.id\)[\s\S]*templateId/.test(jsSource),
    "habit-library must derive addedTemplateIds from existing child habits on page load",
  );
  assert.ok(
    /try\s*\{[\s\S]*await listChildHabits\(bootstrap\.defaultChild\.id\)[\s\S]*\}\s*catch\s*\(error\)\s*\{[\s\S]*addedTemplateIds\s*=\s*\[\]/.test(jsSource),
    "habit-library must not block template loading when existing child habits fail to load",
  );
  assert.ok(jsSource.includes("normalizeAssetPath"), "habit-library must normalize backend/local habit image paths before rendering");
  assert.ok(jsSource.includes("loadRequestSeq"), "habit-library must guard against stale search/category request results");
  assert.ok(jsSource.includes("requestSeq !== this.data.loadRequestSeq"), "habit-library must ignore out-of-order template responses");
  assert.ok(
    /if\s*\(\s*this\.data\.addingSlug\s*\)\s*\{\s*return;\s*\}\s*if\s*\(\s*!this\.data\.childId\s*\)/.test(jsSource),
    "habit-library must silently ignore repeated add taps before showing family-state errors",
  );
  assert.ok(jsSource.includes("addedTemplateIds"), "habit-library must track added templates in page state after a successful add");
  assert.ok(
    /await addSystemTemplateToChild[\s\S]*addedTemplateIds:[\s\S]*String\(templateId\)/.test(jsSource),
    "habit-library must persist successfully added template ids before restoring add button state",
  );
  assert.ok(
    /toTemplateCard\(template, index, this\.data\.addingSlug, this\.data\.addedTemplateIds\)/.test(jsSource),
    "habit-library card state must derive from addedTemplateIds",
  );
  assert.ok(jsSource.includes("const added = addedTemplateIds.includes(String(template.id))"), "habit-library card state must derive added state from template ids");
  assert.ok(jsSource.includes("added,"), "habit-library card state must expose already-added templates");
  assert.ok(jsSource.includes('addClass: added ? "template-add-button template-add-button-added"'), "habit-library must derive added button class");
  assert.ok(wxmlSource.includes('class="{{item.addClass}}"'), "habit-library add button must use JS-derived added/adding class");
  assert.ok(jsSource.includes("className:"), "habit-library category active style must be derived in JS");
  assert.ok(jsSource.includes("addIcon:"), "habit-library add button icon state must be derived in JS");
  assert.ok(jsSource.includes("addText:"), "habit-library add button text state must be derived in JS");
  assert.ok(jsSource.includes("ageText"), "habit-library cards must render age ranges from backend data");
  assert.ok(jsSource.includes("shortDescription"), "habit-library cards must derive compact API descriptions for prototype card density");
  assert.ok(wxmlSource.includes("{{item.name}}"), "habit-library card names must come from API data");
  assert.ok(wxmlSource.includes("{{item.shortDescription}}"), "habit-library card descriptions must render compact API-derived text");
  assert.ok(wxmlSource.includes("{{item.ageText}}"), "habit-library card age badges must come from API data");
  for (const removedToken of ["幼儿精选", "kids-section", "featuredCards", "featured-card", "showAllTemplates"]) {
    assert.ok(!wxmlSource.includes(removedToken), `habit-library must not render removed featured section token ${removedToken}`);
    assert.ok(!jsSource.includes(removedToken), `habit-library must not keep removed featured section logic ${removedToken}`);
    assert.ok(!wxssSource.includes(removedToken), `habit-library must not keep removed featured section style ${removedToken}`);
  }
  assert.ok(
    wxmlSource.includes('<image wx:if="{{item.imageUrl}}" class="template-image"'),
    "habit-library main cards must render API imageUrl before falling back to icons",
  );
  assert.ok(wxssSource.includes(".template-image"), "habit-library main card images must have dedicated styling");
  assert.ok(!jsSource.includes("帮助孩子建立稳定、可坚持的成长习惯"), "habit-library must not inject generic fake card descriptions");
  assert.ok(!jsSource.includes("培养早期生活能力"), "habit-library must not inject fake featured descriptions");
  for (const iconKey of seedIconKeys) {
    assert.ok(jsSource.includes(`${iconKey}:`), `habit-library must map seeded icon key ${iconKey}`);
  }
  for (const slug of systemHabitSlugs) {
    const imagePath = `/assets/habits/${slug}.png`;
    assertFile(join(rootDir, `assets/habits/${slug}.png`));
  }
  for (const imagePath of [
    "/assets/habits/drink-water.png",
    "/assets/habits/brush-teeth.png",
    "/assets/habits/read-books.png",
    "/assets/habits/prepare-schoolbag.png",
    "/assets/habits/jump-rope.png",
    "/assets/habits/watch-traffic.png",
  ]) {
    assert.ok(mockSource.includes(imagePath), `mock habit templates must include image ${imagePath}`);
  }
  for (const missingCodepoint of ["\\uef86", "\\uefdf", "\\ue85d", "\\ue8f4", "\\ue0b7", "\\ue7ef", "\\ue565", "\\ue9e0", "\\ue0cd", "\\ue646"]) {
    assert.ok(
      !jsSource.includes(missingCodepoint),
      `habit-library must not use uncovered local-font icon codepoint ${missingCodepoint}`,
    );
  }

  for (const token of [
    "arrowBack: \"\\ue5c4\"",
    "search: \"\\ue8b6\"",
    "add: \"\\ue145\"",
    "check: \"\\ue5ca\"",
    "goCustomHabit",
    "ROUTES.CUSTOM_HABIT",
    "templateCards",
  ]) {
    assert.ok(jsSource.includes(token), `habit-library/index.js must include ${token}`);
  }

  assert.ok(wxmlSource.includes('class="material-symbols-outlined search-icon"'), "habit-library search field must render Material search icon");
  assert.ok(wxmlSource.includes('class="material-symbols-outlined add-icon"'), "habit-library add buttons must render prototype add/check icon before text");
  assert.ok(/\.template-grid\s*\{[\s\S]*display:\s*flex;[\s\S]*flex-wrap:\s*wrap;/.test(wxssSource), "habit-library must use a two-column wrapping grid");
  assert.ok(/\.library-template-card\s*\{[\s\S]*width:\s*48\.2%;[\s\S]*border-left:\s*8rpx solid #76d6bc;/.test(wxssSource), "habit-library cards must match prototype two-column card proportions and accent border");
  assert.ok(wxssSource.includes("background: #ff9d4d"), "habit-library active category must use prototype orange pill");
  assert.ok(wxssSource.includes("border: 4rpx dashed #76d6bc"), "habit-library custom CTA must use prototype dashed primary-container border");
  assert.ok(!wxssSource.includes("gap:"), "habit-library must avoid WXSS gap");
  assert.ok(fontSource.includes("Material Symbols Outlined Local"), "habit-library icons must use the local Material Symbols family");
  assert.ok(
    (fontSource.match(/data:font\/truetype;charset=utf-8;base64,/g) || []).length >= 3,
    "habit-library Material Symbols subset must be embedded as a local data URL",
  );
}

function assertCustomTabBarPrototypeGuard() {
  const appConfig = readJson(join(rootDir, "app.json"));
  assert.equal(appConfig.tabBar.custom, true, "app.json tabBar must use custom tabbar for prototype bottom navigation");

  for (const pagePath of tabPages) {
    const pageConfig = readJson(join(rootDir, pagePath + ".json"));
    assert.equal(pageConfig.navigationStyle, "custom", `${pagePath}.json must use custom navigation to avoid duplicate native title`);
    assert.ok(!Object.hasOwn(pageConfig, "navigationBarTitleText"), `${pagePath}.json must not render a duplicate native title`);
  }

  for (const path of [
    "custom-tab-bar/index.js",
    "custom-tab-bar/index.json",
    "custom-tab-bar/index.wxml",
    "custom-tab-bar/index.wxss",
  ]) {
    assertFile(join(rootDir, path));
  }
  assertCommonJs(join(rootDir, "custom-tab-bar/index.js"));

  const tabJs = readFileSync(join(rootDir, "custom-tab-bar/index.js"), "utf8");
  const tabWxml = readFileSync(join(rootDir, "custom-tab-bar/index.wxml"), "utf8");
  const tabWxss = readFileSync(join(rootDir, "custom-tab-bar/index.wxss"), "utf8");
  for (const token of [
    "Component(",
    "selected",
    "observers",
    "buildList(0)",
    "className",
    "Number(event.currentTarget.dataset.index)",
    "switchTab",
    "ROUTES.TODAY",
    "ROUTES.RECORDS",
    "ROUTES.ME",
    "\\ue8df",
    "\\uea3e",
    "\\ue7fd",
    "今日",
    "记录",
    "我的",
  ]) {
    assert.ok(tabJs.includes(token), `custom-tab-bar/index.js must include ${token}`);
  }
  for (const token of [
    "custom-tab-bar",
    "material-symbols-outlined",
  ]) {
    assert.ok(tabWxml.includes(token), `custom-tab-bar/index.wxml must include ${token}`);
  }
  assert.ok(tabJs.includes("tab-item tab-item-active"), "custom-tab-bar JS must derive active item class");
  assert.ok(tabJs.includes("list: buildList(0)"), "custom-tab-bar must initialize active class before page onShow sync");
  assert.ok(tabJs.includes("Number(event.currentTarget.dataset.index)"), "custom-tab-bar must normalize dataset index before comparing selected state");
  assert.ok(tabWxss.includes(".tab-item-active"), "custom-tab-bar WXSS must keep active item style");
  assert.ok(!/\{\{[^}]*\?[^}]*:/.test(tabWxml), "custom-tab-bar WXML must use JS-derived active class");
  for (const token of [
    '@import "/assets/fonts/material-symbols.wxss"',
    ".custom-tab-bar",
    ".tab-item-active",
    "border-radius: 32rpx 32rpx 0 0",
    "border-radius: 999rpx",
    "box-shadow: 0 -8rpx 30rpx rgba(0, 107, 88, 0.05)",
    "env(safe-area-inset-bottom)",
  ]) {
    assert.ok(tabWxss.includes(token), `custom-tab-bar/index.wxss must include ${token}`);
  }

  for (const [pagePath, selectedIndex] of tabPageSelections) {
    const source = readFileSync(join(rootDir, pagePath + ".js"), "utf8");
    assert.ok(source.includes("syncCustomTabBar"), `${pagePath}.js must sync custom tabbar selected state`);
    assert.ok(source.includes(`syncCustomTabBar(this, ${selectedIndex})`), `${pagePath}.js must select tab ${selectedIndex}`);
  }
}

function assertAssetPathNormalization() {
  const { normalizeAssetPath } = requireFromRoot("./utils/asset-path.js");
  assert.equal(normalizeAssetPath("/assets/habits/drink-water.png"), "/assets/habits/drink-water.png");
  assert.equal(normalizeAssetPath("assets/habits/drink-water.png"), "/assets/habits/drink-water.png");
  assert.equal(normalizeAssetPath("https://example.com/a.png"), "https://example.com/a.png");
  assert.equal(normalizeAssetPath("//example.com/a.png"), "//example.com/a.png");
  assert.equal(normalizeAssetPath("data:image/png;base64,abc"), "data:image/png;base64,abc");
  assert.equal(normalizeAssetPath(""), "");
}

function assertLoadStartClearsStalePageState() {
  const checks = [
    [
      "today",
      "pages/today/index.js",
      /loadToday\(\)\s*\{[\s\S]*this\.setData\(\{[\s\S]*todayHabits:\s*\[\][\s\S]*completedCount:\s*0[\s\S]*progressPercent:\s*0[\s\S]*progressText:\s*"0%"[\s\S]*checkingHabitId:\s*""/,
      "today loadToday must clear stale habit cards, progress, and in-flight state before fetching",
    ],
    [
      "records",
      "pages/records/index.js",
      /loadRecords\(\)\s*\{[\s\S]*this\.setData\(\{[\s\S]*totalCheckinDays:\s*0[\s\S]*totalCheckinCount:\s*0[\s\S]*historyGroups:\s*\[\]/,
      "records loadRecords must clear stale summary and history groups before fetching",
    ],
    [
      "habit-manage",
      "pages/habit-manage/index.js",
      /loadHabits\(\)\s*\{[\s\S]*this\.setData\(\{[\s\S]*familyId:\s*""[\s\S]*childId:\s*""[\s\S]*habits:\s*\[\][\s\S]*canManageHabits:\s*false[\s\S]*updatingHabitId:\s*""[\s\S]*addActionClass:\s*"add-habit-action action-disabled"/,
      "habit-manage loadHabits must clear stale habits, permission, and updating state before fetching",
    ],
    [
      "family-members",
      "pages/family-members/index.js",
      /loadMembers\(\)\s*\{[\s\S]*this\.setData\(\{[\s\S]*familyId:\s*""[\s\S]*familyName:\s*""[\s\S]*childNickname:\s*""[\s\S]*roleText:\s*""[\s\S]*isFamilyAdmin:\s*false[\s\S]*inviteActionClass:\s*"invite-primary action-disabled"[\s\S]*members:\s*\[\][\s\S]*memberCount:\s*0/,
      "family-members loadMembers must clear stale family/member state before fetching",
    ],
    [
      "family-invite",
      "pages/family-invite/index.js",
      /loadInvite\(\)\s*\{[\s\S]*this\.setData\(\{[\s\S]*familyId:\s*""[\s\S]*familyName:\s*""[\s\S]*childNickname:\s*""[\s\S]*isFamilyAdmin:\s*false[\s\S]*inviteCode:\s*""[\s\S]*expiresTime:\s*""[\s\S]*refreshing:\s*false[\s\S]*refreshActionClass:\s*"refresh-button action-disabled"/,
      "family-invite loadInvite must clear stale invite and admin state before fetching",
    ],
    [
      "habit-permission",
      "pages/habit-permission/index.js",
      /loadMembers\(\)\s*\{[\s\S]*this\.setData\(\{[\s\S]*members:\s*\[\][\s\S]*saving:\s*false[\s\S]*saveClass:\s*"save-action"[\s\S]*inlineSaveClass:\s*"permission-save-inline"/,
      "habit-permission loadMembers must clear stale member and save state before fetching",
    ],
    [
      "habit-library",
      "pages/habit-library/index.js",
      /loadTemplates\(\)\s*\{[\s\S]*this\.setData\(\{[\s\S]*templates:\s*\[\][\s\S]*templateCards:\s*\[\][\s\S]*hasTemplates:\s*false/,
      "habit-library loadTemplates must clear stale template cards before fetching a new search/category",
    ],
  ];

  for (const [name, path, pattern, message] of checks) {
    const source = readFileSync(join(rootDir, path), "utf8");
    assert.ok(pattern.test(source), `${name}: ${message}`);
  }
}

function assertP0VisualPrototypeGuard() {
  const todayJs = readFileSync(join(rootDir, "pages/today/index.js"), "utf8");
  const todayWxml = readFileSync(join(rootDir, "pages/today/index.wxml"), "utf8");
  const todayWxss = readFileSync(join(rootDir, "pages/today/index.wxss"), "utf8");
  const recordsJs = readFileSync(join(rootDir, "pages/records/index.js"), "utf8");
  const recordsWxml = readFileSync(join(rootDir, "pages/records/index.wxml"), "utf8");
  const recordsWxss = readFileSync(join(rootDir, "pages/records/index.wxss"), "utf8");
  const meJs = readFileSync(join(rootDir, "pages/me/index.js"), "utf8");
  const meWxml = readFileSync(join(rootDir, "pages/me/index.wxml"), "utf8");
  const meWxss = readFileSync(join(rootDir, "pages/me/index.wxss"), "utf8");

  for (const token of ["actionIcon", "\\ue86c", "checkin-action-icon", "normalizeAssetPath"]) {
    assert.ok(todayJs.includes(token) || todayWxml.includes(token) || todayWxss.includes(token), `today non-empty card must preserve checked-state token ${token}`);
  }
  assert.ok(todayJs.includes("checkingHabitId"), "today page must guard repeated checkin taps while a request is in flight");
  assert.ok(todayJs.includes("this.data.checkingHabitId"), "today checkin handler must read in-flight checkin state");
  for (const token of ["permissionClass", "actionClass"]) {
    assert.ok(todayJs.includes(token), `today page must derive visual state ${token} in JS`);
  }
  for (const token of ["habitNameClass", "sourceBadgeText", "sourceBadgeClass", "showSourceBadge", "permissionInlineText", "showPermissionInlineText"]) {
    assert.ok(todayJs.includes(token), `today non-empty card must derive prototype visual state ${token} in JS`);
  }
  for (const token of ["habit-title-row", "source-badge", "habit-name-checked", "permission-inline-text"]) {
    assert.ok(todayWxml.includes(token) || todayWxss.includes(token), `today non-empty card must preserve prototype structure token ${token}`);
  }
  assert.ok(todayWxml.includes('class="{{item.habitNameClass}}"'), "today habit title class must be derived in JS for checked line-through state");
  assert.ok(todayWxml.includes('wx:if="{{item.showSourceBadge}}"'), "today source badge visibility must be derived in JS");
  assert.ok(todayWxml.includes("{{item.sourceBadgeText}}"), "today source badge text must come from derived API state");
  assert.ok(todayWxml.includes('wx:if="{{item.showPermissionInlineText}}"'), "today no-permission inline text visibility must be derived in JS");
  assert.ok(todayWxml.includes('class="material-symbols-outlined checkin-action-icon"'), "today checked action must render Material check_circle icon from page data");

  for (const token of [
    "arrowBack: \"\\ue5e0\"",
    "moreHoriz: \"\\ue5d3\"",
    'class="icon-button material-symbols-outlined">{{icons.arrowBack}}</view>',
    'class="icon-button material-symbols-outlined">{{icons.moreHoriz}}</view>',
    "record-date-badge",
    "record-weekday",
    "record-day",
    "record-complete-pill",
    "record-check-icon",
    "recordDateText",
    "recordSubtitleText",
    "summaryMetricText",
    "summary-metric-row",
    "summary-metric-icon",
    "summary-metric-text",
    "historyEdu: \"\\uea3e\"",
    "eco: \"\\uea35\"",
    "checkCircle: \"\\ue86c\"",
    "chevronRight: \"\\ue5cc\"",
  ]) {
    assert.ok(recordsJs.includes(token) || recordsWxml.includes(token) || recordsWxss.includes(token), `records page must preserve prototype list token ${token}`);
  }
  assert.ok(
    recordsWxml.includes('class="material-symbols-outlined summary-metric-icon">{{icons.eco}}</text>'),
    "records summary must render the prototype metric icon before metric text",
  );
  assert.ok(recordsWxml.includes("{{record.recordDateText}}"), "records list card primary title must be the grouped record date like the prototype");
  assert.ok(recordsWxml.includes("{{record.recordSubtitleText}}"), "records list card subtitle must be derived in JS instead of showing raw habit-only data");
  assert.ok(!/[>][\ue000-\uf8ff][<]/u.test(recordsWxml), "records page must not hard-code private-use Material Symbol glyphs in WXML");

  for (const token of [
    "arrowBack: \"\\ue5e0\"",
    "moreHoriz: \"\\ue5d3\"",
    'class="icon-button material-symbols-outlined">{{icons.arrowBack}}</view>',
    'class="icon-button material-symbols-outlined">{{icons.moreHoriz}}</view>',
    "settings-list",
    "settings-item",
    "通用设置",
    "帮助与反馈",
    "关于我们",
    "edit: \"\\ue3c9\"",
    "checklist: \"\\ue065\"",
    "libraryBooks: \"\\ue02f\"",
    "qrCode: \"\\ue00a\"",
    "groupAdd: \"\\uf8eb\"",
    "settings: \"\\ue8b8\"",
    "help: \"\\ue887\"",
    "info: \"\\ue88e\"",
    "inviteEntryClass",
    "habitManageEntryClass",
    "habitLibraryEntryClass",
    "familyMembersEntryClass",
    "familyAddClass",
    "familyCardClass",
    "growthPointsText",
    "growthPointsLabel",
    "child-score",
    "child-score-value",
    "child-score-label",
  ]) {
    assert.ok(meJs.includes(token) || meWxml.includes(token) || meWxss.includes(token), `me page must preserve prototype/profile token ${token}`);
  }
  assert.ok(
    meWxml.includes('class="child-score-value">{{growthPointsText}}</view>') &&
      meWxml.includes('class="child-score-label">{{growthPointsLabel}}</view>'),
    "me child card must render the prototype growth-points block with JS-derived text",
  );
  assert.ok(/\.progress-fill\s*\{[\s\S]*width:\s*75%;/.test(meWxss), "me child growth progress bar must preserve the prototype 75% width");
  assert.ok(!/[>][\ue000-\uf8ff][<]/u.test(meWxml), "me page must not hard-code private-use Material Symbol glyphs in WXML");
  assert.ok(!meWxml.includes("✎") && !meWxml.includes("＋"), "me page must not use text-symbol fallbacks for visible prototype icons");
  assert.ok(
    meWxml.includes('class="edit-dot material-symbols-outlined">{{icons.edit}}</view>'),
    "me profile edit affordance must render the prototype edit Material Symbol from page data",
  );
  assert.ok(
    /class="\{\{familyAddClass\}\}"[\s\S]*class="material-symbols-outlined"\>\{\{icons\.groupAdd\}\}/.test(meWxml),
    "me family add affordance must render the prototype group_add Material Symbol from page data",
  );
  assert.ok(meWxml.includes('class="{{habitManageEntryClass}}"'), "me habit-manage entry must use JS-derived disabled state");
  assert.ok(meWxml.includes('class="{{habitLibraryEntryClass}}"'), "me habit-library entry must use JS-derived disabled state");
  assert.ok(meWxml.includes('class="{{familyMembersEntryClass}}"'), "me family-members entry must use JS-derived disabled state");
  assert.ok(meWxml.includes('class="{{familyAddClass}}"'), "me family add affordance must use JS-derived disabled state");
  assert.ok(meWxml.includes('class="{{familyCardClass}}"'), "me family member card must use JS-derived disabled state");
  assert.ok(
    /habitManageEntryClass:\s*family\s*\?\s*"bento-item"\s*:\s*"bento-item menu-item-disabled"/.test(meJs),
    "me habit-manage entry must be visually disabled without a family",
  );
  assert.ok(
    /habitLibraryEntryClass:\s*family\s*\?\s*"bento-item"\s*:\s*"bento-item menu-item-disabled"/.test(meJs),
    "me habit-library entry must be visually disabled without a family",
  );
  assert.ok(
    /familyMembersEntryClass:\s*family\s*\?\s*"bento-item"\s*:\s*"bento-item menu-item-disabled"/.test(meJs),
    "me family-members entry must be visually disabled without a family",
  );
  assert.ok(
    /familyAddClass:\s*family\s*\?\s*"family-add"\s*:\s*"family-add menu-item-disabled"/.test(meJs),
    "me family add affordance must be visually disabled without a family",
  );
  assert.ok(
    /familyCardClass:\s*family\s*\?\s*"family-members-card card"\s*:\s*"family-members-card card menu-item-disabled"/.test(meJs),
    "me family member card must be visually disabled without a family",
  );
  assert.ok(
    /goFamilyInvite\(\)\s*\{[\s\S]*if\s*\(\s*!this\.data\.hasFamily\s*\)[\s\S]*if\s*\(\s*!this\.data\.isFamilyAdmin\s*\)/.test(meJs),
    "me invite entry must show no-family guidance before admin permission errors",
  );
  assert.ok(
    /onShow\(\)\s*\{[\s\S]*syncCustomTabBar\(this,\s*2\)[\s\S]*this\.setData\(\{[\s\S]*\.\.\.defaultFamilyState[\s\S]*\}\);[\s\S]*const bootstrap = await getBootstrap\(\)/.test(meJs),
    "me onShow must clear stale family and role state before fetching bootstrap",
  );

  const habitManageJs = readFileSync(join(rootDir, "pages/habit-manage/index.js"), "utf8");
  assert.ok(habitManageJs.includes("normalizeAssetPath"), "habit-manage must normalize backend/local habit image paths before rendering");
}

function assertSecondaryVisualPrototypeGuard() {
  const startJs = readFileSync(join(rootDir, "pages/start/index.js"), "utf8");
  const startWxml = readFileSync(join(rootDir, "pages/start/index.wxml"), "utf8");
  const createJs = readFileSync(join(rootDir, "pages/create-family/index.js"), "utf8");
  const createConfig = readJson(join(rootDir, "pages/create-family/index.json"));
  const createWxml = readFileSync(join(rootDir, "pages/create-family/index.wxml"), "utf8");
  const joinJs = readFileSync(join(rootDir, "pages/join-family/index.js"), "utf8");
  const joinConfig = readJson(join(rootDir, "pages/join-family/index.json"));
  const joinWxml = readFileSync(join(rootDir, "pages/join-family/index.wxml"), "utf8");
  const customJs = readFileSync(join(rootDir, "pages/custom-habit/index.js"), "utf8");
  const customConfig = readJson(join(rootDir, "pages/custom-habit/index.json"));
  const customWxml = readFileSync(join(rootDir, "pages/custom-habit/index.wxml"), "utf8");
  const customWxss = readFileSync(join(rootDir, "pages/custom-habit/index.wxss"), "utf8");
  const familyInviteConfig = readJson(join(rootDir, "pages/family-invite/index.json"));
  const familyInviteJs = readFileSync(join(rootDir, "pages/family-invite/index.js"), "utf8");
  const familyInviteWxml = readFileSync(join(rootDir, "pages/family-invite/index.wxml"), "utf8");
  const familyInviteWxss = readFileSync(join(rootDir, "pages/family-invite/index.wxss"), "utf8");
  const familyMembersConfig = readJson(join(rootDir, "pages/family-members/index.json"));
  const familyMembersJs = readFileSync(join(rootDir, "pages/family-members/index.js"), "utf8");
  const familyMembersWxml = readFileSync(join(rootDir, "pages/family-members/index.wxml"), "utf8");
  const familyMembersWxss = readFileSync(join(rootDir, "pages/family-members/index.wxss"), "utf8");
  const habitManageConfig = readJson(join(rootDir, "pages/habit-manage/index.json"));
  const habitManageJs = readFileSync(join(rootDir, "pages/habit-manage/index.js"), "utf8");
  const habitManageWxml = readFileSync(join(rootDir, "pages/habit-manage/index.wxml"), "utf8");
  const habitManageWxss = readFileSync(join(rootDir, "pages/habit-manage/index.wxss"), "utf8");
  const habitPermissionConfig = readJson(join(rootDir, "pages/habit-permission/index.json"));
  const habitPermissionJs = readFileSync(join(rootDir, "pages/habit-permission/index.js"), "utf8");
  const habitPermissionWxml = readFileSync(join(rootDir, "pages/habit-permission/index.wxml"), "utf8");
  const habitPermissionWxss = readFileSync(join(rootDir, "pages/habit-permission/index.wxss"), "utf8");

  assert.ok(startWxml.includes("start-button"), "start page must render prototype action buttons");
  assert.ok(startWxml.includes("/assets/onboarding/start-family-growth.png"), "start page hero must use the approved local prototype image asset");
  assert.ok(startWxml.includes("/assets/icons/eco-gold.png"), "start page growth chip must use the local approved icon asset");
  assert.ok(startWxml.includes("/assets/icons/favorite-teal.png"), "start page love chip must use the local approved icon asset");
  assert.ok(startWxml.includes("floating-chip growth-chip"), "start page must preserve the prototype growth floating chip");
  assert.ok(startWxml.includes("floating-chip love-chip"), "start page must preserve the prototype love floating chip");
  for (const removedToken of ["help_outline", "已有 10,000+ 家庭", "© 2024", "aida-public", "lh3.googleusercontent.com"]) {
    assert.ok(!startWxml.includes(removedToken), `start page must not restore removed prototype/remote token ${removedToken}`);
  }
  assert.ok(
    /goCreateFamily\(\)\s*\{[\s\S]*if\s*\(\s*this\.data\.loading\s*\)\s*\{[\s\S]*return;[\s\S]*wx\.navigateTo\(\{ url: ROUTES\.CREATE_FAMILY \}\)/.test(startJs),
    "start page must block create-family navigation while bootstrap is loading",
  );
  assert.ok(
    /goJoinFamily\(\)\s*\{[\s\S]*if\s*\(\s*this\.data\.loading\s*\)\s*\{[\s\S]*return;[\s\S]*wx\.navigateTo\(\{ url: ROUTES\.JOIN_FAMILY \}\)/.test(startJs),
    "start page must block join-family navigation while bootstrap is loading",
  );

  for (const [name, source] of [
    ["create-family", createWxml],
    ["join-family", joinWxml],
    ["custom-habit", customWxml],
  ]) {
    assert.ok(!source.includes("<button"), `${name} must not use native button for prototype-critical visible actions`);
    assert.ok(source.includes("visual-action"), `${name} must use styled view visual-action for fixed action controls`);
  }
  for (const [name, config] of [
    ["create-family", createConfig],
    ["join-family", joinConfig],
    ["custom-habit", customConfig],
    ["family-invite", familyInviteConfig],
  ]) {
    assert.equal(config.navigationStyle, "custom", `${name} must use custom navigation to avoid duplicate native title`);
    assert.ok(!Object.hasOwn(config, "navigationBarTitleText"), `${name} must not keep navigationBarTitleText with custom prototype top bar`);
  }

  for (const token of ["arrowBack: \"\\ue5c4\"", "home: \"\\ue88a\"", "face6: \"\\uf8da\"", "addCircle: \"\\ue147\"", "groupAdd: \"\\ue7fe\"", "verified: \"\\ue8e8\"", "goBack"]) {
    assert.ok(createJs.includes(token), `create-family must preserve Material/icon token ${token}`);
  }
  assert.ok(
    createWxml.includes('class="field-icon material-symbols-outlined">{{icons.face6}}</view>'),
    "create-family child nickname input must use the prototype face_6 icon",
  );
  assert.ok(
    createWxml.includes('class="material-symbols-outlined visual-action-icon">{{icons.addCircle}}</text>'),
    "create-family submit action must use the prototype add_circle icon",
  );
  assert.ok(
    fontHasCodepoint(join(rootDir, "assets/fonts/material-symbols-outlined-subset.ttf"), 0xf8da),
    "create-family face_6 icon must be included in the local outlined Material Symbols subset",
  );
  assert.ok(!createWxml.includes("♧") && !createWxml.includes("✓"), "create-family tips must not use text-symbol fallbacks for prototype icons");
  assert.ok(
    createWxml.includes('class="tip-icon material-symbols-outlined">{{icons.groupAdd}}</view>'),
    "create-family invite-family tip must render prototype group_add Material Symbol from page data",
  );
  assert.ok(
    createWxml.includes('class="tip-icon tip-blue material-symbols-outlined">{{icons.verified}}</view>'),
    "create-family privacy tip must render prototype verified Material Symbol from page data",
  );
  assert.ok(
    createWxml.includes("端到端加密，守护成长瞬间"),
    "create-family privacy tip must keep the prototype security copy",
  );
  for (const token of ['"请输入家庭名称"', '"请输入孩子昵称"', "const familyName", "const childNickname"]) {
    assert.ok(createJs.includes(token), `create-family must validate form token ${token}`);
  }
  assert.ok(
    /submitCreateFamily\(\)\s*\{[\s\S]*if\s*\(\s*this\.data\.submitting\s*\)[\s\S]*submitClass:\s*"primary-button visual-action action-disabled"[\s\S]*await createFamily[\s\S]*finally\s*\{[\s\S]*submitting:\s*false[\s\S]*submitClass:\s*"primary-button visual-action"/.test(createJs),
    "create-family must prevent repeated submits and restore submit visual state",
  );
  for (const token of ["arrowBack: \"\\ue5c4\"", "familyHistory: \"\\ue0ad\"", "qrCodeScanner: \"\\uf206\"", "info: \"\\ue88e\"", "goBack"]) {
    assert.ok(joinJs.includes(token), `join-family must preserve Material/icon token ${token}`);
  }
  assert.ok(
    joinWxml.includes('class="field-icon code-icon material-symbols-outlined">{{icons.familyHistory}}</view>'),
    "join-family invite input must use the prototype family_history icon",
  );
  assert.ok(
    joinWxml.includes('class="material-symbols-outlined visual-action-icon-left">{{icons.qrCodeScanner}}</text>'),
    "join-family scan action must use the prototype qr_code_scanner icon",
  );
  assert.ok(
    fontHasCodepoint(join(rootDir, "assets/fonts/material-symbols-outlined-subset.ttf"), 0xe0ad),
    "join-family family_history icon must be included in the local outlined Material Symbols subset",
  );
  assert.ok(
    fontHasCodepoint(join(rootDir, "assets/fonts/material-symbols-outlined-subset.ttf"), 0xf206),
    "join-family qr_code_scanner icon must be included in the local outlined Material Symbols subset",
  );
  assert.ok(joinJs.includes("/^\\d{6}$/"), "join-family must validate six-digit invite code before submit");
  assert.ok(joinJs.includes('"请输入 6 位数字邀请码"'), "join-family must show clear invite code validation message");
  assert.ok(
    /submitJoinFamily\(\)\s*\{[\s\S]*if\s*\(\s*this\.data\.submitting\s*\)[\s\S]*submitClass:\s*"primary-button visual-action action-disabled"[\s\S]*await joinFamily[\s\S]*finally\s*\{[\s\S]*submitting:\s*false[\s\S]*submitClass:\s*"primary-button visual-action"/.test(joinJs),
    "join-family must prevent repeated submits and restore submit visual state",
  );
  for (const token of [
    "arrowBack: \"\\ue5e0\"",
    "moreHoriz: \"\\ue5d3\"",
    "edit: \"\\ue3c9\"",
    "groups: \"\\ue7ef\"",
    "chevronRight: \"\\ue5cc\"",
    "selectedIconSymbol",
    "submitClass",
    "className",
    "chooseIcon",
    "chooseCategory",
    "categoryOptions",
    "goBack",
  ]) {
    assert.ok(customJs.includes(token), `custom-habit must preserve Material/icon token ${token}`);
  }
  assert.ok(customWxml.includes("top-bar") && customWxml.includes("icon-button"), "custom-habit must render custom top bar");
  assert.ok(
    customWxml.includes('placeholder="例如：每天整理书包"'),
    "custom-habit habit-name placeholder must match the approved prototype",
  );
  assert.ok(customJs.includes("const habitName"), "custom-habit must trim habit name before submit");
  assert.ok(customJs.includes('"请输入习惯名称"'), "custom-habit must validate required habit name before submit");
  assert.ok(
    /submitCustomHabit\(\)\s*\{[\s\S]*if\s*\(\s*this\.data\.submitting\s*\)[\s\S]*if\s*\(\s*!this\.data\.childId\s*\)[\s\S]*submitClass:\s*"primary-button visual-action action-disabled"[\s\S]*await createCustomHabit[\s\S]*finally\s*\{[\s\S]*submitting:\s*false[\s\S]*submitClass:\s*"primary-button visual-action"/.test(customJs),
    "custom-habit must prevent repeated submits, check family context before form validation, and restore submit visual state",
  );
  for (const token of [
    "custom-icon-section",
    "selected-icon-shell",
    "change-icon-text",
    "category-grid",
    "打卡权限",
    "permission-preview",
    "helper-text",
    "创建并添加到孩子习惯",
  ]) {
    assert.ok(
      customWxml.includes(token) || customWxss.includes(token),
      `custom-habit must preserve prototype visual token ${token}`,
    );
  }
  assert.ok(!customWxml.includes("选择图标"), "custom-habit form must not add an extra icon-option field absent from the prototype");
  assert.ok(!customWxml.includes("icon-option-row"), "custom-habit must keep icon choice in the prototype top icon area, not an extra form row");
  for (const categoryKey of ["HEALTH", "LIFE_SKILLS", "LEARNING", "SPORTS", "SOCIAL_EMOTION", "SAFETY"]) {
    assert.ok(customJs.includes(`key: "${categoryKey}"`), `custom-habit must expose DB-backed category ${categoryKey}`);
  }
  for (const unsupportedCategoryKey of ["INTEREST", "CHARACTER", "EMOTION", "MONEY", "CUSTOM"]) {
    assert.ok(!customJs.includes(`key: "${unsupportedCategoryKey}"`), `custom-habit must not expose unsupported category ${unsupportedCategoryKey}`);
  }
  assert.ok(!/\{\{[^}]*\?[^}]*:/.test(customWxml), "custom-habit WXML must not use ternary class bindings");
  assert.ok(!customWxml.includes("图标 Key"), "custom-habit must not expose developer-facing iconKey field label");
  for (const [name, source] of [
    ["create-family", createWxml],
    ["join-family", joinWxml],
    ["custom-habit", customWxml],
    ["family-members", familyMembersWxml],
    ["habit-manage", habitManageWxml],
    ["habit-permission", habitPermissionWxml],
  ]) {
    assert.ok(!/\{\{[^}]*\?[^}]*:/.test(source), `${name} WXML must use JS-derived class/state instead of ternary class bindings`);
  }
  for (const [name, source, token] of [
    ["create-family", createJs, "submitClass"],
    ["join-family", joinJs, "submitClass"],
    ["family-members", familyMembersJs, "inviteActionClass"],
    ["habit-manage", habitManageJs, "toggleSwitchClass"],
    ["habit-permission", habitPermissionJs, "optionClass"],
  ]) {
    assert.ok(source.includes(token), `${name} must expose JS-derived visual state ${token}`);
  }
  assert.ok(!/[>][⌂☺⌘⊕‹][<]/u.test(createWxml + joinWxml + customWxml), "secondary flow pages must not hard-code text-symbol icons in WXML");

  for (const token of [
    "familyName",
    "childNickname",
    "arrowBack: \"\\ue5e0\"",
    "family: \"\\ue63d\"",
    "key: \"\\ue73c\"",
    "qrCode: \"\\ue00a\"",
    "share: \"\\ue80d\"",
    "goBack",
  ]) {
    assert.ok(familyInviteJs.includes(token), `family-invite must preserve prototype data/icon token ${token}`);
  }
  for (const token of [
    "invite-family-head",
    "family-icon",
    "invite-code-card",
    "code-row",
    "refresh-row",
    "refresh-hint",
    "refresh-button",
    "qr-card",
    "qr-box",
    "share-action",
    "invite-footer-hint",
    "refreshActionClass",
  ]) {
    assert.ok(
      familyInviteWxml.includes(token) || familyInviteWxss.includes(token),
      `family-invite must preserve prototype visual token ${token}`,
    );
  }
  assert.ok(familyInviteJs.includes("this.data.refreshing"), "family-invite must prevent repeated invite refresh taps");
  assert.ok(
    /copyInviteCode\(\)\s*\{[\s\S]*if\s*\(\s*!this\.data\.inviteCode\s*\)[\s\S]*wx\.showToast\(\{ title: "邀请码未生成", icon: "none" \}\)[\s\S]*return;/.test(familyInviteJs),
    "family-invite copy action must show feedback when invite code is missing",
  );
  assert.ok(
    /wx:elif="\{\{!familyId\}\}"[\s\S]*wx:elif="\{\{!isFamilyAdmin\}\}"/.test(familyInviteWxml),
    "family-invite must show no-family empty state before admin-only empty state",
  );
  assert.ok(
    /refreshInvite\(\)\s*\{[\s\S]*if\s*\(\s*this\.data\.refreshing\s*\)[\s\S]*if\s*\(\s*!this\.data\.familyId\s*\)[\s\S]*if\s*\(\s*!this\.data\.isFamilyAdmin\s*\)/.test(familyInviteJs),
    "family-invite refresh action must show no-family guidance before admin permission errors",
  );
  assert.ok(
    /if\s*\(\s*this\.data\.refreshing\s*\)\s*\{\s*return;\s*\}\s*if\s*\(\s*!this\.data\.familyId\s*\)[\s\S]*if\s*\(\s*!this\.data\.isFamilyAdmin\s*\)/.test(familyInviteJs),
    "family-invite must silently ignore repeated refresh taps before showing family-state or permission errors",
  );
  assert.ok(familyInviteWxml.includes("刷新后，旧邀请码将失效。"), "family-invite admin state must show prototype refresh invalidation hint");
  assert.ok(familyInviteWxml.includes("刷新邀请码"), "family-invite admin state must use prototype refresh button label");
  assert.ok(!familyInviteWxml.includes("刷新，有效期至"), "family-invite must not collapse prototype refresh row into an expiry link");
  assert.ok(familyInviteJs.includes('refreshActionClass: "refresh-button action-disabled"'), "family-invite must expose disabled refresh visual state");

  assert.equal(familyMembersConfig.navigationStyle, "custom", "family-members must use custom navigation to match prototype header");
  assert.ok(!Object.hasOwn(familyMembersConfig, "navigationBarTitleText"), "family-members must not render duplicate native title");
  for (const token of [
    "bubbleChart: \"\\ue6dd\"",
    "notifications: \"\\ue7f4\"",
    "child: \"\\ue7fd\"",
    "personAdd: \"\\ue7fe\"",
    "roleText",
    "memberDesc",
    "accentClass",
  ]) {
    assert.ok(familyMembersJs.includes(token), `family-members must preserve prototype data/icon token ${token}`);
  }
  for (const token of [
    "top-heading",
    "top-notification",
    "family-hero",
    "family-orbit",
    "child-pill",
    "role-pill",
    "member-section-title",
    "member-role",
    "family-helper",
    "invite-primary",
    "fixed-action-spacer",
    "fixed-action",
  ]) {
    assert.ok(
      familyMembersWxml.includes(token) || familyMembersWxss.includes(token),
      `family-members must preserve prototype visual token ${token}`,
    );
  }
  assert.ok(!familyMembersWxml.includes("<button"), "family-members must not use native button for prototype bottom invite action");
  assert.ok(!/[>][\ue000-\uf8ff][<]/u.test(familyMembersWxml), "family-members must not hard-code private-use Material Symbol glyphs in WXML");
  assert.ok(
    familyMembersWxml.includes('class="top-notification material-symbols-outlined">{{icons.notifications}}</view>'),
    "family-members must render the prototype notifications icon in the top bar",
  );
  assert.ok(
    fontHasCodepoint(join(rootDir, "assets/fonts/material-symbols-outlined-subset.ttf"), 0xe7f4),
    "family-members notifications icon must be included in the local outlined Material Symbols subset",
  );
  assert.ok(
    /goFamilyInvite\(\)\s*\{[\s\S]*if\s*\(\s*!this\.data\.familyId\s*\)[\s\S]*if\s*\(\s*!this\.data\.isFamilyAdmin\s*\)/.test(familyMembersJs),
    "family-members invite action must show no-family guidance before admin permission errors",
  );

  assert.equal(habitManageConfig.navigationStyle, "custom", "habit-manage must use custom navigation to match prototype header");
  assert.ok(!Object.hasOwn(habitManageConfig, "navigationBarTitleText"), "habit-manage must not render duplicate native title");
  for (const token of [
    "arrowBack: \"\\ue5e0\"",
    "moreHoriz: \"\\ue5d3\"",
    "add: \"\\ue145\"",
    "drag: \"\\ue25d\"",
    "lightbulb: \"\\ue0f0\"",
    "allowedMemberIdsText",
    "activeClass",
    "sourceBadgeText",
    "sourceBadgeClass",
    "showSourceBadge",
    "updatingHabitId",
  ]) {
    assert.ok(habitManageJs.includes(token), `habit-manage must preserve prototype data/icon token ${token}`);
  }
  assert.ok(habitManageWxml.includes('wx:if="{{item.showSourceBadge}}"'), "habit-manage must render a JS-derived template source badge");
  assert.ok(habitManageWxml.includes('class="{{item.sourceBadgeClass}}"'), "habit-manage source badge class must be derived in JS");
  assert.ok(habitManageWxml.includes("{{item.sourceBadgeText}}"), "habit-manage source badge text must be derived in JS");
  assert.ok(habitManageWxss.includes(".source-badge"), "habit-manage must style the prototype source badge");
  assert.ok(habitManageJs.includes("this.data.updatingHabitId"), "habit-manage must prevent repeated habit status updates");
  assert.ok(
    /goCustomHabit\(\)\s*\{[\s\S]*if\s*\(\s*!this\.data\.childId\s*\)[\s\S]*if\s*\(\s*!this\.data\.canManageHabits\s*\)/.test(habitManageJs),
    "habit-manage add action must show no-family guidance before admin permission errors",
  );
  assert.ok(
    /goHabitPermission\(event\)\s*\{[\s\S]*if\s*\(\s*!this\.data\.childId\s*\)[\s\S]*if\s*\(\s*!this\.data\.canManageHabits\s*\)/.test(habitManageJs),
    "habit-manage permission action must show no-family guidance before admin permission errors",
  );
  assert.ok(
    /if\s*\(\s*this\.data\.updatingHabitId\s*\)\s*\{\s*return;\s*\}\s*if\s*\(\s*!this\.data\.childId\s*\)[\s\S]*if\s*\(\s*!this\.data\.canManageHabits\s*\)/.test(habitManageJs),
    "habit-manage must silently ignore repeated status taps, then show no-family guidance before permission errors",
  );
  assert.ok(habitManageJs.includes("buildToggleSwitchClass(habit.status, canManageHabits, this.data.updatingHabitId === String(habit.id))"), "habit-manage must derive disabled toggle state while updating");
  assert.ok(
    /await updateChildHabitStatus[\s\S]*this\.setData\(\{ updatingHabitId: "" \}\);[\s\S]*await this\.loadHabits\(\)/.test(habitManageJs),
    "habit-manage must clear updatingHabitId before reloading habits so toggle visual state is restored",
  );
  assert.ok(habitManageWxml.includes("data-allowed-member-ids"), "habit-manage WXML must include allowedMemberIds dataset for permission editor");
  for (const token of [
    "manage-top-bar",
    "manage-header",
    "add-habit-action",
    "drag-handle",
    "toggle-switch",
    "toggle-dot",
    "permission-action",
    "tip-card",
    "温馨提示",
  ]) {
    assert.ok(
      habitManageWxml.includes(token) || habitManageWxss.includes(token),
      `habit-manage must preserve prototype visual token ${token}`,
    );
  }
  assert.ok(!habitManageWxml.includes("<button"), "habit-manage must not use native button for prototype visible actions");

  assert.equal(habitPermissionConfig.navigationStyle, "custom", "habit-permission must use custom navigation to match edit-habit prototype");
  assert.ok(!Object.hasOwn(habitPermissionConfig, "navigationBarTitleText"), "habit-permission must not render duplicate native title");
  for (const token of [
    "arrowBack: \"\\ue5e0\"",
    "moreHoriz: \"\\ue5d3\"",
    "verifiedUser: \"\\ue8e8\"",
    "expandMore: \"\\ue5cf\"",
    "parseAllowedMemberIds",
    "avatarText",
    "全家长可打卡（默认）",
    "仅我可打卡",
    "指定家长可打卡",
  ]) {
    assert.ok(habitPermissionJs.includes(token), `habit-permission must preserve prototype permission token ${token}`);
  }
  assert.ok(
    habitPermissionJs.includes('allowedMemberIds: this.data.permissionType === "SPECIFIC_PARENTS" ? this.data.allowedMemberIds : []'),
    "habit-permission must not submit stale allowedMemberIds for non-specific permission types",
  );
  assert.ok(habitPermissionJs.includes("if (this.data.saving)"), "habit-permission must prevent repeated save taps");
  assert.ok(
    /savePermission\(\)\s*\{[\s\S]*if\s*\(\s*this\.data\.saving\s*\)[\s\S]*if\s*\(\s*!this\.data\.childId\s*\)[\s\S]*if\s*\(\s*!this\.data\.childHabitId\s*\)[\s\S]*permissionType\s*===\s*"SPECIFIC_PARENTS"/.test(habitPermissionJs),
    "habit-permission save must ignore repeated taps, then check family/habit context before permission-form validation",
  );
  for (const token of [
    "permission-top-bar",
    "habit-edit-section",
    "habit-name-field",
    "change-icon-pill",
    "permission-panel",
    "permission-panel-head",
    "option-radio",
    "member-avatar",
    "permission-tip",
    "permission-save-inline",
    "保存修改",
    "删除此习惯",
  ]) {
    assert.ok(
      habitPermissionWxml.includes(token) || habitPermissionWxss.includes(token),
      `habit-permission must preserve edit-habit prototype visual token ${token}`,
    );
  }
  assert.ok(!habitPermissionWxml.includes("<button"), "habit-permission must not use native button for prototype visible actions");
  assert.ok(!/[>][\ue000-\uf8ff][<]/u.test(habitPermissionWxml), "habit-permission must not hard-code private-use Material Symbol glyphs in WXML");
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
    "function todayHabits",
    "function checkinHabit",
    "function checkinHistory",
    "function checkinSummary",
  ]) {
    assertTextIncludes(join(rootDir, "core/api.js"), token);
  }

  const requestSource = readFileSync(join(rootDir, "utils/request.js"), "utf8");
  assert.ok(!requestSource.includes("const USE_MOCK_API = true"), "mock API must be explicit");
  assertTextIncludes(join(rootDir, "utils/request.js"), "setRequestConfig");
  assertTextIncludes(join(rootDir, "utils/request.js"), '"X-Test-Openid"');
  assertTextIncludes(join(rootDir, "utils/request.js"), '"X-Test-Nickname"');
}

function assertGlobalFixedActionSafeArea() {
  const source = readFileSync(join(rootDir, "app.wxss"), "utf8");
  assert.ok(source.includes(".fixed-action"), "app.wxss must define fixed-action");
  assert.ok(
    source.includes("env(safe-area-inset-bottom)"),
    "app.wxss fixed-action must account for safe-area-inset-bottom",
  );
  assert.ok(source.includes(".fixed-action-spacer"), "app.wxss must define fixed-action-spacer");
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
    ["services/checkin-service.js", ["listTodayHabits", "checkinHabit", "listCheckinHistory", "getCheckinSummary", "todayHabits(", "checkinHabit(", "checkinHistory(", "checkinSummary("]],
    ["pages/today/index.js", ["listTodayHabits", "checkinHabit", "todayHabits", "checkedText", "canCheckin"]],
    ["pages/records/index.js", ["listCheckinHistory", "getCheckinSummary", "historyGroups", "totalCheckinDays", "ROUTES.START", "redirectTo"]],
    ["pages/records/index.wxml", ["historyGroups", "record.recordDateText", "record.recordSubtitleText", "summaryMetricText", "totalCheckinDays"]],
    ["pages/me/index.js", ["ROUTES.FAMILY_MEMBERS", "ROUTES.FAMILY_INVITE", "goFamilyMembers", "goFamilyInvite", "isFamilyAdmin", "childNickname", "currentUser"]],
    ["pages/me/index.wxml", ["默认孩子", "childNickname"]],
    ["pages/habit-manage/index.js", ["ROUTES.HABIT_PERMISSION", "goHabitPermission", "canManageHabits", "permissionTypeText", "ROUTES.START", "redirectTo"]],
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
  const {
    listTodayHabits,
    checkinHabit,
    listCheckinHistory,
    getCheckinSummary,
  } = requireFromRoot("./services/checkin-service.js");

  setRequestConfig({ useMockApi: true });
  resetMockSession();
  const emptyBootstrap = await getBootstrap();
  assert.equal(emptyBootstrap.needOnboarding, true);
  assert.equal(emptyBootstrap.currentUser.nickname, "新手家长");

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
  const todayHabits = await listTodayHabits(childId);
  assert.equal(todayHabits.length, 1);
  assert.equal(todayHabits[0].checked, false);
  assert.equal(todayHabits[0].canCheckin, true);
  const checked = await checkinHabit(childId, addedHabit.id);
  assert.equal(checked.checked, true);
  await assert.rejects(() => checkinHabit(childId, addedHabit.id), /已打卡|already checked/);
  assert.equal((await getCheckinSummary(childId)).totalCheckinDays, 1);
  assert.equal((await getCheckinSummary(childId)).totalCheckinCount, 1);
  const disabledAfterCheckin = await updateChildHabitStatus(childId, addedHabit.id, "disabled");
  assert.equal(disabledAfterCheckin.status, "disabled");
  const history = await listCheckinHistory(childId);
  assert.equal(history.length, 1);
  assert.equal(history[0].habitName, "每天主动喝水");
  assert.equal(history[0].iconKey, "water_drop");

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
  const memberToday = await listTodayHabits(joined.child.id);
  assert.equal(memberToday[0].canCheckin, true);
  await assert.rejects(
    () => updateChildHabitPermission(joined.child.id, memberHabit.id, { permissionType: "OWNER_ONLY" }),
    /主家长/,
  );
}

assertNoTextFileBom();
assertAppConfig();
assertGlobalFixedActionSafeArea();
assertTodayEmptyPrototypeGuard();
assertHabitLibraryPrototypeGuard();
assertCustomTabBarPrototypeGuard();
assertAssetPathNormalization();
assertLoadStartClearsStalePageState();
assertP0VisualPrototypeGuard();
assertSecondaryVisualPrototypeGuard();

for (const page of requiredPages) {
  assertFile(join(rootDir, page + ".js"));
  assertFile(join(rootDir, page + ".json"));
  assertFile(join(rootDir, page + ".wxml"));
  assertFile(join(rootDir, page + ".wxss"));
  assertCommonJs(join(rootDir, page + ".js"));
  assertNoRawApiUrls(page);
  assertNoWxmlFunctionCalls(page);
  assertWxssCompatibility(page);
  assertFixedActionSafeArea(page);
}

for (const path of [
  "core/api.js",
  "core/routes.js",
  "utils/request.js",
  "utils/asset-path.js",
  "utils/mock-api.js",
  "services/bootstrap-service.js",
  "services/family-service.js",
  "services/habit-service.js",
  "services/child-habit-service.js",
  "services/checkin-service.js",
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
const contractSource = readFileSync(contractPath, "utf8");
assert.ok(contractSource.includes('"currentUser"'), "bootstrap contract must use currentUser");
assert.ok(!contractSource.includes('"avatarUrl"'), "bootstrap contract must not document unsupported avatarUrl");

await assertMockFlow();

console.log("miniprogram static validation passed");
