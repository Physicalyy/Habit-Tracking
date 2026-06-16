const { setRequestConfig } = require("./utils/request.js");

setRequestConfig({
  apiBaseUrl: "http://localhost:18080",
  testOpenid: "mp-owner-001",
  testNickname: "Owner",
});

App({
  globalData: {
    appName: "小小习惯"
  }
});
