const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const CONTENT_DIR = path.join(process.cwd(), 'content');
const BILLBOARDS_FILE = path.join(process.cwd(), 'content', 'billboards.json');
const OUTPUT_FILE = path.join(process.cwd(), 'lib', 'signals.json');

function loadSignalMetadata(signalDir) {
  const signalJsonPath = path.join(signalDir, 'signal.json');
  const signalJson = fs.readFileSync(signalJsonPath, 'utf-8');
  return JSON.parse(signalJson);
}

function loadProfilePage(signalDir) {
  const profileJsonPath = path.join(signalDir, 'profile.json');
  const profileJson = fs.readFileSync(profileJsonPath, 'utf-8');
  return {
    type: 'profile',
    ...JSON.parse(profileJson),
  };
}

function loadCardsPage(signalDir, metadata) {
  const cardsDir = path.join(signalDir, 'cards');
  const cardFiles = fs.readdirSync(cardsDir).filter((file) => file.endsWith('.md'));

  const cards = cardFiles.map((file) => {
    const filePath = path.join(cardsDir, file);
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const { data, content } = matter(fileContent);

    return {
      id: data.id,
      title: data.title,
      subtitle: data.subtitle,
      date: data.date,
      summary: data.summary,
      tags: data.tags,
      markdown: content,
    };
  });

  // Sort by date descending
  cards.sort((a, b) => {
    if (!a.date || !b.date) return 0;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  return {
    type: 'cards',
    renderMode: metadata.renderMode,
    intro: metadata.intro,
    cards,
  };
}

function loadListPage(signalDir, metadata) {
  const itemsJsonPath = path.join(signalDir, 'items.json');
  const itemsJson = fs.readFileSync(itemsJsonPath, 'utf-8');
  const items = JSON.parse(itemsJson);

  return {
    type: 'list',
    intro: metadata.intro,
    items,
  };
}

function generateSignals() {
  const signalDirs = fs.readdirSync(CONTENT_DIR).filter((dir) => {
    const fullPath = path.join(CONTENT_DIR, dir);
    return fs.statSync(fullPath).isDirectory();
  });

  const signals = signalDirs.map((dir) => {
    const signalDir = path.join(CONTENT_DIR, dir);
    const metadata = loadSignalMetadata(signalDir);

    let page;
    if (metadata.pageType === 'profile') {
      page = loadProfilePage(signalDir);
    } else if (metadata.pageType === 'cards') {
      page = loadCardsPage(signalDir, metadata);
    } else if (metadata.pageType === 'list') {
      page = loadListPage(signalDir, metadata);
    } else {
      throw new Error(`Unknown page type: ${metadata.pageType}`);
    }

    return {
      id: metadata.id,
      freq: metadata.freq,
      title: metadata.title,
      pages: metadata.pages,
      audioUrl: metadata.audioUrl,
      broadcastDate: metadata.broadcastDate,
      location: metadata.location,
      tags: metadata.tags,
      summary: metadata.summary,
      accentColor: metadata.accentColor,
      background: metadata.background,
      page,
    };
  });

  // Sort by frequency
  signals.sort((a, b) => a.freq - b.freq);

  // Load billboards
  const billboardsJson = fs.readFileSync(BILLBOARDS_FILE, 'utf-8');
  const billboards = JSON.parse(billboardsJson);

  // Write to output file
  const output = {
    signals,
    billboards,
  };
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
  console.log(`✅ Generated ${signals.length} signals and ${billboards.length} billboards to ${OUTPUT_FILE}`);
}

generateSignals();
