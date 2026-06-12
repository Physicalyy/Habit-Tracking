const { handleMockRequest } = require("./mock-api.js");

const USE_MOCK_API = true;
const API_BASE_URL = "";

function assertOk(response) {
  if (response.code !== "OK") {
    throw new Error(response.message || "请求失败");
  }

  return response;
}

async function request(endpoint, data = {}) {
  if (USE_MOCK_API) {
    return assertOk(await handleMockRequest({ endpoint, data }));
  }

  return new Promise((resolve, reject) => {
    wx.request({
      url: API_BASE_URL + endpoint.path,
      method: endpoint.method,
      data,
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
};
