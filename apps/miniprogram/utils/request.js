const { handleMockRequest } = require("./mock-api.js");

const requestConfig = {
  useMockApi: false,
  apiBaseUrl: "",
  testOpenid: "",
  testNickname: "",
};

function setRequestConfig(nextConfig = {}) {
  Object.assign(requestConfig, nextConfig);
}

function assertOk(response) {
  if (response.code !== "OK") {
    throw new Error(response.message || "请求失败");
  }

  return response;
}

function buildHeaders() {
  const header = {};
  if (requestConfig.testOpenid) {
    header["X-Test-Openid"] = requestConfig.testOpenid;
  }
  if (requestConfig.testNickname) {
    header["X-Test-Nickname"] = requestConfig.testNickname;
  }
  return header;
}

async function request(endpoint, data = {}) {
  if (requestConfig.useMockApi) {
    return assertOk(await handleMockRequest({ endpoint, data }));
  }

  return new Promise((resolve, reject) => {
    wx.request({
      url: requestConfig.apiBaseUrl + endpoint.path,
      method: endpoint.method,
      data,
      header: buildHeaders(),
      success: (response) => {
        try {
          resolve(assertOk(response.data));
        } catch (error) {
          reject(error);
        }
      },
      fail: reject,
    });
  });
}

module.exports = {
  request,
  setRequestConfig,
};
