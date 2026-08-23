// Saca el sprite del objeto de la carta física (762x1068) y lo deja en PNG con
// fondo transparente, listo para usar como icono del item adjunto.
//
// Las 18 cartas comparten EXACTAMENTE la misma foto de escena detrás del
// objeto — píxel a píxel, diferencia cero. Así que no hace falta adivinar la
// silueta: se reconstruye ese fondo común y se resta. Lo que no coincide con
// él es el objeto.
//
// El fondo se reconstruye por moda: para cada píxel se mira su valor en las 18
// cartas y se toma el que más veces se repite EXACTO. Donde hay fondo el valor
// se repite decenas de veces idéntico; donde hay objeto, cada carta trae un
// color distinto y no gana la votación. Por eso la moda y no la media o la
// mediana, que se contaminarían en el centro, que es justo donde todas las
// cartas tienen objeto.
const path = require('path');
const fs = require('fs');
const { readPNG, writePNG, resize, crop } = require('./png');

// Ventana de arte de la plantilla, medida sobre Black_Belt: el marco rosa
// (228,22,125) llega a y=129 por arriba y arranca en y=492 por abajo; en
// horizontal va de x=67 a x=694. Se mete 8px hacia dentro para no arrastrar el
// filo del marco.
const WIN = { x: 75, y: 138, w: 612, h: 346 };

// Cuánto se tiene que separar un píxel del fondo para contar como objeto. Los
// umbrales son bajos a propósito: las cartas son PNG sin pérdida y el fondo es
// el mismo bit a bit, así que donde no hay objeto la diferencia es CERO, y
// cualquier desvío ya es dibujo. Entre los dos umbrales el alfa va subiendo:
// ahí caen los píxeles del borde, que en la carta ya venían mezclados con el
// fondo, y esa rampa es la que evita que la silueta quede dentada.
const DIFF_LO = 3;
const DIFF_HI = 18;

// Un píxel del fondo se repite idéntico en muchas cartas; con menos de esto la
// votación no es de fiar y se prefiere no borrar nada.
const MIN_VOTES = 2;

// Motas sueltas de la foto que pasan el umbral (un reflejo, un borde con
// compresión). Por debajo de esta parte del objeto, fuera.
const MIN_BLOB = 0.08;

const OUT_SIZE = 300; // lado máximo del sprite final

/** Ventanas de arte de todas las cartas, en el orden de los ficheros. */
function readWindows(dir) {
  return fs.readdirSync(dir)
    .filter(f => f.toLowerCase().endsWith('.png'))
    .sort()
    .map(name => ({ name, win: crop(readPNG(path.join(dir, name)), WIN.x, WIN.y, WIN.w, WIN.h) }));
}

/** El fondo común, por votación de valores exactos. */
function buildBackground(windows) {
  const { width: w, height: h } = windows[0].win;
  const bg = Buffer.alloc(w * h * 4);
  const votes = new Uint8Array(w * h);
  const tally = new Map();

  for (let p = 0; p < w * h; p++) {
    tally.clear();
    for (const { win } of windows) {
      const i = p * 4;
      const key = (win.data[i] << 16) | (win.data[i + 1] << 8) | win.data[i + 2];
      tally.set(key, (tally.get(key) || 0) + 1);
    }
    let bestKey = 0, bestCount = 0;
    for (const [key, count] of tally) {
      if (count > bestCount) { bestCount = count; bestKey = key; }
    }
    bg[p * 4] = (bestKey >> 16) & 0xff;
    bg[p * 4 + 1] = (bestKey >> 8) & 0xff;
    bg[p * 4 + 2] = bestKey & 0xff;
    bg[p * 4 + 3] = 255;
    votes[p] = Math.min(255, bestCount);
  }
  return { bg: { width: w, height: h, data: bg }, votes };
}

/** Sprite recortado de una carta, dado el fondo común. */
function extract(win, bg, votes) {
  const { width: w, height: h, data } = win;
  const n = w * h;

  // 1) alfa por distancia al fondo, con rampa en el borde
  const alpha = new Uint8Array(n);
  for (let p = 0; p < n; p++) {
    const i = p * 4;
    // Sin votos suficientes no se sabe qué había detrás; se deja opaco y que
    // decida el recorte por grupos.
    if (votes[p] < MIN_VOTES) { alpha[p] = 255; continue; }
    const d = Math.max(
      Math.abs(data[i] - bg.data[i]),
      Math.abs(data[i + 1] - bg.data[i + 1]),
      Math.abs(data[i + 2] - bg.data[i + 2]),
    );
    alpha[p] = d <= DIFF_LO ? 0
      : d >= DIFF_HI ? 255
      : Math.round(((d - DIFF_LO) / (DIFF_HI - DIFF_LO)) * 255);
  }

  // 2) quedarse con el objeto y tirar las motas: los grupos se hacen sobre lo
  //    que es claramente objeto, y luego se recupera su borde suave
  const solid = new Uint8Array(n);
  for (let p = 0; p < n; p++) solid[p] = alpha[p] > 200 ? 1 : 0;
  const blobs = blobsOf(solid, w, h);
  if (!blobs.length) throw new Error('no se encontró ningún objeto');
  const keep = new Uint8Array(n);
  const biggest = blobs[0].length;
  for (const blob of blobs) {
    // Las piezas legítimas sueltas (la segunda lente de unas gafas, un eslabón
    // de la cadena) son del orden del cuerpo; una mota de fondo, no.
    if (blob.length < biggest * MIN_BLOB) break;
    for (const i of blob) keep[i] = 1;
  }
  // el borde semitransparente cuelga de lo que se ha conservado
  const body = dilateWithin(keep, alpha, w, h, 3);
  for (let p = 0; p < n; p++) if (!body[p]) alpha[p] = 0;

  // Los huecos que quedan por dentro NO se rellenan: en estos objetos son de
  // verdad —el bucle del cinturón, el ojo del asa, el aire entre las patillas
  // de las gafas— y por ahí se ve la escena, que es justo lo que hay que
  // quitar.

  // 3) recortar a la caja del objeto
  let x0 = w, y0 = h, x1 = -1, y1 = -1;
  for (let p = 0; p < n; p++) {
    if (!alpha[p]) continue;
    const x = p % w, y = (p / w) | 0;
    if (x < x0) x0 = x; if (x > x1) x1 = x;
    if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  const bw = x1 - x0 + 1, bh = y1 - y0 + 1;
  const out = Buffer.alloc(bw * bh * 4);
  for (let y = 0; y < bh; y++) {
    for (let x = 0; x < bw; x++) {
      const p = (y + y0) * w + (x + x0);
      const s = p * 4, d = (y * bw + x) * 4;
      out[d] = data[s]; out[d + 1] = data[s + 1]; out[d + 2] = data[s + 2];
      out[d + 3] = alpha[p];
    }
  }
  const sprite = { width: bw, height: bh, data: out };

  const scale = Math.min(1, OUT_SIZE / Math.max(bw, bh));
  const final = scale < 1
    ? resize(sprite, Math.round(bw * scale), Math.round(bh * scale))
    : sprite;
  return { final, box: { bw, bh }, pieces: blobs.filter(b => b.length >= biggest * MIN_BLOB).length };
}

/** Grupos conexos de una máscara, del más grande al más pequeño. */
function blobsOf(mask, w, h) {
  const seen = new Uint8Array(w * h);
  const out = [];
  for (let s = 0; s < w * h; s++) {
    if (!mask[s] || seen[s]) continue;
    const blob = [];
    const q = [s];
    seen[s] = 1;
    while (q.length) {
      const i = q.pop();
      blob.push(i);
      const x = i % w, y = (i / w) | 0;
      if (x > 0 && mask[i - 1] && !seen[i - 1]) { seen[i - 1] = 1; q.push(i - 1); }
      if (x < w - 1 && mask[i + 1] && !seen[i + 1]) { seen[i + 1] = 1; q.push(i + 1); }
      if (y > 0 && mask[i - w] && !seen[i - w]) { seen[i - w] = 1; q.push(i - w); }
      if (y < h - 1 && mask[i + w] && !seen[i + w]) { seen[i + w] = 1; q.push(i + w); }
    }
    out.push(blob);
  }
  return out.sort((a, b) => b.length - a.length);
}

/** Crece `seed` n pasos por donde `bound` no sea cero. */
function dilateWithin(seed, bound, w, h, steps) {
  let cur = new Uint8Array(seed);
  for (let s = 0; s < steps; s++) {
    const next = new Uint8Array(cur);
    for (let i = 0; i < w * h; i++) {
      if (cur[i] || !bound[i]) continue;
      const x = i % w, y = (i / w) | 0;
      if ((x > 0 && cur[i - 1]) || (x < w - 1 && cur[i + 1]) ||
          (y > 0 && cur[i - w]) || (y < h - 1 && cur[i + w])) next[i] = 1;
    }
    cur = next;
  }
  return cur;
}

module.exports = { readWindows, buildBackground, extract, WIN };

// ── CLI ──────────────────────────────────────────────────────────────────────
if (require.main === module) {
  const [, , srcDir, dstDir] = process.argv;
  fs.mkdirSync(dstDir, { recursive: true });
  const windows = readWindows(srcDir);
  const { bg, votes } = buildBackground(windows);
  writePNG(path.join(dstDir, '_fondo.png'), bg);
  for (const { name, win } of windows) {
    try {
      const { final, box, pieces } = extract(win, bg, votes);
      writePNG(path.join(dstDir, name), final);
      console.log(`${name.padEnd(20)} ${box.bw}x${box.bh} → ${final.width}x${final.height}  ${pieces} pieza(s)`);
    } catch (e) {
      console.log(`${name.padEnd(20)} ERROR: ${e.message}`);
    }
  }
}
