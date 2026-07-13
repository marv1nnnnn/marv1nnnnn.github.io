#!/usr/bin/env node

const assert = require('node:assert/strict');
const { randomUUID } = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const matter = require('gray-matter');

const ROOT = path.resolve(__dirname, '..');
const NOTES_DIR = process.env.CLIN_NOTES_DIR || path.join(os.homedir(), 'Library/Application Support/com.clin.clin/notes');
const ITEMS_FILE = path.join(ROOT, 'content/listening/items.json');
const CARDS_DIR = path.join(ROOT, 'content/journal/cards');
const MEDIA_TYPES = new Set(['music', 'video', 'text', 'game', 'live']);

function yaml(value) {
  return JSON.stringify(value);
}

function noteText(title, tags, body) {
  return `---\ntitle: ${yaml(title)}\ntags: ${yaml(tags)}\n---\n${body}`;
}

function bodyFields(content) {
  const lines = content.replace(/\r\n/g, '\n').split('\n');
  const fields = {};
  let index = 0;

  for (; index < lines.length; index += 1) {
    if (lines[index] === '') {
      index += 1;
      break;
    }
    const match = lines[index].match(/^([A-Za-z]+): (.*)$/);
    if (!match) break;
    if (Object.hasOwn(fields, match[1])) throw new Error(`Duplicate ${match[1]} field`);
    fields[match[1]] = match[2];
  }

  return { fields, markdown: lines.slice(index).join('\n') };
}

function parseNote(source, raw) {
  const { data, content } = matter(raw);
  const tags = Array.isArray(data.tags) ? data.tags.filter((tag) => typeof tag === 'string') : [];
  if (!tags.includes('site')) return null;

  const isMedia = tags.includes('media');
  const isJournal = tags.includes('journal');
  if (isMedia && isJournal) throw new Error(`${source}: cannot be both media and journal`);
  if (!isMedia && !isJournal) return null;
  if (typeof data.title !== 'string' || !data.title.trim()) throw new Error(`${source}: missing title`);

  const { fields, markdown } = bodyFields(content);
  if (!fields.Date || Number.isNaN(Date.parse(fields.Date))) throw new Error(`${source}: invalid Date`);

  if (isMedia) {
    const types = tags.filter((tag) => MEDIA_TYPES.has(tag));
    if (types.length !== 1) throw new Error(`${source}: expected exactly one media type tag`);
    if (!fields.Creator?.trim()) throw new Error(`${source}: missing Creator`);
    return {
      kind: 'media',
      source,
      item: {
        title: data.title,
        creator: fields.Creator,
        type: types[0],
        date: fields.Date,
        ...(fields.URL ? { url: fields.URL } : {}),
      },
    };
  }

  if (!fields.ID || !/^[a-z0-9][a-z0-9-]*$/.test(fields.ID)) throw new Error(`${source}: invalid ID`);
  if (!fields.Summary?.trim()) throw new Error(`${source}: missing Summary`);
  return {
    kind: 'journal',
    source,
    card: {
      id: fields.ID,
      title: data.title,
      date: fields.Date,
      summary: fields.Summary,
      tags: tags.filter((tag) => tag !== 'site' && tag !== 'journal'),
      markdown,
    },
  };
}

function noteFiles(dir = NOTES_DIR, prefix = '') {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name.startsWith('.')) return [];
    const relative = path.join(prefix, entry.name);
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) return noteFiles(absolute, relative);
    return entry.isFile() && entry.name.endsWith('.md') ? [relative] : [];
  });
}

function publicContent() {
  const media = [];
  const journal = [];
  for (const source of noteFiles().sort()) {
    const parsed = parseNote(source, fs.readFileSync(path.join(NOTES_DIR, source), 'utf8'));
    if (parsed?.kind === 'media') media.push({ ...parsed.item, source });
    if (parsed?.kind === 'journal') journal.push({ ...parsed.card, source, file: path.basename(source) });
  }
  return { media, journal };
}

function writeAtomic(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temp = `${file}.tmp-${process.pid}`;
  fs.writeFileSync(temp, content, 'utf8');
  fs.renameSync(temp, file);
}

function cardText(card) {
  return `---\nid: ${yaml(card.id)}\ntitle: ${yaml(card.title)}\ndate: ${yaml(card.date)}\nsummary: ${yaml(card.summary)}\ntags: ${yaml(card.tags)}\n---\n\n${card.markdown}`;
}

function sync({ ifPresent = false, quiet = false } = {}) {
  if (!fs.existsSync(NOTES_DIR)) {
    if (ifPresent) return { skipped: true, media: 0, journal: 0 };
    throw new Error(`Clin notes directory not found: ${NOTES_DIR}`);
  }

  const { media, journal } = publicContent();
  const currentItems = fs.existsSync(ITEMS_FILE) ? JSON.parse(fs.readFileSync(ITEMS_FILE, 'utf8')) : [];
  const currentCards = fs.existsSync(CARDS_DIR) ? fs.readdirSync(CARDS_DIR).filter((file) => file.endsWith('.md')) : [];
  if (!media.length && !journal.length && (currentItems.length || currentCards.length)) {
    throw new Error('Refusing to erase generated content: Clin has no public site media or journal notes');
  }

  const ids = new Set();
  const cardFiles = new Set();
  for (const card of journal) {
    if (ids.has(card.id)) throw new Error(`Duplicate journal ID: ${card.id}`);
    if (cardFiles.has(card.file)) throw new Error(`Duplicate journal filename: ${card.file}`);
    ids.add(card.id);
    cardFiles.add(card.file);
  }

  writeAtomic(ITEMS_FILE, `${JSON.stringify(media.map(({ source, ...item }) => item), null, 2)}\n`);
  fs.mkdirSync(CARDS_DIR, { recursive: true });
  for (const card of journal) writeAtomic(path.join(CARDS_DIR, card.file), cardText(card));
  for (const file of currentCards) {
    if (!cardFiles.has(file)) fs.rmSync(path.join(CARDS_DIR, file));
  }

  const result = { media: media.length, journal: journal.length };
  if (!quiet) console.log(`Synced ${result.media} media and ${result.journal} journal notes from Clin`);
  return result;
}

function slug(value) {
  return value.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'item';
}

function journalSource(card) {
  const tags = ['site', 'journal', ...(Array.isArray(card.data.tags) ? card.data.tags : [])];
  const markdown = card.content.replace(/^\r?\n/, '');
  return noteText(card.data.title, tags, `Date: ${card.data.date}\nSummary: ${card.data.summary}\nID: ${card.data.id}\n\n${markdown}`);
}

function migrate() {
  if (!fs.existsSync(NOTES_DIR)) throw new Error(`Clin notes directory not found: ${NOTES_DIR}`);
  const items = JSON.parse(fs.readFileSync(ITEMS_FILE, 'utf8'));
  const cards = fs.readdirSync(CARDS_DIR).filter((file) => file.endsWith('.md')).sort().map((file) => {
    const parsed = matter(fs.readFileSync(path.join(CARDS_DIR, file), 'utf8'));
    return { ...parsed, file };
  });

  const notes = items.map((item, index) => {
    if (!item.title || !item.creator || !MEDIA_TYPES.has(item.type) || !item.date || Number.isNaN(Date.parse(item.date))) {
      throw new Error(`Invalid media item at index ${index}`);
    }
    const source = path.join('site/media', `legacy-${String(index + 1).padStart(4, '0')}-${slug(item.title)}.md`);
    const body = [`Date: ${item.date}`, `Creator: ${item.creator}`];
    if (item.url) body.push(`URL: ${item.url}`);
    return { source, expected: item, raw: noteText(item.title, ['site', 'media', item.type], body.join('\n')) };
  });

  for (const card of cards) {
    if (!card.data.id || !card.data.title || !card.data.date || !card.data.summary) throw new Error(`${card.file}: invalid journal card`);
    notes.push({
      source: path.join('site/journal', card.file),
      expected: {
        id: card.data.id,
        title: card.data.title,
        date: card.data.date,
        summary: card.data.summary,
        tags: card.data.tags || [],
        markdown: card.content.replace(/^\r?\n/, ''),
      },
      raw: journalSource(card),
    });
  }

  for (const note of notes) {
    const file = path.join(NOTES_DIR, note.source);
    if (!fs.existsSync(file)) continue;
    const parsed = parseNote(note.source, fs.readFileSync(file, 'utf8'));
    const actual = parsed?.kind === 'media' ? parsed.item : parsed?.kind === 'journal' ? parsed.card : null;
    assert.deepEqual(actual, note.expected, `${note.source} differs; refusing to overwrite it`);
  }

  let created = 0;
  for (const note of notes) {
    const file = path.join(NOTES_DIR, note.source);
    if (fs.existsSync(file)) continue;
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, note.raw, { encoding: 'utf8', flag: 'wx' });
    created += 1;
  }

  for (const note of notes) {
    const parsed = parseNote(note.source, fs.readFileSync(path.join(NOTES_DIR, note.source), 'utf8'));
    const actual = parsed?.kind === 'media' ? parsed.item : parsed?.kind === 'journal' ? parsed.card : null;
    assert.deepEqual(actual, note.expected, `${note.source} failed round-trip verification`);
  }

  const result = sync({ quiet: true });
  console.log(`Migrated ${created} new Clin notes; verified ${items.length} media and ${cards.length} journal cards; synced ${result.media}/${result.journal}`);
}

function option(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

function addMedia() {
  const title = option('--title');
  const creator = option('--creator');
  const type = option('--type');
  const date = option('--date');
  const url = option('--url');
  if (!title?.trim() || !creator?.trim()) throw new Error('Title and creator are required');
  if (!MEDIA_TYPES.has(type)) throw new Error(`Invalid media type: ${type}`);
  if (!date || Number.isNaN(Date.parse(date))) throw new Error(`Invalid date: ${date}`);

  const dir = path.join(NOTES_DIR, 'site/media');
  fs.mkdirSync(dir, { recursive: true });
  const source = path.join('site/media', `media-${Date.now()}-${randomUUID().slice(0, 8)}-${slug(title)}.md`);
  const file = path.join(NOTES_DIR, source);

  const body = [`Date: ${date}`, `Creator: ${creator}`];
  if (url) body.push(`URL: ${url}`);
  fs.writeFileSync(file, noteText(title, ['site', 'media', type], body.join('\n')), { encoding: 'utf8', flag: 'wx' });
  sync({ quiet: true });
  const parsed = parseNote(source, fs.readFileSync(file, 'utf8'));
  return { ...parsed.item, source };
}

function removeMedia() {
  const source = option('--source');
  if (!source) throw new Error('Missing --source');
  const file = path.resolve(NOTES_DIR, source);
  if (!file.startsWith(`${path.resolve(NOTES_DIR)}${path.sep}`)) throw new Error('Invalid note path');
  const parsed = parseNote(source, fs.readFileSync(file, 'utf8'));
  if (parsed?.kind !== 'media') throw new Error('Refusing to remove a non-public-media note');

  const trashDir = path.join(NOTES_DIR, '.trash');
  fs.mkdirSync(trashDir, { recursive: true });
  const target = path.join(trashDir, `${Date.now()}-${path.basename(file)}`);
  fs.renameSync(file, target);
  sync({ quiet: true });
  return parsed.item;
}

function selfTest() {
  const media = noteText(' Title ', ['site', 'media', 'music'], 'Date: 2026-07-13\nCreator: Creator \nURL:  https://example.com');
  assert.deepEqual(parseNote('media.md', media).item, {
    title: ' Title ', creator: 'Creator ', type: 'music', date: '2026-07-13', url: ' https://example.com',
  });
  assert.equal(parseNote('private.md', noteText('Private', ['media', 'music'], 'Date: 2026-07-13\nCreator: Nobody')), null);
  const journal = noteText('Post', ['site', 'journal', 'essay'], 'Date: 2026-07-13\nSummary: Summary\nID: post\n\n# Body');
  assert.deepEqual(parseNote('journal.md', journal).card, {
    id: 'post', title: 'Post', date: '2026-07-13', summary: 'Summary', tags: ['essay'], markdown: '# Body',
  });
  assert.throws(() => parseNote('bad.md', noteText('Bad', ['site', 'media'], 'Date: nope\nCreator: X')));
  console.log('Clin content parser checks passed');
}

function main() {
  const command = process.argv[2] || 'sync';
  const json = process.argv.includes('--json');
  let result;
  if (command === 'sync') result = sync({ ifPresent: process.argv.includes('--if-present'), quiet: json });
  else if (command === 'migrate') return migrate();
  else if (command === 'list') {
    const type = option('--type');
    const items = publicContent().media;
    result = type ? items.filter((item) => item.type === type) : items;
  } else if (command === 'add') result = addMedia();
  else if (command === 'remove') result = removeMedia();
  else if (command === 'test') return selfTest();
  else throw new Error(`Unknown command: ${command}`);
  if (json) process.stdout.write(`${JSON.stringify(result)}\n`);
}

if (require.main === module) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
