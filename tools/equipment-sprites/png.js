// Lector/escritor PNG mínimo sobre zlib. Solo lo que hace falta aquí:
// 8 bits por canal, no entrelazado, color type 2 (RGB) o 6 (RGBA).
const fs = require('fs');
const zlib = require('zlib');

const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();

const crc32 = (buf) => {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};

const paeth = (a, b, c) => {
  const p = a + b - c;
  const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  if (pb <= pc) return b;
  return c;
};

/** @returns {{width:number,height:number,data:Buffer}} data = RGBA */
function readPNG(file) {
  const buf = fs.readFileSync(file);
  let pos = 8; // firma
  let width = 0, height = 0, depth = 0, colorType = 0;
  const idat = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    const body = buf.subarray(pos + 8, pos + 8 + len);
    if (type === 'IHDR') {
      width = body.readUInt32BE(0);
      height = body.readUInt32BE(4);
      depth = body[8];
      colorType = body[9];
      if (depth !== 8 || (colorType !== 2 && colorType !== 6)) {
        throw new Error(`${file}: solo 8-bit RGB/RGBA (depth=${depth} type=${colorType})`);
      }
      if (body[12] !== 0) throw new Error(`${file}: entrelazado no soportado`);
    } else if (type === 'IDAT') {
      idat.push(Buffer.from(body));
    } else if (type === 'IEND') break;
    pos += 12 + len;
  }

  const raw = zlib.inflateSync(Buffer.concat(idat));
  const ch = colorType === 6 ? 4 : 3;
  const stride = width * ch;
  const out = Buffer.alloc(width * height * 4);
  const prev = Buffer.alloc(stride);
  const line = Buffer.alloc(stride);

  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const src = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let i = 0; i < stride; i++) {
      const a = i >= ch ? line[i - ch] : 0;
      const b = prev[i];
      const c = i >= ch ? prev[i - ch] : 0;
      let v = src[i];
      if (filter === 1) v += a;
      else if (filter === 2) v += b;
      else if (filter === 3) v += (a + b) >> 1;
      else if (filter === 4) v += paeth(a, b, c);
      line[i] = v & 0xff;
    }
    for (let x = 0; x < width; x++) {
      const s = x * ch, d = (y * width + x) * 4;
      out[d] = line[s];
      out[d + 1] = line[s + 1];
      out[d + 2] = line[s + 2];
      out[d + 3] = ch === 4 ? line[s + 3] : 255;
    }
    line.copy(prev);
  }
  return { width, height, data: out };
}

function writePNG(file, { width, height, data }) {
  const stride = width * 4;
  const raw = Buffer.alloc(height * (stride + 1));
  // Filtro Paeth en todas las filas: sobre degradados y bordes suaves deja los
  // ficheros a la mitad que sin filtrar, y elegir el mejor filtro por fila no
  // aporta lo bastante para el rato que cuesta.
  for (let y = 0; y < height; y++) {
    const row = y * (stride + 1);
    raw[row] = 4;
    for (let i = 0; i < stride; i++) {
      const a = i >= 4 ? data[y * stride + i - 4] : 0;
      const b = y > 0 ? data[(y - 1) * stride + i] : 0;
      const c = y > 0 && i >= 4 ? data[(y - 1) * stride + i - 4] : 0;
      raw[row + 1 + i] = (data[y * stride + i] - paeth(a, b, c)) & 0xff;
    }
  }
  const chunk = (type, body) => {
    const out = Buffer.alloc(body.length + 12);
    out.writeUInt32BE(body.length, 0);
    out.write(type, 4, 'ascii');
    body.copy(out, 8);
    out.writeUInt32BE(crc32(out.subarray(4, 8 + body.length)), 8 + body.length);
    return out;
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  fs.writeFileSync(file, Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]));
}

/** Reescalado por área (box filter), correcto para reducir. */
function resize(img, w, h) {
  const out = Buffer.alloc(w * h * 4);
  const sx = img.width / w, sy = img.height / h;
  for (let y = 0; y < h; y++) {
    const y0 = Math.floor(y * sy), y1 = Math.max(y0 + 1, Math.floor((y + 1) * sy));
    for (let x = 0; x < w; x++) {
      const x0 = Math.floor(x * sx), x1 = Math.max(x0 + 1, Math.floor((x + 1) * sx));
      let r = 0, g = 0, b = 0, a = 0, n = 0;
      for (let yy = y0; yy < y1; yy++) {
        for (let xx = x0; xx < x1; xx++) {
          const i = (yy * img.width + xx) * 4;
          const al = img.data[i + 3] / 255;
          r += img.data[i] * al; g += img.data[i + 1] * al; b += img.data[i + 2] * al;
          a += img.data[i + 3];
          n++;
        }
      }
      const d = (y * w + x) * 4;
      const aa = a / n;
      const norm = aa > 0 ? (n * 255) / a : 0;
      out[d] = Math.round(r / n * norm);
      out[d + 1] = Math.round(g / n * norm);
      out[d + 2] = Math.round(b / n * norm);
      out[d + 3] = Math.round(aa);
    }
  }
  return { width: w, height: h, data: out };
}

function crop(img, x0, y0, w, h) {
  const out = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) {
    img.data.copy(out, y * w * 4, ((y0 + y) * img.width + x0) * 4, ((y0 + y) * img.width + x0 + w) * 4);
  }
  return { width: w, height: h, data: out };
}

module.exports = { readPNG, writePNG, resize, crop };
