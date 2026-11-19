// Run: npx tsx scripts/slice-guide.ts <sheet.png> [outDir]
// Cuts the Guia mascot sheet into transparent poses (no dependencies besides node).
// Sheet layout: 2 rows x 4 poses, then a mini sprite and a round icon.
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

type Img = { w: number; h: number; d: Uint8Array }; // RGBA

function decodePng(buf: Buffer): Img {
  let pos = 8, w = 0, h = 0, ct = 0;
  const idat: Buffer[] = [];
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.toString('ascii', pos + 4, pos + 8);
    const data = buf.subarray(pos + 8, pos + 8 + len);
    if (type === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); ct = data[9]; if (data[8] !== 8 || data[12] !== 0) throw new Error('need 8-bit non-interlaced PNG'); }
    if (type === 'IDAT') idat.push(data);
    pos += 12 + len;
  }
  const bpp = ct === 6 ? 4 : ct === 2 ? 3 : 0;
  if (!bpp) throw new Error('need RGB/RGBA PNG');
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = w * bpp;
  const px = new Uint8Array(h * stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)];
    for (let x = 0; x < stride; x++) {
      const v = raw[y * (stride + 1) + 1 + x];
      const a = x >= bpp ? px[y * stride + x - bpp] : 0;
      const b = y > 0 ? px[(y - 1) * stride + x] : 0;
      const c = x >= bpp && y > 0 ? px[(y - 1) * stride + x - bpp] : 0;
      let r = v;
      if (f === 1) r = v + a; else if (f === 2) r = v + b; else if (f === 3) r = v + ((a + b) >> 1);
      else if (f === 4) { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); r = v + (pa <= pb && pa <= pc ? a : pb <= pc ? b : c); }
      px[y * stride + x] = r & 255;
    }
  }
  const d = new Uint8Array(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    d[i * 4] = px[i * bpp]; d[i * 4 + 1] = px[i * bpp + 1]; d[i * 4 + 2] = px[i * bpp + 2];
    d[i * 4 + 3] = bpp === 4 ? px[i * 4 + 3] : 255;
  }
  return { w, h, d };
}

const crcTable = Array.from({ length: 256 }, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc = (b: Buffer) => { let c = 0xffffffff; for (const x of b) c = crcTable[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
function chunk(type: string, data: Buffer) {
  const t = Buffer.from(type, 'ascii'); const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const c = Buffer.alloc(4); c.writeUInt32BE(crc(Buffer.concat([t, data]))); return Buffer.concat([len, t, data, c]);
}
function encodePng(img: Img): Buffer {
  const raw = Buffer.alloc(img.h * (img.w * 4 + 1));
  for (let y = 0; y < img.h; y++) { raw[y * (img.w * 4 + 1)] = 0; Buffer.from(img.d.buffer, y * img.w * 4, img.w * 4).copy(raw, y * (img.w * 4 + 1) + 1); }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(img.w, 0); ihdr.writeUInt32BE(img.h, 4); ihdr[8] = 8; ihdr[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

const [sheet, outDir = 'src/assets/guide'] = process.argv.slice(2);
const img = decodePng(fs.readFileSync(sheet));
const { w, h, d } = img;

// background = most common corner colour; flood-fill from the border with a tolerance
const bg = [d[0], d[1], d[2]];
const near = (i: number, tol: number) => Math.abs(d[i * 4] - bg[0]) + Math.abs(d[i * 4 + 1] - bg[1]) + Math.abs(d[i * 4 + 2] - bg[2]) <= tol;
const isBg = new Uint8Array(w * h);
const stack: number[] = [];
for (let x = 0; x < w; x++) stack.push(x, (h - 1) * w + x);
for (let y = 0; y < h; y++) stack.push(y * w, y * w + w - 1);
while (stack.length) {
  const i = stack.pop()!;
  if (isBg[i] || !near(i, 60)) continue;
  isBg[i] = 1;
  const x = i % w;
  if (x > 0) stack.push(i - 1); if (x < w - 1) stack.push(i + 1);
  if (i >= w) stack.push(i - w); if (i < w * (h - 1)) stack.push(i + w);
}
for (let i = 0; i < w * h; i++) if (isBg[i]) d[i * 4 + 3] = 0;

// group foreground pixels into sprites: connected components of the mask dilated by R px
const R = 3;
const horiz = new Uint8Array(w * h);
for (let y = 0; y < h; y++) {
  let last = -1e9;
  const fwd = new Int32Array(w);
  for (let x = 0; x < w; x++) { if (!isBg[y * w + x]) last = x; fwd[x] = last; }
  last = 1e9;
  for (let x = w - 1; x >= 0; x--) {
    if (!isBg[y * w + x]) last = x;
    if (x - fwd[x] <= R || last - x <= R) horiz[y * w + x] = 1;
  }
}
const dil = new Uint8Array(w * h);
for (let x = 0; x < w; x++) {
  let last = -1e9;
  const fwd = new Int32Array(h);
  for (let y = 0; y < h; y++) { if (horiz[y * w + x]) last = y; fwd[y] = last; }
  last = 1e9;
  for (let y = h - 1; y >= 0; y--) {
    if (horiz[y * w + x]) last = y;
    if (y - fwd[y] <= R || last - y <= R) dil[y * w + x] = 1;
  }
}
const seen = new Uint8Array(w * h);
const boxes: { x0: number; y0: number; x1: number; y1: number }[] = [];
for (let i0 = 0; i0 < w * h; i0++) {
  if (!dil[i0] || seen[i0]) continue;
  const bb = { x0: w, y0: h, x1: -1, y1: -1 };
  const st = [i0]; seen[i0] = 1;
  while (st.length) {
    const i = st.pop()!; const x = i % w, y = (i - x) / w;
    if (!isBg[i]) { bb.x0 = Math.min(bb.x0, x); bb.x1 = Math.max(bb.x1, x); bb.y0 = Math.min(bb.y0, y); bb.y1 = Math.max(bb.y1, y); }
    for (const n of [x > 0 ? i - 1 : -1, x < w - 1 ? i + 1 : -1, y > 0 ? i - w : -1, y < h - 1 ? i + w : -1]) {
      if (n >= 0 && dil[n] && !seen[n]) { seen[n] = 1; st.push(n); }
    }
  }
  if (bb.x1 >= 0) boxes.push(bb);
}
const area = (b: { x0: number; y0: number; x1: number; y1: number }) => (b.x1 - b.x0) * (b.y1 - b.y0);
const sprites = boxes.filter((b) => area(b) > 4000);
// small leftovers (a dumbbell tip, a spoon) join the closest sprite
for (const small of boxes.filter((b) => area(b) <= 4000)) {
  const gap = (b: typeof small) => Math.hypot(Math.max(b.x0 - small.x1, small.x0 - b.x1, 0), Math.max(b.y0 - small.y1, small.y0 - b.y1, 0));
  const target = sprites.reduce((a, b) => (gap(b) < gap(a) ? b : a));
  if (gap(target) < 25) {
    target.x0 = Math.min(target.x0, small.x0); target.y0 = Math.min(target.y0, small.y0);
    target.x1 = Math.max(target.x1, small.x1); target.y1 = Math.max(target.y1, small.y1);
  }
}
if (process.env.DEBUG) console.log(boxes.map((b) => [b.x0, b.y0, b.x1, b.y1].join(",")).join("  "));
if (sprites.length !== 10) throw new Error(`expected 10 sprites, found ${sprites.length}`);

const cy = (b: { y0: number; y1: number }) => (b.y0 + b.y1) / 2;
sprites.sort((a, b) => cy(a) - cy(b));
const rows = [sprites.slice(0, 4), sprites.slice(4, 8)].map((r) => r.sort((a, b) => a.x0 - b.x0));
const tail = sprites.slice(8).sort((a, b) => a.x0 - b.x0); // mini, icon
const NAMES = ['idle', 'cheer', 'thumbs', 'flex', 'eat', 'sleep', 'wave', 'point'];

function crop(b: { x0: number; y0: number; x1: number; y1: number }, W: number, H: number, anchorBottom: boolean): Img {
  const out = new Uint8Array(W * H * 4);
  const bw = b.x1 - b.x0 + 1, bh = b.y1 - b.y0 + 1;
  const ox = Math.floor((W - bw) / 2), oy = anchorBottom ? H - bh : Math.floor((H - bh) / 2);
  for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) {
    const s = ((b.y0 + y) * w + b.x0 + x), t = ((oy + y) * W + ox + x) * 4;
    if (isBg[s]) continue;
    out[t] = d[s * 4]; out[t + 1] = d[s * 4 + 1]; out[t + 2] = d[s * 4 + 2]; out[t + 3] = 255;
  }
  return { w: W, h: H, d: out };
}

fs.mkdirSync(outDir, { recursive: true });
const poses = rows.flat();
const W = Math.max(...poses.map((b) => b.x1 - b.x0 + 1)) + 4;
const H = Math.max(...poses.map((b) => b.y1 - b.y0 + 1)) + 4;
poses.forEach((b, i) => fs.writeFileSync(path.join(outDir, `guide_${NAMES[i]}.png`), encodePng(crop(b, W, H, true))));
[['mini', tail[0]], ['icon', tail[1]]].forEach(([n, b]) => {
  const bb = b as typeof tail[0];
  const side = Math.max(bb.x1 - bb.x0, bb.y1 - bb.y0) + 5;
  fs.writeFileSync(path.join(outDir, `guide_${n}.png`), encodePng(crop(bb, side, side, false)));
});
console.log(`wrote ${poses.length + 2} sprites, pose canvas ${W}x${H}`);
