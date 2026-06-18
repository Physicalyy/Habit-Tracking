function buildNavState(options = {}) {
  const title = options.title || "";
  const showBack = Boolean(options.showBack);
  const capsule = getCapsuleRect();
  const system = getSystemInfo();
  const statusBarHeight = system.statusBarHeight || 24;
  const contentHeight = capsule.height || 32;
  const topOffset = Math.max(0, (capsule.top || statusBarHeight + 6) - statusBarHeight);
  const navHeight = statusBarHeight + topOffset * 2 + contentHeight;
  const rightReserve = capsule.width ? system.windowWidth - capsule.left + 8 : 96;
  const leftReserve = showBack ? 56 : 24;
  const titleInset = Math.max(leftReserve, rightReserve);

  return {
    navTitle: title,
    showNavBack: showBack,
    navBarStyle: `height:${navHeight}px;padding-top:${statusBarHeight}px;`,
    navContentStyle: `height:${contentHeight}px;line-height:${contentHeight}px;`,
    navTitleStyle: `left:${titleInset}px;right:${titleInset}px;`,
    pageTopStyle: `padding-top:${navHeight}px;`,
  };
}

function goBackWithFallback(fallbackUrl, useSwitchTab) {
  if (getCurrentPages().length > 1) {
    wx.navigateBack();
    return;
  }
  if (fallbackUrl) {
    if (useSwitchTab) {
      wx.switchTab({ url: fallbackUrl });
    } else {
      wx.redirectTo({ url: fallbackUrl });
    }
  }
}

function getCapsuleRect() {
  if (typeof wx !== "undefined" && typeof wx.getMenuButtonBoundingClientRect === "function") {
    try {
      return wx.getMenuButtonBoundingClientRect();
    } catch (error) {
      return {};
    }
  }
  return {};
}

function getSystemInfo() {
  if (typeof wx !== "undefined" && typeof wx.getSystemInfoSync === "function") {
    try {
      return wx.getSystemInfoSync();
    } catch (error) {
      return {};
    }
  }
  return {};
}

module.exports = {
  buildNavState,
  goBackWithFallback,
};
