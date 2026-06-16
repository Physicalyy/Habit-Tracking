function drawInviteQr(canvasId, page, payload) {
  if (typeof wx === "undefined" || typeof wx.createCanvasContext !== "function") {
    return;
  }

  const size = 220;
  const cells = 25;
  const cellSize = size / cells;
  const ctx = wx.createCanvasContext(canvasId, page);
  const seed = hashPayload(payload);

  ctx.setFillStyle("#ffffff");
  ctx.fillRect(0, 0, size, size);

  drawFinder(ctx, 1, 1, cellSize);
  drawFinder(ctx, cells - 8, 1, cellSize);
  drawFinder(ctx, 1, cells - 8, cellSize);

  ctx.setFillStyle("#111816");
  for (let row = 0; row < cells; row += 1) {
    for (let col = 0; col < cells; col += 1) {
      if (insideFinder(row, col, cells)) {
        continue;
      }
      const value = (seed + row * 31 + col * 17 + row * col * 7) % 11;
      if (value === 0 || value === 3 || value === 7) {
        ctx.fillRect(col * cellSize, row * cellSize, cellSize + 0.5, cellSize + 0.5);
      }
    }
  }

  ctx.draw();
}

function drawFinder(ctx, col, row, cellSize) {
  ctx.setFillStyle("#111816");
  ctx.fillRect(col * cellSize, row * cellSize, 7 * cellSize, 7 * cellSize);
  ctx.setFillStyle("#ffffff");
  ctx.fillRect((col + 1) * cellSize, (row + 1) * cellSize, 5 * cellSize, 5 * cellSize);
  ctx.setFillStyle("#111816");
  ctx.fillRect((col + 2) * cellSize, (row + 2) * cellSize, 3 * cellSize, 3 * cellSize);
}

function insideFinder(row, col, cells) {
  return (
    (row >= 1 && row <= 7 && col >= 1 && col <= 7) ||
    (row >= 1 && row <= 7 && col >= cells - 8 && col <= cells - 2) ||
    (row >= cells - 8 && row <= cells - 2 && col >= 1 && col <= 7)
  );
}

function hashPayload(payload) {
  const text = String(payload || "");
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 131 + text.charCodeAt(index)) % 1000003;
  }
  return hash;
}

module.exports = {
  drawInviteQr,
};
