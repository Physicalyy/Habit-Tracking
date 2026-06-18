const { setRequestConfig } = require("./utils/request.js");
const publicConfig = require("./app.config.js");

function loadLocalConfig() {
  try {
    return require("./app.local.config.js");
  } catch (error) {
    return {};
  }
}

setRequestConfig({
  ...publicConfig,
  ...loadLocalConfig(),
});

App({
  globalData: {
    appName: "小小习惯"
  }
});
