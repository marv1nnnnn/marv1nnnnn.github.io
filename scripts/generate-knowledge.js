const fs = require('fs');
const path = require('path');

const NODES_DIR = path.join(process.cwd(), 'content/knowledge/nodes');
const SOURCES_DIR = path.join(process.cwd(), 'content/knowledge/sources');
const OUT_DIR = path.join(process.cwd(), 'public/knowledge');
const OUT_NODES_DIR = path.join(OUT_DIR, 'nodes');
const OUT_SOURCES_DIR = path.join(OUT_DIR, 'sources');
const OUT_GRAPH = path.join(OUT_DIR, 'graph.json');

function loadNodes() {
  const files = fs.readdirSync(NODES_DIR).filter((f) => f.endsWith('.json'));
  return files.map((f) => {
    const raw = fs.readFileSync(path.join(NODES_DIR, f), 'utf-8');
    return JSON.parse(raw);
  });
}

function buildGraph(nodes) {
  const nodeIds = new Set(nodes.map((n) => n.id));
  const graphNodes = [];
  const graphEdges = [];
  let edgeId = 1;

  for (const node of nodes) {
    graphNodes.push({
      id: node.id,
      name: node.name,
      type: node.type,
      description: node.description,
      sources: node.sources,
      createdAt: node.createdAt,
      updatedAt: node.updatedAt,
    });

    for (const edge of node.edges || []) {
      if (!nodeIds.has(edge.to)) {
        console.warn(`⚠️  Edge from "${node.id}" references unknown node "${edge.to}", skipping`);
        continue;
      }
      graphEdges.push({
        id: `E-${edgeId++}`,
        from: node.id,
        to: edge.to,
        quote: edge.quote,
        source: edge.source,
        createdAt: node.createdAt,
      });
    }
  }

  return { version: 1, nodes: graphNodes, edges: graphEdges };
}

function buildIncomingMap(nodes) {
  const incoming = {};
  for (const node of nodes) {
    for (const edge of node.edges || []) {
      if (!incoming[edge.to]) incoming[edge.to] = [];
      incoming[edge.to].push({
        fromId: node.id,
        fromName: node.name,
        quote: edge.quote,
      });
    }
  }
  return incoming;
}

function generateNodeMarkdown(node, incoming, nameMap) {
  const lines = [];
  lines.push(`# ${node.name}`);
  lines.push(`Type: ${node.type}`);
  lines.push(`Sources: ${(node.sources || []).join(', ')}`);
  lines.push('');
  lines.push(node.description);

  const outgoing = node.edges || [];
  const inc = incoming[node.id] || [];

  if (outgoing.length > 0 || inc.length > 0) {
    lines.push('');
    lines.push('## Relations');
    for (const e of outgoing) {
      lines.push(`- → ${nameMap[e.to] || e.to}: "${e.quote}"`);
    }
    for (const e of inc) {
      lines.push(`- ← ${e.fromName}: "${e.quote}"`);
    }
  }

  return lines.join('\n') + '\n';
}

function copySources() {
  if (!fs.existsSync(SOURCES_DIR)) return 0;
  fs.mkdirSync(OUT_SOURCES_DIR, { recursive: true });
  const files = fs.readdirSync(SOURCES_DIR).filter((f) => f.endsWith('.md'));
  for (const f of files) {
    fs.copyFileSync(path.join(SOURCES_DIR, f), path.join(OUT_SOURCES_DIR, f));
  }
  return files.length;
}

function generate() {
  const nodes = loadNodes();

  // Build and write graph.json
  const graph = buildGraph(nodes);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(OUT_GRAPH, JSON.stringify(graph, null, 2) + '\n');

  // Build and write node markdown files
  const incoming = buildIncomingMap(nodes);
  const nameMap = {};
  for (const n of nodes) nameMap[n.id] = n.name;

  fs.mkdirSync(OUT_NODES_DIR, { recursive: true });

  // Clean old node markdown files before writing
  const oldMds = fs.readdirSync(OUT_NODES_DIR).filter((f) => f.endsWith('.md'));
  for (const f of oldMds) fs.unlinkSync(path.join(OUT_NODES_DIR, f));

  for (const node of nodes) {
    const md = generateNodeMarkdown(node, incoming, nameMap);
    fs.writeFileSync(path.join(OUT_NODES_DIR, `${node.id}.md`), md);
  }

  // Copy source articles
  const sourceCount = copySources();

  console.log(
    `✅ Knowledge graph: ${nodes.length} nodes, ${graph.edges.length} edges, ${sourceCount} sources → ${OUT_DIR}`
  );
}

generate();
