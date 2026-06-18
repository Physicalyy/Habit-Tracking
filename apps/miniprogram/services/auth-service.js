const { API_ENDPOINTS } = require("../core/api.js");
const { request } = require("../utils/request.js");
const { saveSession } = require("./session-state.js");

async function wechatLogin(code) {
  const result = await request(API_ENDPOINTS.WECHAT_LOGIN, { code }, { skipAuth: true });
  return result.data;
}

function getWxLoginCode() {
  return new Promise((resolve, reject) => {
    wx.login({
      success: (response) => {
        if (response && response.code) {
          resolve(response.code);
          return;
        }
        reject(new Error("微信登录失败"));
      },
      fail: reject,
    });
  });
}

async function login() {
  const code = await getWxLoginCode();
  const session = await wechatLogin(code);
  saveSession(session);
  return session;
}

module.exports = {
  wechatLogin,
  login,
};
