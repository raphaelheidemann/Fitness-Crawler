// Run: npx tsx scripts/key-guide.ts <dir with guia_pose_<name>.jpg on #FF00FF> [outDir]
// Chroma-keys the magenta background (soft alpha + despill on the edge, so no light halo),
// then crops every pose to one shared canvas and downsizes it. Needs macOS `sips` for JPG -> PNG.
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { execFileSync } from 'node:child_process';

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


// jpg name -> sprite name used by src/lib/guideSprites.ts
const MAP: Record<string, string> = {
  idle: 'idle', cheer: 'cheer', thumbs: 'thumbs', wave: 'wave', point: 'point', sleep: 'sleep',
  dumbbell: 'flex', fruit: 'eat', read: 'read', think: 'think',
};
const TARGET_H = 256;

const [inDir, outDir = 'src/assets/guide'] = process.argv.slice(2);
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'guide-key-'));

function key(img: Img): Img {
  const { w, h, d } = img;
  const a = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const r = d[i * 4], g = d[i * 4 + 1], b = d[i * 4 + 2];
    const m = Math.min(r, b) - g; // magenta signature: red and blue high, green low
    a[i] = 1 - Math.min(1, Math.max(0, (m - 70) / 100));
  }
  // despill: remove the magenta cast on pixels touching transparency
  const out = new Uint8Array(w * h * 4);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const i = y * w + x;
    let edge = a[i] < 1;
    for (let dy = -2; dy <= 2 && !edge; dy++) for (let dx = -2; dx <= 2; dx++) {
      const xx = x + dx, yy = y + dy;
      if (xx >= 0 && yy >= 0 && xx < w && yy < h && a[yy * w + xx] < 0.5) { edge = true; break; }
    }
    let r = d[i * 4], g = d[i * 4 + 1], b = d[i * 4 + 2];
    if (edge) {
      const spill = Math.max(0, Math.min(r, b) - g);
      r = Math.max(0, r - spill); b = Math.max(0, b - spill);
    }
    out[i * 4] = r; out[i * 4 + 1] = g; out[i * 4 + 2] = b; out[i * 4 + 3] = Math.round(a[i] * 255);
  }
  return { w, h, d: out };
}

const bbox = (img: Img) => {
  let x0 = img.w, y0 = img.h, x1 = -1, y1 = -1;
  for (let y = 0; y < img.h; y++) for (let x = 0; x < img.w; x++) if (img.d[(y * img.w + x) * 4 + 3] > 24) {
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  return { x0, y0, x1, y1 };
};

const keyed = Object.entries(MAP).map(([jpg, name]) => {
  const file = fs.readdirSync(inDir).find((f) => f.startsWith(`guia_pose_${jpg}_`) || f === `guia_pose_${jpg}.jpg`);
  if (!file) throw new Error(`missing guia_pose_${jpg}*`);
  const png = path.join(tmp, `${jpg}.png`);
  execFileSync('sips', ['-s', 'format', 'png', path.join(inDir, file), '--out', png], { stdio: 'ignore' });
  const img = key(decodePng(fs.readFileSync(png)));
  return { name, img, box: bbox(img) };
});

// one shared canvas so poses line up when the Guia switches frames; feet stay on the bottom
const W = Math.max(...keyed.map((k) => k.box.x1 - k.box.x0 + 1)) + 8;
const H = Math.max(...keyed.map((k) => k.box.y1 - k.box.y0 + 1)) + 8;
const scale = TARGET_H / H;
const ow = Math.round(W * scale), oh = TARGET_H;

fs.mkdirSync(outDir, { recursive: true });
for (const { name, img, box } of keyed) {
  const bw = box.x1 - box.x0 + 1, bh = box.y1 - box.y0 + 1;
  const offX = Math.floor((W - bw) / 2) - box.x0, offY = H - 4 - bh - box.y0;
  // box downscale on premultiplied alpha
  const o = new Uint8Array(ow * oh * 4);
  for (let y = 0; y < oh; y++) for (let x = 0; x < ow; x++) {
    const sx0 = x / scale, sx1 = (x + 1) / scale, sy0 = y / scale, sy1 = (y + 1) / scale;
    let r = 0, g = 0, b = 0, al = 0, n = 0;
    for (let sy = Math.floor(sy0); sy < Math.ceil(sy1); sy++) for (let sx = Math.floor(sx0); sx < Math.ceil(sx1); sx++) {
      const px = sx - offX, py = sy - offY; // canvas -> source
      n++;
      if (px < 0 || py < 0 || px >= img.w || py >= img.h) continue;
      const i = (py * img.w + px) * 4, A = img.d[i + 3];
      r += img.d[i] * A; g += img.d[i + 1] * A; b += img.d[i + 2] * A; al += A;
    }
    const t = (y * ow + x) * 4;
    if (al > 0) { o[t] = r / al; o[t + 1] = g / al; o[t + 2] = b / al; o[t + 3] = Math.round(al / n); }
  }
  fs.writeFileSync(path.join(outDir, `guide_${name}.png`), encodePng({ w: ow, h: oh, d: o }));
}
console.log(`wrote ${keyed.length} sprites, ${ow}x${oh}`);
