const { ROUTES } = require("../../core/routes.js");
const { getBootstrap } = require("../../services/bootstrap-service.js");
const {
  getCheckinSummary,
  listCheckinHistory,
} = require("../../services/checkin-service.js");
const { getChildGrowthPartner } = require("../../services/growth-partner-service.js");
const { normalizeAssetPath } = require("../../utils/asset-path.js");
const { buildNavState } = require("../../utils/navigation-bar.js");
const { syncCustomTabBar } = require("../../utils/tab-bar.js");

Page({
  data: {
    loading: true,
    familyName: "",
    childNickname: "",
    childId: "",
    totalCheckinDays: 0,
    totalCheckinCount: 0,
    summaryMetricText: "养成 0 个好习惯",
    showRecordsPartnerSelect: false,
    showRecordsGrowthRoute: false,
    recordsPartnerName: "",
    recordsPartnerPointsText: "",
    recordsPartnerStageCards: [],
    historyGroups: [],
    hasNoRecords: false,
    icons: {
      historyEdu: "\uea3e",
      eco: "\uea35",
      checkCircle: "\ue86c",
    },
    errorText: "",
    ...buildNavState({ title: "打卡记录" }),
  },

  async onShow() {
    syncCustomTabBar(this, 1);
    await this.loadRecords();
  },

  async loadRecords() {
    this.setData({
      loading: true,
      errorText: "",
      familyName: "",
      childNickname: "",
      childId: "",
      totalCheckinDays: 0,
      totalCheckinCount: 0,
      summaryMetricText: "养成 0 个好习惯",
      showRecordsPartnerSelect: false,
      showRecordsGrowthRoute: false,
      recordsPartnerName: "",
      recordsPartnerPointsText: "",
      recordsPartnerStageCards: [],
      historyGroups: [],
      hasNoRecords: false,
    });
    try {
      const bootstrap = await getBootstrap();
      if (bootstrap.needOnboarding || !bootstrap.defaultChild) {
        wx.redirectTo({ url: ROUTES.START });
        return;
      }

      const childId = bootstrap.defaultChild.id;
      const [summary, records, growthPartnerState] = await Promise.all([
        getCheckinSummary(childId),
        listCheckinHistory(childId),
        getChildGrowthPartner(childId),
      ]);
      const historyGroups = groupByDate(records);
      this.setData({
        navTitle: `${bootstrap.defaultChild.nickname}的打卡记录`,
        familyName: bootstrap.defaultFamily ? bootstrap.defaultFamily.name : "",
        childNickname: bootstrap.defaultChild.nickname,
        childId,
        totalCheckinDays: summary.totalCheckinDays || 0,
        totalCheckinCount: summary.totalCheckinCount || 0,
        summaryMetricText: buildSummaryMetricText(summary),
        ...buildRecordsGrowthPartnerState(growthPartnerState),
        historyGroups,
        hasNoRecords: historyGroups.length === 0,
      });
    } catch (error) {
      this.setData({ errorText: error.message || "记录加载失败" });
    } finally {
      this.setData({ loading: false });
    }
  },

  goGrowthPartnerSelect() {
    wx.navigateTo({ url: ROUTES.GROWTH_PARTNER_SELECT });
  },
});

function buildSummaryMetricText(summary) {
  const total = Number(summary.totalCheckinCount || 0);
  return `养成 ${total} 个好习惯`;
}

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
      weekdayText: formatWeekdayText(date),
      dayText: formatDayText(date),
      recordDateText: formatDateText(date),
      recordSubtitleText: buildRecordSubtitleText(record),
      descriptionText: record.description || formatTimeText(record.checkedTime) || "已完成打卡",
      completeText: formatTimeText(record.checkedTime) ? `${formatTimeText(record.checkedTime)} 完成` : "已完成",
      showGrowthDelta: record.growthPartnerDelta !== undefined && record.growthPartnerDelta !== null,
      growthDeltaText: formatGrowthDelta(record.growthPartnerDelta),
    });
  }
  return groups;
}

function buildRecordsGrowthPartnerState(partnerState) {
  if (!partnerState || !partnerState.adopted || !partnerState.partner) {
    return {
      showRecordsPartnerSelect: true,
      showRecordsGrowthRoute: false,
      recordsPartnerName: "",
      recordsPartnerPointsText: "",
      recordsPartnerStageCards: [],
    };
  }
  return {
    showRecordsPartnerSelect: false,
    showRecordsGrowthRoute: true,
    recordsPartnerName: partnerState.partner.nickname || partnerState.partner.templateName,
    recordsPartnerPointsText: `${partnerState.partner.growthPoints || 0} 成长分`,
    recordsPartnerStageCards: (partnerState.stages || []).map(toRecordsStageCard),
  };
}

function toRecordsStageCard(stage) {
  return {
    ...stage,
    imageUrl: normalizeAssetPath(stage.previewImageUrl || stage.imageUrl),
    requiredText: `${stage.requiredGrowthPoints || 0} 分`,
    stageClass: stage.unlocked ? "route-stage route-stage-unlocked" : "route-stage",
    statusText: stage.unlocked ? "已解锁" : "未解锁",
  };
}

function formatGrowthDelta(delta) {
  const value = Number(delta || 0);
  return value > 0 ? `+${value} 成长分` : `${value} 成长分`;
}

function buildRecordSubtitleText(record) {
  const parts = [record.habitName];
  const description = String(record.description || "").trim();
  const timeText = formatTimeText(record.checkedTime);
  if (description) {
    parts.push(description);
  }
  if (timeText) {
    parts.push(timeText);
  }
  return parts.filter(Boolean).join(" · ");
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

function formatDayText(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return "--";
  }
  return String(Number(date.slice(8, 10)));
}

function formatWeekdayText(date) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return "日期";
  }
  const parsed = new Date(`${date}T00:00:00`);
  const weekdays = ["周日", "周一", "周二", "周三", "周四", "周五", "周六"];
  return weekdays[parsed.getDay()];
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
