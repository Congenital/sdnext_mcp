// sdnext_mcp/src/image.js — 图片 base64 编解码与落盘
// SD.Next API 图片一律为 base64 编码的 PNG（无 data: 前缀）。

import fs from 'node:fs';
import path from 'node:path';
import { config } from './config.js';

export function fromFile(file) {
  return fs.readFileSync(file).toString('base64');
}

export function fromDataUrl(dataUrl) {
  const m = /^data:(image\/[a-z+.-]+|application\/[a-z+.-]+);base64,(.+)$/is.exec(dataUrl);
  if (m) return m[2];
  return dataUrl; // 已是裸 base64
}

export function toDataUrl(b64, mime = 'image/png') {
  return b64.startsWith('data:') ? b64 : `data:${mime};base64,${b64}`;
}

// 将 API 返回的 base64 图片数组落盘；返回写出的文件路径列表
export function saveImages(images = [], { dir, prefix = 'sdnext', fmt = 'png' } = {}) {
  const outDir = dir || config.defaultSaveDir;
  if (!outDir || !Array.isArray(images)) return [];
  fs.mkdirSync(outDir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const written = [];
  images.forEach((b64, i) => {
    if (typeof b64 !== 'string' || !b64.length) return;
    const name = `${prefix}_${stamp}_${i}.${fmt}`;
    const p = path.join(outDir, name);
    fs.writeFileSync(p, Buffer.from(b64.startsWith('data:') ? b64.split(',')[1] : b64, 'base64'));
    written.push(p);
  });
  return written;
}
