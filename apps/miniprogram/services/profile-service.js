const { API_ENDPOINTS } = require("../core/api.js");
const { request, getApiBaseUrl, getAuthHeader } = require("../utils/request.js");

const PROFILE_PROMPT_SKIPPED_KEY = "habit-tracking.profile-prompt-skipped";

function canUseWxStorage() {
  return (
    typeof wx !== "undefined" &&
    typeof wx.getStorageSync === "function" &&
    typeof wx.setStorageSync === "function" &&
    typeof wx.removeStorageSync === "function"
  );
}

function isProfilePromptSkipped() {
  if (!canUseWxStorage()) {
    return false;
  }
  return Boolean(wx.getStorageSync(PROFILE_PROMPT_SKIPPED_KEY));
}

function skipProfilePrompt() {
  if (canUseWxStorage()) {
    wx.setStorageSync(PROFILE_PROMPT_SKIPPED_KEY, true);
  }
}

function clearProfilePromptSkipped() {
  if (canUseWxStorage()) {
    wx.removeStorageSync(PROFILE_PROMPT_SKIPPED_KEY);
  }
}

function shouldPromptProfile(user) {
  return Boolean(user && user.profileCompleted === false && !isProfilePromptSkipped());
}

function buildAvatarImageUrl(avatarUrl) {
  const value = String(avatarUrl || "").trim();
  if (!value) {
    return "";
  }
  if (/^https?:\/\//.test(value)) {
    return value;
  }
  return `${getApiBaseUrl()}${value}`;
}

function isUnauthorizedUpload(response, body) {
  return response.statusCode === 401 || (body && body.code === "UNAUTHORIZED");
}

async function refreshLoginForUpload() {
  const { clearSession } = require("./session-state.js");
  const authService = require("./auth-service.js");
  clearSession();
  await authService.login();
}

async function uploadAvatar(filePath) {
  try {
    return await sendAvatarUpload(filePath);
  } catch (error) {
    if (error && error.code === "UNAUTHORIZED") {
      await refreshLoginForUpload();
      return sendAvatarUpload(filePath);
    }
    throw error;
  }
}

function sendAvatarUpload(filePath) {
  return new Promise((resolve, reject) => {
    wx.uploadFile({
      url: getApiBaseUrl() + API_ENDPOINTS.ME_AVATAR.path,
      filePath,
      name: "file",
      header: getAuthHeader(),
      success: (response) => {
        let body = null;
        try {
          body = JSON.parse(response.data || "{}");
        } catch (error) {
          reject(new Error("头像上传失败"));
          return;
        }
        if (isUnauthorizedUpload(response, body)) {
          const error = new Error(body.message || "登录已失效");
          error.code = "UNAUTHORIZED";
          reject(error);
          return;
        }
        if (body.code !== "OK") {
          reject(new Error(body.message || "头像上传失败"));
          return;
        }
        resolve(body.data.avatarUrl);
      },
      fail: reject,
    });
  });
}

async function updateProfile(profile) {
  const result = await request(API_ENDPOINTS.ME_PROFILE, {
    nickname: profile.nickname,
    avatarUrl: profile.avatarUrl,
  });
  clearProfilePromptSkipped();
  return result.data;
}

module.exports = {
  PROFILE_PROMPT_SKIPPED_KEY,
  uploadAvatar,
  updateProfile,
  shouldPromptProfile,
  skipProfilePrompt,
  isProfilePromptSkipped,
  buildAvatarImageUrl,
};
