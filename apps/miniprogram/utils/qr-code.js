const VERSION = 3;
const SIZE = 29;
const DATA_CODEWORDS = 55;
const ECC_CODEWORDS = 15;
const QUIET_ZONE = 4;
const FORMAT_ECC_L = 1;

const EXP_TABLE = new Array(512);
const LOG_TABLE = new Array(256);

initGaloisTables();

function drawInviteQr(canvasId, page, payload) {
  if (typeof wx === "undefined" || typeof wx.createCanvasContext !== "function") {
    return;
  }

  const modules = createQrModules(String(payload || ""));
  const canvasSize = 220;
  const totalCells = SIZE + QUIET_ZONE * 2;
  const cellSize = Math.floor(canvasSize / totalCells);
  const qrSize = cellSize * totalCells;
  const offset = Math.floor((canvasSize - qrSize) / 2);
  const ctx = wx.createCanvasContext(canvasId, page);

  ctx.setFillStyle("#ffffff");
  ctx.fillRect(0, 0, canvasSize, canvasSize);
  ctx.setFillStyle("#111816");

  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      if (modules[row][col]) {
        ctx.fillRect(
          offset + (col + QUIET_ZONE) * cellSize,
          offset + (row + QUIET_ZONE) * cellSize,
          cellSize,
          cellSize,
        );
      }
    }
  }

  ctx.draw();
}

function createQrModules(text) {
  const dataBits = encodeByteData(text);
  const dataCodewords = bitsToDataCodewords(dataBits);
  const eccCodewords = createErrorCorrection(dataCodewords, ECC_CODEWORDS);
  const allCodewords = dataCodewords.concat(eccCodewords);
  const bits = codewordsToBits(allCodewords);
  const matrix = createBlankMatrix();
  const reserved = createBlankMatrix(false);

  drawFunctionPatterns(matrix, reserved);
  drawCodewords(matrix, reserved, bits);

  let bestMatrix = null;
  let bestMask = 0;
  let bestPenalty = Infinity;

  for (let mask = 0; mask < 8; mask += 1) {
    const candidate = cloneMatrix(matrix);
    applyMask(candidate, reserved, mask);
    drawFormatBits(candidate, reserved, mask);
    const penalty = calculatePenalty(candidate);
    if (penalty < bestPenalty) {
      bestPenalty = penalty;
      bestMask = mask;
      bestMatrix = candidate;
    }
  }

  drawFormatBits(bestMatrix, reserved, bestMask);
  return bestMatrix;
}

function encodeByteData(text) {
  const bytes = toUtf8Bytes(text);
  if (bytes.length > 53) {
    throw new Error("Invite QR payload is too long");
  }

  const bits = [];
  appendBits(bits, 0b0100, 4);
  appendBits(bits, bytes.length, 8);
  for (const byte of bytes) {
    appendBits(bits, byte, 8);
  }

  const capacityBits = DATA_CODEWORDS * 8;
  const terminatorLength = Math.min(4, capacityBits - bits.length);
  appendBits(bits, 0, terminatorLength);
  while (bits.length % 8 !== 0) {
    bits.push(0);
  }

  let pad = 0xec;
  while (bits.length < capacityBits) {
    appendBits(bits, pad, 8);
    pad = pad === 0xec ? 0x11 : 0xec;
  }

  return bits;
}

function bitsToDataCodewords(bits) {
  const codewords = [];
  for (let index = 0; index < bits.length; index += 8) {
    let value = 0;
    for (let offset = 0; offset < 8; offset += 1) {
      value = (value << 1) | bits[index + offset];
    }
    codewords.push(value);
  }
  return codewords;
}

function codewordsToBits(codewords) {
  const bits = [];
  for (const codeword of codewords) {
    appendBits(bits, codeword, 8);
  }
  return bits;
}

function createBlankMatrix(defaultValue) {
  return Array.from({ length: SIZE }, () => Array.from({ length: SIZE }, () => Boolean(defaultValue)));
}

function cloneMatrix(matrix) {
  return matrix.map((row) => row.slice());
}

function drawFunctionPatterns(matrix, reserved) {
  drawFinder(matrix, reserved, 0, 0);
  drawFinder(matrix, reserved, SIZE - 7, 0);
  drawFinder(matrix, reserved, 0, SIZE - 7);
  drawTiming(matrix, reserved);
  drawAlignment(matrix, reserved, 22, 22);
  reserveFormatAreas(reserved);
  setModule(matrix, reserved, 8, SIZE - 8, true);
}

function drawFinder(matrix, reserved, left, top) {
  for (let row = -1; row <= 7; row += 1) {
    for (let col = -1; col <= 7; col += 1) {
      const x = left + col;
      const y = top + row;
      if (!isInside(x, y)) {
        continue;
      }
      const isFinder =
        row >= 0 &&
        row <= 6 &&
        col >= 0 &&
        col <= 6 &&
        (row === 0 || row === 6 || col === 0 || col === 6 || (row >= 2 && row <= 4 && col >= 2 && col <= 4));
      setModule(matrix, reserved, x, y, isFinder);
    }
  }
}

function drawTiming(matrix, reserved) {
  for (let index = 8; index < SIZE - 8; index += 1) {
    setModule(matrix, reserved, index, 6, index % 2 === 0);
    setModule(matrix, reserved, 6, index, index % 2 === 0);
  }
}

function drawAlignment(matrix, reserved, centerX, centerY) {
  for (let row = -2; row <= 2; row += 1) {
    for (let col = -2; col <= 2; col += 1) {
      const isDark = Math.max(Math.abs(row), Math.abs(col)) !== 1;
      setModule(matrix, reserved, centerX + col, centerY + row, isDark);
    }
  }
}

function reserveFormatAreas(reserved) {
  for (let index = 0; index <= 8; index += 1) {
    markReserved(reserved, 8, index);
    markReserved(reserved, index, 8);
  }
  for (let index = 0; index < 8; index += 1) {
    markReserved(reserved, SIZE - 1 - index, 8);
    markReserved(reserved, 8, SIZE - 1 - index);
  }
}

function drawCodewords(matrix, reserved, bits) {
  let bitIndex = 0;
  let upward = true;

  for (let right = SIZE - 1; right >= 1; right -= 2) {
    if (right === 6) {
      right -= 1;
    }

    for (let vertical = 0; vertical < SIZE; vertical += 1) {
      const row = upward ? SIZE - 1 - vertical : vertical;
      for (let offset = 0; offset < 2; offset += 1) {
        const col = right - offset;
        if (reserved[row][col]) {
          continue;
        }
        matrix[row][col] = bitIndex < bits.length ? bits[bitIndex] === 1 : false;
        bitIndex += 1;
      }
    }
    upward = !upward;
  }
}

function applyMask(matrix, reserved, mask) {
  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      if (!reserved[row][col] && shouldMask(mask, row, col)) {
        matrix[row][col] = !matrix[row][col];
      }
    }
  }
}

function shouldMask(mask, row, col) {
  switch (mask) {
    case 0:
      return (row + col) % 2 === 0;
    case 1:
      return row % 2 === 0;
    case 2:
      return col % 3 === 0;
    case 3:
      return (row + col) % 3 === 0;
    case 4:
      return (Math.floor(row / 2) + Math.floor(col / 3)) % 2 === 0;
    case 5:
      return ((row * col) % 2) + ((row * col) % 3) === 0;
    case 6:
      return (((row * col) % 2) + ((row * col) % 3)) % 2 === 0;
    case 7:
      return (((row + col) % 2) + ((row * col) % 3)) % 2 === 0;
    default:
      return false;
  }
}

function drawFormatBits(matrix, reserved, mask) {
  const bits = getFormatBits(mask);
  for (let index = 0; index < 15; index += 1) {
    const dark = ((bits >> index) & 1) === 1;
    const first = FORMAT_POSITIONS_1[index];
    const second = FORMAT_POSITIONS_2[index];
    matrix[first[1]][first[0]] = dark;
    matrix[second[1]][second[0]] = dark;
    reserved[first[1]][first[0]] = true;
    reserved[second[1]][second[0]] = true;
  }
}

const FORMAT_POSITIONS_1 = [
  [8, 0],
  [8, 1],
  [8, 2],
  [8, 3],
  [8, 4],
  [8, 5],
  [8, 7],
  [8, 8],
  [7, 8],
  [5, 8],
  [4, 8],
  [3, 8],
  [2, 8],
  [1, 8],
  [0, 8],
];

const FORMAT_POSITIONS_2 = [
  [SIZE - 1, 8],
  [SIZE - 2, 8],
  [SIZE - 3, 8],
  [SIZE - 4, 8],
  [SIZE - 5, 8],
  [SIZE - 6, 8],
  [SIZE - 7, 8],
  [SIZE - 8, 8],
  [8, SIZE - 7],
  [8, SIZE - 6],
  [8, SIZE - 5],
  [8, SIZE - 4],
  [8, SIZE - 3],
  [8, SIZE - 2],
  [8, SIZE - 1],
];

function getFormatBits(mask) {
  let data = (FORMAT_ECC_L << 3) | mask;
  let value = data << 10;
  const generator = 0x537;
  for (let bit = 14; bit >= 10; bit -= 1) {
    if (((value >> bit) & 1) !== 0) {
      value ^= generator << (bit - 10);
    }
  }
  return (((data << 10) | value) ^ 0x5412) & 0x7fff;
}

function setModule(matrix, reserved, x, y, dark) {
  if (!isInside(x, y)) {
    return;
  }
  matrix[y][x] = dark;
  reserved[y][x] = true;
}

function markReserved(reserved, x, y) {
  if (isInside(x, y)) {
    reserved[y][x] = true;
  }
}

function isInside(x, y) {
  return x >= 0 && x < SIZE && y >= 0 && y < SIZE;
}

function createErrorCorrection(data, eccLength) {
  const generator = createGenerator(eccLength);
  const remainder = Array.from({ length: eccLength }, () => 0);

  for (const codeword of data) {
    const factor = codeword ^ remainder.shift();
    remainder.push(0);
    for (let index = 0; index < eccLength; index += 1) {
      remainder[index] ^= multiply(generator[index], factor);
    }
  }

  return remainder;
}

function createGenerator(degree) {
  let polynomial = [1];
  for (let index = 0; index < degree; index += 1) {
    const next = [1, EXP_TABLE[index]];
    polynomial = multiplyPolynomials(polynomial, next);
  }
  return polynomial.slice(1);
}

function multiplyPolynomials(left, right) {
  const result = Array.from({ length: left.length + right.length - 1 }, () => 0);
  for (let leftIndex = 0; leftIndex < left.length; leftIndex += 1) {
    for (let rightIndex = 0; rightIndex < right.length; rightIndex += 1) {
      result[leftIndex + rightIndex] ^= multiply(left[leftIndex], right[rightIndex]);
    }
  }
  return result;
}

function multiply(left, right) {
  if (left === 0 || right === 0) {
    return 0;
  }
  return EXP_TABLE[LOG_TABLE[left] + LOG_TABLE[right]];
}

function initGaloisTables() {
  let value = 1;
  for (let index = 0; index < 255; index += 1) {
    EXP_TABLE[index] = value;
    LOG_TABLE[value] = index;
    value <<= 1;
    if (value & 0x100) {
      value ^= 0x11d;
    }
  }
  for (let index = 255; index < 512; index += 1) {
    EXP_TABLE[index] = EXP_TABLE[index - 255];
  }
}

function toUtf8Bytes(text) {
  const encoded = encodeURIComponent(text);
  const bytes = [];
  for (let index = 0; index < encoded.length; index += 1) {
    const char = encoded[index];
    if (char === "%") {
      bytes.push(parseInt(encoded.slice(index + 1, index + 3), 16));
      index += 2;
    } else {
      bytes.push(char.charCodeAt(0));
    }
  }
  return bytes;
}

function appendBits(bits, value, length) {
  for (let index = length - 1; index >= 0; index -= 1) {
    bits.push((value >> index) & 1);
  }
}

function calculatePenalty(matrix) {
  return (
    penaltyRuns(matrix) +
    penaltyBlocks(matrix) +
    penaltyFinderLike(matrix) +
    penaltyBalance(matrix)
  );
}

function penaltyRuns(matrix) {
  let penalty = 0;
  for (let row = 0; row < SIZE; row += 1) {
    penalty += countRunPenalty(matrix[row]);
  }
  for (let col = 0; col < SIZE; col += 1) {
    const column = [];
    for (let row = 0; row < SIZE; row += 1) {
      column.push(matrix[row][col]);
    }
    penalty += countRunPenalty(column);
  }
  return penalty;
}

function countRunPenalty(line) {
  let penalty = 0;
  let runColor = line[0];
  let runLength = 1;
  for (let index = 1; index < line.length; index += 1) {
    if (line[index] === runColor) {
      runLength += 1;
    } else {
      if (runLength >= 5) {
        penalty += 3 + (runLength - 5);
      }
      runColor = line[index];
      runLength = 1;
    }
  }
  if (runLength >= 5) {
    penalty += 3 + (runLength - 5);
  }
  return penalty;
}

function penaltyBlocks(matrix) {
  let penalty = 0;
  for (let row = 0; row < SIZE - 1; row += 1) {
    for (let col = 0; col < SIZE - 1; col += 1) {
      const color = matrix[row][col];
      if (
        matrix[row][col + 1] === color &&
        matrix[row + 1][col] === color &&
        matrix[row + 1][col + 1] === color
      ) {
        penalty += 3;
      }
    }
  }
  return penalty;
}

function penaltyFinderLike(matrix) {
  let penalty = 0;
  for (let row = 0; row < SIZE; row += 1) {
    penalty += countFinderLikePenalty(matrix[row]);
  }
  for (let col = 0; col < SIZE; col += 1) {
    const column = [];
    for (let row = 0; row < SIZE; row += 1) {
      column.push(matrix[row][col]);
    }
    penalty += countFinderLikePenalty(column);
  }
  return penalty;
}

function countFinderLikePenalty(line) {
  let penalty = 0;
  const pattern = [true, false, true, true, true, false, true, false, false, false, false];
  const reverse = [false, false, false, false, true, false, true, true, true, false, true];
  for (let index = 0; index <= line.length - 11; index += 1) {
    let matchesPattern = true;
    let matchesReverse = true;
    for (let offset = 0; offset < 11; offset += 1) {
      matchesPattern = matchesPattern && line[index + offset] === pattern[offset];
      matchesReverse = matchesReverse && line[index + offset] === reverse[offset];
    }
    if (matchesPattern || matchesReverse) {
      penalty += 40;
    }
  }
  return penalty;
}

function penaltyBalance(matrix) {
  let darkCount = 0;
  for (let row = 0; row < SIZE; row += 1) {
    for (let col = 0; col < SIZE; col += 1) {
      if (matrix[row][col]) {
        darkCount += 1;
      }
    }
  }
  const percent = (darkCount * 100) / (SIZE * SIZE);
  return Math.floor(Math.abs(percent - 50) / 5) * 10;
}

module.exports = {
  drawInviteQr,
};
