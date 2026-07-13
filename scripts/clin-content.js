#!/usr/bin/env node

const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { randomUUID } = require('node:crypto');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const matter = require('gray-matter');

const ROOT = path.resolve(__dirname, '..');

function clinNotesDir() {
  if (process.env.CLIN_NOTES_DIR) return process.env.CLIN_NOTES_DIR;
  try {
    const output = execFileSync('clin', ['storage', 'show'], { encoding: 'utf8' });
    const storage = output.match(/^Storage path:\s*(.+)$/m)?.[1]?.trim();
    if (storage) return output.includes('(default path)') ? path.join(storage, 'notes') : storage;
  } catch {}
  return process.platform === 'darwin'
    ? path.join(os.homedir(), 'Library/Application Support/com.clin.clin/notes')
    : path.join(process.env.XDG_DATA_HOME || path.join(os.homedir(), '.local/share'), 'clin/notes');
}

const NOTES_DIR = clinNotesDir();
const ITEMS_FILE = path.join(ROOT, 'content/listening/items.json');
const JOURNAL_DIR = path.join(ROOT, 'content/journal/cards');
const PROJECTS_DIR = path.join(ROOT, 'content/projects/cards');
const MEDIA_TYPES = new Set(['music', 'video', 'text', 'game', 'live']);
const DATA_EXPORTS = [
  ['site/data/about-profile.txt', 'content/about/profile.json', 'About profile'],
  ['site/data/about-signal.txt', 'content/about/signal.json', 'About signal'],
  ['site/data/projects-signal.txt', 'content/projects/signal.json', 'Projects signal'],
  ['site/data/influences.txt', 'content/influences/influences.json', 'Influences'],
  ['site/data/influences-signal.txt', 'content/influences/signal.json', 'Influences signal'],
  ['site/data/listening-signal.txt', 'content/listening/signal.json', 'Media signal'],
  ['site/data/journal-signal.txt', 'content/journal/signal.json', 'Journal signal'],
  ['site/data/billboards.txt', 'content/billboards.json', 'Billboards'],
  ['site/data/shows.txt', 'data/shows.json', 'Shows'],
].map(([source, output, title]) => ({ source, output: path.join(ROOT, output), title }));

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

  const kinds = ['media', 'journal', 'project'].filter((tag) => tags.includes(tag));
  if (kinds.length > 1) throw new Error(`${source}: expected one public content type`);
  if (!kinds.length) return null;
  if (typeof data.title !== 'string' || !data.title.trim()) throw new Error(`${source}: missing title`);

  const { fields, markdown } = bodyFields(content);
  if (!fields.Date || Number.isNaN(Date.parse(fields.Date))) throw new Error(`${source}: invalid Date`);

  if (kinds[0] === 'media') {
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

  if (!fields.ID || !/^[a-z0-9][a-z0-9_-]*$/.test(fields.ID)) throw new Error(`${source}: invalid ID`);
  if (!fields.Summary?.trim()) throw new Error(`${source}: missing Summary`);
  return {
    kind: kinds[0],
    source,
    card: {
      id: fields.ID,
      title: data.title,
      ...(fields.Subtitle ? { subtitle: fields.Subtitle } : {}),
      date: fields.Date,
      summary: fields.Summary,
      tags: tags.filter((tag) => !['site', kinds[0]].includes(tag)),
      markdown,
    },
  };
}

function parseDataNote(source, raw) {
  const { data, content } = matter(raw);
  const tags = Array.isArray(data.tags) ? data.tags : [];
  if (!tags.includes('site') || !tags.includes('website-json')) {
    throw new Error(`${source}: expected site and website-json tags`);
  }
  if (typeof data.title !== 'string' || !data.title.trim()) throw new Error(`${source}: missing title`);
  try {
    return { title: data.title, value: JSON.parse(content) };
  } catch (error) {
    throw new Error(`${source}: invalid JSON (${error.message})`);
  }
}

function noteFiles(dir = NOTES_DIR, prefix = '') {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name.startsWith('.')) return [];
    const relative = path.join(prefix, entry.name);
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) return noteFiles(absolute, relative);
    return entry.isFile() && ['.md', '.txt'].includes(path.extname(entry.name)) ? [relative] : [];
  });
}

function dataNotes() {
  return noteFiles().sort().flatMap((source) => {
    const raw = fs.readFileSync(path.join(NOTES_DIR, source), 'utf8');
    const tags = matter(raw).data.tags;
    if (!Array.isArray(tags) || !tags.includes('site') || !tags.includes('website-json')) return [];
    return [{ source, ...parseDataNote(source, raw) }];
  });
}

function publicContent() {
  const media = [];
  const journal = [];
  const projects = [];
  for (const source of noteFiles().sort()) {
    const parsed = parseNote(source, fs.readFileSync(path.join(NOTES_DIR, source), 'utf8'));
    if (parsed?.kind === 'media') media.push({ ...parsed.item, source });
    if (parsed?.kind === 'journal') journal.push({ ...parsed.card, source, file: `${parsed.card.id}.md` });
    if (parsed?.kind === 'project') projects.push({ ...parsed.card, source, file: `${parsed.card.id}.md` });
  }
  const notes = dataNotes();
  const data = DATA_EXPORTS.map((entry) => {
    const matches = notes.filter((note) => note.title === entry.title);
    if (matches.length !== 1) throw new Error(`Expected one public website data note titled "${entry.title}", found ${matches.length}`);
    return { ...entry, value: matches[0].value };
  });
  return { media, journal, projects, data };
}

function writeAtomic(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temp = `${file}.tmp-${process.pid}`;
  fs.writeFileSync(temp, content, 'utf8');
  fs.renameSync(temp, file);
}

function cardText(card) {
  const subtitle = card.subtitle ? `subtitle: ${yaml(card.subtitle)}\n` : '';
  return `---\nid: ${yaml(card.id)}\ntitle: ${yaml(card.title)}\n${subtitle}date: ${yaml(card.date)}\nsummary: ${yaml(card.summary)}\ntags: ${yaml(card.tags)}\n---\n\n${card.markdown}`;
}

function cardFiles(cards, label) {
  const ids = new Set();
  const files = new Set();
  for (const card of cards) {
    if (ids.has(card.id)) throw new Error(`Duplicate ${label} ID: ${card.id}`);
    if (files.has(card.file)) throw new Error(`Duplicate ${label} filename: ${card.file}`);
    ids.add(card.id);
    files.add(card.file);
  }
  return files;
}

function syncCards(cards, dir, files) {
  const currentFiles = fs.existsSync(dir) ? fs.readdirSync(dir).filter((file) => file.endsWith('.md')) : [];
  fs.mkdirSync(dir, { recursive: true });
  for (const card of cards) writeAtomic(path.join(dir, card.file), cardText(card));
  for (const file of currentFiles) {
    if (!files.has(file)) fs.rmSync(path.join(dir, file));
  }
}

function sync({ ifPresent = false, quiet = false } = {}) {
  if (!fs.existsSync(NOTES_DIR)) {
    if (ifPresent) return { skipped: true, media: 0, journal: 0, projects: 0, data: 0 };
    throw new Error(`Clin notes directory not found: ${NOTES_DIR}`);
  }

  const { media, journal, projects, data } = publicContent();
  const currentItems = fs.existsSync(ITEMS_FILE) ? JSON.parse(fs.readFileSync(ITEMS_FILE, 'utf8')) : [];
  const currentJournal = fs.existsSync(JOURNAL_DIR) ? fs.readdirSync(JOURNAL_DIR).filter((file) => file.endsWith('.md')) : [];
  const currentProjects = fs.existsSync(PROJECTS_DIR) ? fs.readdirSync(PROJECTS_DIR).filter((file) => file.endsWith('.md')) : [];
  if (!media.length && !journal.length && (currentItems.length || currentJournal.length)) {
    throw new Error('Refusing to erase generated content: Clin has no public site media or journal notes');
  }
  if (!projects.length && currentProjects.length) {
    throw new Error('Refusing to erase generated content: Clin has no public site project notes');
  }

  const journalFiles = cardFiles(journal, 'journal');
  const projectFiles = cardFiles(projects, 'project');
  writeAtomic(ITEMS_FILE, `${JSON.stringify(media.map(({ source, ...item }) => item), null, 2)}\n`);
  syncCards(journal, JOURNAL_DIR, journalFiles);
  syncCards(projects, PROJECTS_DIR, projectFiles);
  for (const entry of data) writeAtomic(entry.output, `${JSON.stringify(entry.value, null, 2)}\n`);

  const result = { media: media.length, journal: journal.length, projects: projects.length, data: data.length };
  if (!quiet) console.log(`Synced ${result.media} media, ${result.journal} journal, ${result.projects} projects, and ${result.data} data files from Clin`);
  return result;
}

function slug(value) {
  return value.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 48) || 'item';
}

function cardSource(card, kind) {
  const tags = ['site', kind, ...(Array.isArray(card.data.tags) ? card.data.tags : [])];
  const markdown = card.content.replace(/^\r?\n/, '');
  const fields = [`Date: ${card.data.date}`, `Summary: ${card.data.summary}`, `ID: ${card.data.id}`];
  if (card.data.subtitle) fields.push(`Subtitle: ${card.data.subtitle}`);
  return noteText(card.data.title, tags, `${fields.join('\n')}\n\n${markdown}`);
}

function readCards(dir) {
  return fs.readdirSync(dir).filter((file) => file.endsWith('.md')).sort().map((file) => {
    const parsed = matter(fs.readFileSync(path.join(dir, file), 'utf8'));
    return { ...parsed, file };
  });
}

function parsedMigrationValue(note, raw) {
  if (note.kind === 'data') return parseDataNote(note.source, raw).value;
  const parsed = parseNote(note.source, raw);
  return parsed?.kind === 'media' ? parsed.item : parsed?.card;
}

function contentKey(kind, value) {
  return `${kind}:${value.id}`;
}

function existingContentSources() {
  const sources = new Map();
  for (const source of noteFiles()) {
    const parsed = parseNote(source, fs.readFileSync(path.join(NOTES_DIR, source), 'utf8'));
    if (!parsed || parsed.kind === 'media') continue;
    const key = contentKey(parsed.kind, parsed.card);
    if (sources.has(key)) throw new Error(`Duplicate public note identity: ${key}`);
    sources.set(key, source);
  }
  return sources;
}

function migrate() {
  if (!fs.existsSync(NOTES_DIR)) throw new Error(`Clin notes directory not found: ${NOTES_DIR}`);
  const items = JSON.parse(fs.readFileSync(ITEMS_FILE, 'utf8'));
  const journal = readCards(JOURNAL_DIR);
  const projects = readCards(PROJECTS_DIR);
  const existingContent = existingContentSources();
  const existingData = new Map(dataNotes().map((note) => [note.title, note.source]));

  const notes = items.map((item, index) => {
    if (!item.title || !item.creator || !MEDIA_TYPES.has(item.type) || !item.date || Number.isNaN(Date.parse(item.date))) {
      throw new Error(`Invalid media item at index ${index}`);
    }
    const source = path.join('site/media', `legacy-${String(index + 1).padStart(4, '0')}-${slug(item.title)}.md`);
    const body = [`Date: ${item.date}`, `Creator: ${item.creator}`];
    if (item.url) body.push(`URL: ${item.url}`);
    return { kind: 'media', source, expected: item, raw: noteText(item.title, ['site', 'media', item.type], body.join('\n')) };
  });

  for (const [kind, cards, folder] of [['journal', journal, 'journal'], ['project', projects, 'projects']]) {
    for (const card of cards) {
      if (!card.data.id || !card.data.title || !card.data.date || !card.data.summary) throw new Error(`${card.file}: invalid ${kind} card`);
      const file = card.file.replace(/\.md\.md$/, '.md');
      notes.push({
        kind,
        source: existingContent.get(contentKey(kind, card.data)) || path.join('site', folder, file),
        expected: {
          id: card.data.id,
          title: card.data.title,
          ...(card.data.subtitle ? { subtitle: card.data.subtitle } : {}),
          date: card.data.date,
          summary: card.data.summary,
          tags: card.data.tags || [],
          markdown: card.content.replace(/^\r?\n/, ''),
        },
        raw: cardSource(card, kind),
      });
    }
  }

  for (const entry of DATA_EXPORTS) {
    const value = JSON.parse(fs.readFileSync(entry.output, 'utf8'));
    notes.push({
      kind: 'data',
      source: existingData.get(entry.title) || entry.source,
      expected: value,
      raw: noteText(entry.title, ['site', 'website-json'], `${JSON.stringify(value, null, 2)}\n`),
    });
  }

  for (const note of notes) {
    const file = path.join(NOTES_DIR, note.source);
    if (!fs.existsSync(file)) continue;
    assert.deepEqual(parsedMigrationValue(note, fs.readFileSync(file, 'utf8')), note.expected, `${note.source} differs; refusing to overwrite it`);
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
    assert.deepEqual(parsedMigrationValue(note, fs.readFileSync(path.join(NOTES_DIR, note.source), 'utf8')), note.expected, `${note.source} failed round-trip verification`);
  }

  const result = sync({ quiet: true });
  console.log(`Migrated ${created} new Clin notes; verified ${notes.length} public notes; synced ${result.media}/${result.journal}/${result.projects}/${result.data}`);
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
  const project = noteText('Project', ['site', 'project', 'code'], 'Date: 2026-07-13\nSummary: Summary\nID: project_1\nSubtitle: Subtitle\n\nBody');
  assert.deepEqual(parseNote('project.md', project).card, {
    id: 'project_1', title: 'Project', subtitle: 'Subtitle', date: '2026-07-13', summary: 'Summary', tags: ['code'], markdown: 'Body',
  });
  assert.deepEqual(parseDataNote('data.txt', noteText('Data', ['site', 'website-json'], '{"ok":true}')), { title: 'Data', value: { ok: true } });
  assert.throws(() => parseDataNote('private.txt', noteText('Private', ['website-json'], '{}')));
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
