const STORAGE_KEY = "habit-tracking.mock-session";

let memorySession = null;

const mockUser = Object.freeze({
  id: "user_mock_parent",
  openid: "mock-openid",
  nickname: "新手家长",
});

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function canUseWxStorage() {
  return (
    typeof wx !== "undefined" &&
    typeof wx.getStorageSync === "function" &&
    typeof wx.setStorageSync === "function"
  );
}

function createEmptySession() {
  return {
    token: "mock-token",
    user: clone(mockUser),
    family: null,
    child: null,
    member: null,
    inviteCode: null,
    familyMembers: [],
    childHabits: [],
    checkins: [],
    customTemplates: [],
  };
}

function getMockSession() {
  if (canUseWxStorage()) {
    const stored = wx.getStorageSync(STORAGE_KEY);
    if (stored) {
      return clone(stored);
    }
  }

  if (!memorySession) {
    memorySession = createEmptySession();
  }

  return clone(memorySession);
}

function saveMockSession(session) {
  const nextSession = clone(session);
  memorySession = nextSession;

  if (canUseWxStorage()) {
    wx.setStorageSync(STORAGE_KEY, nextSession);
  }

  return clone(nextSession);
}

function resetMockSession() {
  memorySession = createEmptySession();

  if (
    typeof wx !== "undefined" &&
    typeof wx.removeStorageSync === "function"
  ) {
    wx.removeStorageSync(STORAGE_KEY);
  }

  return clone(memorySession);
}

module.exports = {
  createEmptySession,
  getMockSession,
  saveMockSession,
  resetMockSession,
};
