const { ROUTES } = require("../core/routes.js");

const tabs = [
  {
    pagePath: ROUTES.TODAY,
    text: "今日",
    icon: "\ue8df",
  },
  {
    pagePath: ROUTES.RECORDS,
    text: "记录",
    icon: "\uea3e",
  },
  {
    pagePath: ROUTES.ME,
    text: "我的",
    icon: "\ue7fd",
  },
];

function buildList(selected) {
  return tabs.map((item, index) => ({
    ...item,
    className: index === selected ? "tab-item tab-item-active" : "tab-item",
  }));
}

Component({
  data: {
    selected: 0,
    list: buildList(0),
  },
  observers: {
    "selected": function selectedChanged(selected) {
      this.setData({ list: buildList(Number(selected) || 0) });
    },
  },

  methods: {
    switchTab(event) {
      const index = Number(event.currentTarget.dataset.index);
      const item = this.data.list[index];
      if (!item || index === this.data.selected) {
        return;
      }
      wx.switchTab({ url: item.pagePath });
    },
  },
});
