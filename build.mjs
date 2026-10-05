// Renders template.html + content/*.json into dist/ (the deployed site).
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import sharp from 'sharp';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(ROOT, 'dist');
const IMG_EXT = /\.(jpe?g|png|webp|gif|avif)$/i;

fs.rmSync(DIST, { recursive: true, force: true });
fs.mkdirSync(path.join(DIST, 'gen'), { recursive: true });

// ---------- content ----------
const data = {};
for (const f of fs.readdirSync(path.join(ROOT, 'content'))) {
  if (!f.endsWith('.json')) continue;
  const key = f.replace('.json', '').replace(/-/g, '_');
  data[key] = JSON.parse(fs.readFileSync(path.join(ROOT, 'content', f), 'utf8'));
}

// derived values for editors' simple choices
const PHASE_LABELS = { done: 'Dokončeno', active: 'Probíhá' };
for (const p of data.projekt?.phases ?? []) {
  p.status = p.status === 'active' ? 'active' : 'done';
  p.status_label = PHASE_LABELS[p.status];
}
for (const r of data.projekt?.reports ?? []) {
  r.href = r.file || r.url || '#';
  const ext = (r.href.split('?')[0].match(/\.(\w+)$/) || [])[1];
  r.type_label = ext && ext.length <= 4 ? ext.toUpperCase() : 'Odkaz';
  if (r.file) r.href = r.file.replace(/^\//, '');
}

// ---------- text helpers ----------
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
// Czech typography: never leave a single-letter word (k, s, v, z, o, u, a, i) at the end of a line
const nbsp = (s) => {
  const re = /(^|[\s(„"])([KkSsVvZzOoUuAaIi]) (?=\S)/g;
  return s.replace(re, '$1$2 ').replace(re, '$1$2 ');
};
const rich = (s, br) => {
  let o = esc(nbsp(String(s ?? '').trim())).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  return br ? o.replace(/\r?\n/g, '<br>') : o.replace(/\s*\r?\n\s*/g, ' ');
};

// ---------- images (resized + converted to webp) ----------
const imgCache = new Map();
async function image(src, width) {
  const rel = String(src || '').replace(/^\//, '');
  const key = `${rel}@${width}`;
  if (imgCache.has(key)) return imgCache.get(key);
  const inFile = path.join(ROOT, rel);
  let res;
  if (!rel || !fs.existsSync(inFile)) {
    console.warn(`WARNING: image not found: "${src}"`);
    res = { src: rel, w: '', h: '' };
  } else {
    const hash = crypto.createHash('md5').update(fs.readFileSync(inFile)).digest('hex').slice(0, 8);
    const name = `${path.basename(rel).replace(/\.[^.]+$/, '')}-${width}-${hash}.webp`;
    const info = await sharp(inFile).rotate().resize({ width, withoutEnlargement: true }).webp({ quality: 80 }).toFile(path.join(DIST, 'gen', name));
    res = { src: `gen/${name}`, w: info.width, h: info.height };
  }
  imgCache.set(key, res);
  return res;
}

// ---------- tiny template engine ----------
const get = (scope, p) => p.split('.').reduce((o, k) => (o == null ? o : o[k]), scope);
async function replaceAsync(str, re, fn) {
  const parts = []; let last = 0, m;
  re.lastIndex = 0;
  while ((m = re.exec(str))) { parts.push(str.slice(last, m.index), fn(...m)); last = m.index + m[0].length; }
  parts.push(str.slice(last));
  return (await Promise.all(parts)).join('');
}
async function render(tpl, scope) {
  // loops
  tpl = await replaceAsync(tpl, /<!--each ([\w.]+)-->([\s\S]*?)<!--\/each-->/g, async (_, p, body) => {
    const list = get(scope, p) || [];
    const out = [];
    for (const item of list) out.push(await render(body, { ...scope, item }));
    return out.join('');
  });
  // values
  return replaceAsync(tpl, /\{\{([\w.]+)(?:\|(\w+)(?::(\d+))?)?\}\}/g, async (_, p, filter, arg) => {
    const v = get(scope, p);
    switch (filter) {
      case 'h': return rich(v, true);
      case 'attr': return esc(v);
      case 'img': return (await image(v, +arg)).src;
      case 'imgw': return (await image(v, +arg)).w;
      case 'imgh': return (await image(v, +arg)).h;
      default: return rich(v, false);
    }
  });
}

// ---------- build ----------
const hashFile = (f) => crypto.createHash('md5').update(fs.readFileSync(path.join(ROOT, f))).digest('hex').slice(0, 8);
const scope = { ...data, css_v: hashFile('styles.css'), js_v: hashFile('script.js') };
const html = await render(fs.readFileSync(path.join(ROOT, 'template.html'), 'utf8'), scope);
fs.writeFileSync(path.join(DIST, 'index.html'), html);

for (const f of ['styles.css', 'script.js']) fs.copyFileSync(path.join(ROOT, f), path.join(DIST, f));
fs.cpSync(path.join(ROOT, 'assets'), path.join(DIST, 'assets'), { recursive: true });
// non-image uploads (e.g. PDFs) are copied as-is; images are only served in resized form
const up = path.join(ROOT, 'uploads');
if (fs.existsSync(up)) {
  fs.cpSync(up, path.join(DIST, 'uploads'), { recursive: true, filter: (s) => fs.statSync(s).isDirectory() || !IMG_EXT.test(s) });
}
console.log(`Built dist/ (${imgCache.size} image variants)`);
