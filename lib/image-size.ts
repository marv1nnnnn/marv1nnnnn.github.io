import fs from 'node:fs';
import path from 'node:path';

// The size of a picture in public/, read from its header when the site is built, so a page can
// keep its room before the picture arrives (the booklet lays out its pages before then).
// PNG, JPEG, GIF and WebP; anything else, or anything not found, has no size.

export interface Size { width: number; height: number }

const PUBLIC = path.join(process.cwd(), 'public');
const known = new Map<string, Size | null>();

export function imageSize(src: string | undefined): Size | null {
  if (!src || !src.startsWith('/') || src.startsWith('//')) return null;
  const clean = decodeURIComponent(src.split(/[?#]/)[0]);
  if (known.has(clean)) return known.get(clean)!;
  const file = path.join(PUBLIC, clean);
  let size: Size | null = null;
  if (file.startsWith(PUBLIC + path.sep)) {
    try {
      size = read(fs.readFileSync(file));
    } catch {
      size = null;
    }
  }
  known.set(clean, size);
  return size;
}

function read(b: Buffer): Size | null {
  // PNG: the IHDR chunk comes first.
  if (b.length > 24 && b.readUInt32BE(0) === 0x89504e47) return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
  // GIF: the logical screen.
  if (b.length > 10 && b.toString('ascii', 0, 3) === 'GIF') return { width: b.readUInt16LE(6), height: b.readUInt16LE(8) };
  // WebP: lossy, lossless or extended.
  if (b.length > 30 && b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') {
    const kind = b.toString('ascii', 12, 16);
    if (kind === 'VP8 ') return { width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff };
    if (kind === 'VP8L') {
      const bits = b.readUInt32LE(21);
      return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
    }
    if (kind === 'VP8X') return { width: 1 + b.readUIntLE(24, 3), height: 1 + b.readUIntLE(27, 3) };
    return null;
  }
  // JPEG: the first start-of-frame segment.
  if (b.length > 4 && b[0] === 0xff && b[1] === 0xd8) {
    let i = 2;
    while (i + 9 < b.length) {
      if (b[i] !== 0xff) return null;
      const marker = b[i + 1];
      if (marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd7) || marker === 0x01) { i += 2; continue; }
      const length = b.readUInt16BE(i + 2);
      const frame = marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
      if (frame) return { width: b.readUInt16BE(i + 7), height: b.readUInt16BE(i + 5) };
      i += 2 + length;
    }
  }
  return null;
}
