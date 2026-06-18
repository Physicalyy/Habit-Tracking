const { setRequestConfig } = require("./utils/request.js");

setRequestConfig({
  apiBaseUrl: "http://127.0.0.1:18080",
  testOpenid: "mp-owner-002",
  testNickname: "Owner2",
});

App({
  globalData: {
    appName: "小小习惯"
  }
});
