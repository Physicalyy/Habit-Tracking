function syncCustomTabBar(page, selected) {
  if (!page || typeof page.getTabBar !== "function") {
    return;
  }

  const tabBar = page.getTabBar();
  if (tabBar) {
    tabBar.setData({ selected });
  }
}

module.exports = {
  syncCustomTabBar,
};
