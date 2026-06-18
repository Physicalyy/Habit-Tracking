function normalizeAssetPath(path) {
  const value = String(path || "").trim();
  if (!value) {
    return "";
  }
  if (/^(https?:)?\/\//.test(value) || value.startsWith("data:")) {
    return value;
  }
  if (value.startsWith("/assets/")) {
    return value;
  }
  if (value.startsWith("assets/")) {
    return `/${value}`;
  }
  return value;
}

module.exports = {
  normalizeAssetPath,
};
