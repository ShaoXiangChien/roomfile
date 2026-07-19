import { inflateSync } from "node:zlib";

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const SOF_MARKERS = new Set([0xc0, 0xc1, 0xc2]);

export function inspectImage(bytes, options = {}) {
  if (!Buffer.isBuffer(bytes) || bytes.byteLength < (options.minByteSize ?? 64)) {
    throw new Error("Image payload is too small.");
  }
  let image;
  if (bytes.subarray(0, 8).equals(PNG_SIGNATURE)) image = inspectPng(bytes);
  else if (bytes[0] === 0xff && bytes[1] === 0xd8) {
    image = inspectJpeg(bytes, options.minScanBytes ?? 64);
  } else throw new Error("Unsupported image signature.");

  if (options.formats && !options.formats.includes(image.format)) {
    throw new Error(`Expected ${options.formats.join(" or ")}, found ${image.format}.`);
  }
  if (options.width && image.width !== options.width) {
    throw new Error(`Expected width ${options.width}, found ${image.width}.`);
  }
  if (options.height && image.height !== options.height) {
    throw new Error(`Expected height ${options.height}, found ${image.height}.`);
  }
  if (options.maxWidth && image.width > options.maxWidth) {
    throw new Error(`Image width ${image.width} exceeds ${options.maxWidth}.`);
  }
  if (options.maxHeight && image.height > options.maxHeight) {
    throw new Error(`Image height ${image.height} exceeds ${options.maxHeight}.`);
  }
  return image;
}

function inspectJpeg(bytes, minimumScanBytes) {
  const quantizationTables = new Set();
  const huffmanTables = new Set();
  let frame;
  let offset = 2;
  let scanCount = 0;
  let scanBytes = 0;
  let sawEnd = false;

  while (offset < bytes.length) {
    const parsed = markerAt(bytes, offset);
    const marker = parsed.marker;
    offset = parsed.after;
    if (marker === 0xd9) {
      if (offset !== bytes.length) throw new Error("JPEG has trailing data after EOI.");
      sawEnd = true;
      break;
    }
    if (marker === 0xd8 || marker === 0x00 || (marker >= 0xd0 && marker <= 0xd7)) {
      throw new Error("Unexpected JPEG marker outside scan data.");
    }
    if (marker === 0x01) continue;
    const segment = segmentAt(bytes, offset);
    if (marker === 0xdb) parseQuantizationTables(bytes, offset + 2, segment.end, quantizationTables);
    else if (marker === 0xc4) parseHuffmanTables(bytes, offset + 2, segment.end, huffmanTables);
    else if (SOF_MARKERS.has(marker)) {
      if (frame) throw new Error("JPEG contains multiple frames.");
      frame = parseFrame(bytes, offset, segment.length, marker);
    } else if (marker === 0xda) {
      if (!frame) throw new Error("JPEG scan precedes its frame.");
      validateScan(bytes, offset, segment.length, frame, huffmanTables);
      const entropy = scanEntropy(bytes, segment.end);
      scanBytes += entropy.byteCount;
      scanCount += 1;
      offset = entropy.nextMarker;
      continue;
    } else if ((marker >= 0xc0 && marker <= 0xcf) && ![0xc4, 0xc8, 0xcc].includes(marker)) {
      throw new Error(`Unsupported JPEG frame marker 0x${marker.toString(16)}.`);
    }
    offset = segment.end;
  }

  if (!frame || !scanCount || !sawEnd) throw new Error("JPEG frame, scan, or EOI is missing.");
  if (scanBytes < minimumScanBytes) throw new Error("JPEG scan payload is too small to be credible.");
  for (const table of frame.quantizationTables) {
    if (!quantizationTables.has(table)) throw new Error(`JPEG references missing quantization table ${table}.`);
  }
  return { format: "JPEG", width: frame.width, height: frame.height };
}

function markerAt(bytes, offset) {
  if (bytes[offset] !== 0xff) throw new Error("Invalid JPEG marker.");
  while (offset < bytes.length && bytes[offset] === 0xff) offset += 1;
  if (offset >= bytes.length) throw new Error("Truncated JPEG marker.");
  return { marker: bytes[offset], after: offset + 1 };
}

function segmentAt(bytes, offset) {
  if (offset + 2 > bytes.length) throw new Error("Truncated JPEG segment.");
  const length = bytes.readUInt16BE(offset);
  if (length < 2 || offset + length > bytes.length) throw new Error("Invalid JPEG segment length.");
  return { length, end: offset + length };
}

function parseQuantizationTables(bytes, start, end, tables) {
  let cursor = start;
  while (cursor < end) {
    const info = bytes[cursor];
    const precision = info >> 4;
    const id = info & 0x0f;
    const size = precision === 0 ? 64 : precision === 1 ? 128 : 0;
    if (!size || id > 3 || cursor + 1 + size > end) throw new Error("Invalid JPEG quantization table.");
    if (tables.has(id)) throw new Error(`Duplicate JPEG quantization table ${id}.`);
    tables.add(id);
    cursor += 1 + size;
  }
  if (cursor !== end) throw new Error("Truncated JPEG quantization table.");
}

function parseHuffmanTables(bytes, start, end, tables) {
  let cursor = start;
  while (cursor < end) {
    if (cursor + 17 > end) throw new Error("Truncated JPEG Huffman table.");
    const info = bytes[cursor];
    const tableClass = info >> 4;
    const id = info & 0x0f;
    if (tableClass > 1 || id > 3) throw new Error("Invalid JPEG Huffman table selector.");
    let symbols = 0;
    let available = 1;
    for (let index = 1; index <= 16; index += 1) {
      const count = bytes[cursor + index];
      available = (available * 2) - count;
      if (available < 0) throw new Error("Oversubscribed JPEG Huffman table.");
      symbols += count;
    }
    if (!symbols || symbols > 256 || cursor + 17 + symbols > end) {
      throw new Error("Invalid JPEG Huffman symbols.");
    }
    tables.add(`${tableClass}:${id}`);
    cursor += 17 + symbols;
  }
  if (cursor !== end) throw new Error("Truncated JPEG Huffman data.");
}

function parseFrame(bytes, offset, length, marker) {
  if (length < 11) throw new Error("JPEG frame lacks a component table.");
  const precision = bytes[offset + 2];
  const height = bytes.readUInt16BE(offset + 3);
  const width = bytes.readUInt16BE(offset + 5);
  const count = bytes[offset + 7];
  if (precision !== 8 || !width || !height || count < 1 || count > 4 || length !== 8 + (3 * count)) {
    throw new Error("Invalid JPEG frame.");
  }
  const components = new Map();
  const quantizationTables = new Set();
  for (let index = 0; index < count; index += 1) {
    const cursor = offset + 8 + (index * 3);
    const id = bytes[cursor];
    const sampling = bytes[cursor + 1];
    const quantizationTable = bytes[cursor + 2];
    if (
      components.has(id)
      || (sampling >> 4) < 1
      || (sampling >> 4) > 4
      || (sampling & 0x0f) < 1
      || (sampling & 0x0f) > 4
      || quantizationTable > 3
    ) throw new Error("Invalid JPEG frame component.");
    components.set(id, quantizationTable);
    quantizationTables.add(quantizationTable);
  }
  return { marker, width, height, components, quantizationTables };
}

function validateScan(bytes, offset, length, frame, huffmanTables) {
  const count = bytes[offset + 2];
  if (count < 1 || count > frame.components.size || length !== 6 + (2 * count)) {
    throw new Error("Invalid JPEG scan component table.");
  }
  const selectors = new Set();
  for (let index = 0; index < count; index += 1) {
    const cursor = offset + 3 + (index * 2);
    const id = bytes[cursor];
    const tables = bytes[cursor + 1];
    const dc = tables >> 4;
    const ac = tables & 0x0f;
    if (!frame.components.has(id) || selectors.has(id) || dc > 3 || ac > 3) {
      throw new Error("Invalid JPEG scan selector.");
    }
    selectors.add(id);
    if (!huffmanTables.has(`0:${dc}`)) throw new Error(`JPEG references missing DC Huffman table ${dc}.`);
    if (!huffmanTables.has(`1:${ac}`)) throw new Error(`JPEG references missing AC Huffman table ${ac}.`);
  }
  const parameters = offset + 3 + (2 * count);
  const start = bytes[parameters];
  const end = bytes[parameters + 1];
  const approximation = bytes[parameters + 2];
  if (start > end || end > 63 || (approximation >> 4) > 13 || (approximation & 0x0f) > 13) {
    throw new Error("Invalid JPEG scan parameters.");
  }
  if (frame.marker !== 0xc2 && (start !== 0 || end !== 63 || approximation !== 0)) {
    throw new Error("Invalid sequential JPEG scan parameters.");
  }
}

function scanEntropy(bytes, start) {
  let offset = start;
  let byteCount = 0;
  while (offset < bytes.length) {
    if (bytes[offset] !== 0xff) {
      byteCount += 1;
      offset += 1;
      continue;
    }
    const markerStart = offset;
    offset += 1;
    while (offset < bytes.length && bytes[offset] === 0xff) offset += 1;
    if (offset >= bytes.length) throw new Error("Truncated JPEG scan.");
    const marker = bytes[offset];
    if (marker === 0x00) {
      byteCount += 1;
      offset += 1;
      continue;
    }
    if (marker >= 0xd0 && marker <= 0xd7) {
      offset += 1;
      continue;
    }
    return { byteCount, nextMarker: markerStart };
  }
  throw new Error("JPEG scan is truncated.");
}

function inspectPng(bytes) {
  let offset = 8;
  let header;
  let sawData = false;
  let sawEnd = false;
  const data = [];
  while (offset + 12 <= bytes.length) {
    const length = bytes.readUInt32BE(offset);
    const typeStart = offset + 4;
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    const end = dataEnd + 4;
    if (end > bytes.length) throw new Error("Truncated PNG chunk.");
    const type = bytes.subarray(typeStart, dataStart).toString("ascii");
    const expectedCrc = bytes.readUInt32BE(dataEnd);
    const actualCrc = crc32(bytes.subarray(typeStart, dataEnd));
    if (expectedCrc !== actualCrc) throw new Error(`PNG ${type} CRC mismatch.`);
    if (!header && (type !== "IHDR" || length !== 13)) throw new Error("PNG IHDR must be first.");
    if (type === "IHDR") {
      if (header || length !== 13) throw new Error("Invalid PNG IHDR.");
      header = parsePngHeader(bytes.subarray(dataStart, dataEnd));
    } else if (type === "IDAT") {
      if (!header || sawEnd) throw new Error("PNG IDAT is out of order.");
      sawData = true;
      data.push(bytes.subarray(dataStart, dataEnd));
    } else if (type === "IEND") {
      if (length !== 0 || end !== bytes.length || !sawData) throw new Error("Invalid PNG IEND.");
      sawEnd = true;
      break;
    }
    offset = end;
  }
  if (!header || !sawData || !sawEnd) throw new Error("Incomplete PNG.");
  let inflated;
  try {
    inflated = inflateSync(Buffer.concat(data));
  } catch {
    throw new Error("PNG IDAT stream cannot be decompressed.");
  }
  validatePngScanlines(inflated, header);
  return { format: "PNG", width: header.width, height: header.height };
}

function parsePngHeader(bytes) {
  const width = bytes.readUInt32BE(0);
  const height = bytes.readUInt32BE(4);
  const bitDepth = bytes[8];
  const colorType = bytes[9];
  const compression = bytes[10];
  const filter = bytes[11];
  const interlace = bytes[12];
  const allowed = new Map([
    [0, new Set([1, 2, 4, 8, 16])],
    [2, new Set([8, 16])],
    [3, new Set([1, 2, 4, 8])],
    [4, new Set([8, 16])],
    [6, new Set([8, 16])],
  ]);
  if (
    !width
    || !height
    || !allowed.get(colorType)?.has(bitDepth)
    || compression !== 0
    || filter !== 0
    || interlace !== 0
  ) throw new Error("Unsupported or invalid PNG IHDR.");
  return { width, height, bitDepth, colorType };
}

function validatePngScanlines(bytes, header) {
  const channels = new Map([[0, 1], [2, 3], [3, 1], [4, 2], [6, 4]]).get(header.colorType);
  const rowBytes = Math.ceil((header.width * channels * header.bitDepth) / 8);
  const expected = (rowBytes + 1) * header.height;
  if (bytes.byteLength !== expected) throw new Error("PNG decompressed payload length is invalid.");
  for (let row = 0; row < header.height; row += 1) {
    if (bytes[row * (rowBytes + 1)] > 4) throw new Error("PNG scanline has an invalid filter.");
  }
}

function crc32(bytes) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}
