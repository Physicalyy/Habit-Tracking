const API_ENDPOINTS = Object.freeze({
  WECHAT_LOGIN: Object.freeze({
    method: "POST",
    path: "/auth/wechat-login",
  }),
  ME_BOOTSTRAP: Object.freeze({
    method: "GET",
    path: "/me/bootstrap",
  }),
  CREATE_FAMILY: Object.freeze({
    method: "POST",
    path: "/families",
  }),
  JOIN_FAMILY: Object.freeze({
    method: "POST",
    path: "/families/join",
  }),
});

module.exports = {
  API_ENDPOINTS,
};
