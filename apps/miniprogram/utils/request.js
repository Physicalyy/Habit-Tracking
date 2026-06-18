const { handleMockRequest } = require("./mock-api.js");
const { getSession, clearSession } = require("../services/session-state.js");
const { API_ENDPOINTS } = require("../core/api.js");

const requestConfig = {
  useMockApi: false,
  apiBaseUrl: "",
};

function setRequestConfig(nextConfig = {}) {
  Object.assign(requestConfig, nextConfig);
}

function getApiBaseUrl() {
  return requestConfig.apiBaseUrl || "";
}

function createRequestError(response, statusCode) {
  const error = new Error(response && response.message ? response.message : "请求失败");
  error.code = response && response.code ? response.code : "REQUEST_FAILED";
  error.statusCode = statusCode || 0;
  error.response = response;
  return error;
}

function assertOk(response, statusCode) {
  if (response.code !== "OK") {
    throw createRequestError(response, statusCode);
  }

  return response;
}

function buildHeaders(options = {}) {
  const header = {};
  if (!options.skipAuth) {
    const session = getSession();
    if (session && session.token) {
      header.Authorization = `Bearer ${session.token}`;
    }
  }
  return header;
}

function getAuthHeader() {
  return buildHeaders();
}

function isUnauthorized(error) {
  return error && (error.statusCode === 401 || error.code === "UNAUTHORIZED");
}

function isLoginEndpoint(endpoint) {
  return endpoint === API_ENDPOINTS.WECHAT_LOGIN;
}

async function loginSilently() {
  const authService = require("../services/auth-service.js");
  return authService.login();
}

function showLoginExpired() {
  if (typeof wx !== "undefined" && typeof wx.showToast === "function") {
    wx.showToast({
      title: "登录已失效",
      icon: "none",
    });
  }
}

async function request(endpoint, data = {}, options = {}) {
  if (requestConfig.useMockApi) {
    return assertOk(await handleMockRequest({ endpoint, data }));
  }

  const shouldAuthenticate = !options.skipAuth && !isLoginEndpoint(endpoint);
  if (shouldAuthenticate) {
    const session = getSession();
    if (!session || !session.token) {
      await loginSilently();
    }
  }

  try {
    return await sendRequest(endpoint, data, options);
  } catch (error) {
    if (!shouldAuthenticate || options.retried || !isUnauthorized(error)) {
      throw error;
    }

    clearSession();
    await loginSilently();
    try {
      return await sendRequest(endpoint, data, { ...options, retried: true });
    } catch (retryError) {
      if (isUnauthorized(retryError)) {
        clearSession();
        showLoginExpired();
      }
      throw retryError;
    }
  }
}

async function sendRequest(endpoint, data = {}, options = {}) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: requestConfig.apiBaseUrl + endpoint.path,
      method: endpoint.method,
      data,
      header: buildHeaders(options),
      success: (response) => {
        try {
          resolve(assertOk(response.data, response.statusCode));
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
  getApiBaseUrl,
  getAuthHeader,
};
