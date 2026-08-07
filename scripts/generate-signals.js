const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

const CONTENT_DIR = path.join(process.cwd(), 'content');
const BILLBOARDS_FILE = path.join(process.cwd(), 'content', 'billboards.json');
const OUTPUT_FILE = path.join(process.cwd(), 'lib', 'signals.json');
const SITEMAP_FILE = path.join(process.cwd(), 'public', 'sitemap.xml');

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

// Nav order. Was signal.freq back when the site was a radio dial.
const ORDER = ['about', 'projects', 'journal', 'listening', 'influences'];

function loadCardsPage(signalDir) {
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

  return { type: 'cards', cards };
}

function loadListPage(signalDir) {
  const itemsJsonPath = path.join(signalDir, 'items.json');
  const itemsJson = fs.readFileSync(itemsJsonPath, 'utf-8');
  const items = JSON.parse(itemsJson);

  return { type: 'list', items };
}

function loadInfluencesPage(signalDir) {
  const influencesJsonPath = path.join(signalDir, 'influences.json');
  const influencesJson = fs.readFileSync(influencesJsonPath, 'utf-8');
  const { records } = JSON.parse(influencesJson);

  return {
    type: 'influences',
    records,
  };
}

function generateSignals() {
  const signalDirs = fs.readdirSync(CONTENT_DIR).filter((dir) => {
    const fullPath = path.join(CONTENT_DIR, dir);
    return fs.statSync(fullPath).isDirectory() && fs.existsSync(path.join(fullPath, 'signal.json'));
  });

  const signals = signalDirs.map((dir) => {
    const signalDir = path.join(CONTENT_DIR, dir);
    const metadata = loadSignalMetadata(signalDir);

    let page;
    if (metadata.pageType === 'profile') {
      page = loadProfilePage(signalDir);
    } else if (metadata.pageType === 'cards') {
      page = loadCardsPage(signalDir);
    } else if (metadata.pageType === 'list') {
      page = loadListPage(signalDir);
    } else if (metadata.pageType === 'influences') {
      page = loadInfluencesPage(signalDir);
    } else {
      throw new Error(`Unknown page type: ${metadata.pageType}`);
    }

    return {
      id: metadata.id,
      title: metadata.title,
      summary: metadata.summary,
      page,
    };
  });

  signals.sort((a, b) => ORDER.indexOf(a.id) - ORDER.indexOf(b.id));

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

  return signals;
}

function generateSitemap(signals) {
  const baseUrl = 'https://marv1nnnnn.github.io';
  const today = new Date().toISOString().split('T')[0];

  // Collect all card URLs
  const cardUrls = [];
  signals.forEach(signal => {
    if (signal.page.type === 'cards' && signal.page.cards) {
      signal.page.cards.forEach(card => {
        cardUrls.push(`${baseUrl}/signals/${signal.id}/${card.id}`);
      });
    }
  });

  // Generate XML
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
${cardUrls.map(url => `  <url>
    <loc>${url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`).join('\n')}
</urlset>`;

  fs.writeFileSync(SITEMAP_FILE, xml);
  console.log(`✅ Generated sitemap with ${cardUrls.length + 1} URLs to ${SITEMAP_FILE}`);
}

const signals = generateSignals();
generateSitemap(signals);
