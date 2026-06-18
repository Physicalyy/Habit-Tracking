const defaultFeedbackState = Object.freeze({
  feedbackVisible: false,
  feedbackText: "",
  feedbackType: "info",
  feedbackClass: "inline-feedback inline-feedback-info",
});

function buildFeedbackClass(type) {
  const normalizedType = type === "success" || type === "error" ? type : "info";
  return `inline-feedback inline-feedback-${normalizedType}`;
}

function showInlineFeedback(page, text, type = "info", duration = 2400) {
  if (!page || !text) {
    return;
  }
  if (page.__inlineFeedbackTimer) {
    clearTimeout(page.__inlineFeedbackTimer);
  }
  page.setData({
    feedbackVisible: true,
    feedbackText: text,
    feedbackType: type,
    feedbackClass: buildFeedbackClass(type),
  });
  page.__inlineFeedbackTimer = setTimeout(() => {
    hideInlineFeedback(page);
  }, duration);
}

function hideInlineFeedback(page) {
  if (!page) {
    return;
  }
  if (page.__inlineFeedbackTimer) {
    clearTimeout(page.__inlineFeedbackTimer);
    page.__inlineFeedbackTimer = null;
  }
  page.setData(defaultFeedbackState);
}

module.exports = {
  defaultFeedbackState,
  showInlineFeedback,
  hideInlineFeedback,
};
