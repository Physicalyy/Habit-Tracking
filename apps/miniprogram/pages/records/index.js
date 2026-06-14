const { ROUTES } = require("../../core/routes.js");
const { getBootstrap } = require("../../services/bootstrap-service.js");
const {
  getCheckinSummary,
  listCheckinHistory,
} = require("../../services/checkin-service.js");

Page({
  data: {
    loading: true,
    familyName: "",
    childNickname: "",
    childId: "",
    totalCheckinDays: 0,
    totalCheckinCount: 0,
    historyGroups: [],
    hasNoRecords: false,
    errorText: "",
  },

  async onShow() {
    await this.loadRecords();
  },

  async loadRecords() {
    this.setData({ loading: true, errorText: "", hasNoRecords: false });
    try {
      const bootstrap = await getBootstrap();
      if (bootstrap.needOnboarding || !bootstrap.defaultChild) {
        wx.redirectTo({ url: ROUTES.START });
        return;
      }

      const childId = bootstrap.defaultChild.id;
      const summary = await getCheckinSummary(childId);
      const records = await listCheckinHistory(childId);
      const historyGroups = groupByDate(records);
      this.setData({
        familyName: bootstrap.defaultFamily ? bootstrap.defaultFamily.name : "",
        childNickname: bootstrap.defaultChild.nickname,
        childId,
        totalCheckinDays: summary.totalCheckinDays || 0,
        totalCheckinCount: summary.totalCheckinCount || 0,
        historyGroups,
        hasNoRecords: historyGroups.length === 0,
      });
    } catch (error) {
      this.setData({ errorText: error.message || "记录加载失败" });
    } finally {
      this.setData({ loading: false });
    }
  },
});

function groupByDate(records) {
  const groups = [];
  const byDate = {};
  for (const record of records || []) {
    const date = record.checkinDate || "未知日期";
    if (!byDate[date]) {
      byDate[date] = {
        date,
        dateText: formatDateText(date),
        items: [],
      };
      groups.push(byDate[date]);
    }
    byDate[date].items.push({
      ...record,
      fallbackIcon: iconFallback(record.iconKey),
      timeText: formatTimeText(record.checkedTime),
    });
  }
  return groups;
}

function formatDateText(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return date;
  }
  return `${date.slice(5, 7)}月${date.slice(8, 10)}日`;
}

function formatTimeText(value) {
  if (!value || value.length < 16) {
    return "";
  }
  return value.slice(11, 16);
}

function iconFallback(iconKey) {
  const fallbackMap = {
    water_drop: "水",
    menu_book: "读",
    assignment: "任",
    bed: "床",
    soap: "净",
    traffic: "灯",
    piano: "琴",
    directions_run: "跑",
  };
  return fallbackMap[iconKey] || "习";
}
