import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync } from "fs";
import { join, basename } from "path";
import { getContentPath, getProjectPath } from "./constants";
import { ListeningItem, Card, CardFrontmatter, Signal } from "../types";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

// ============================================
// JSON Utilities
// ============================================

export function readJsonFile<T>(relativePath: string): T {
  const fullPath = join(getContentPath(), relativePath);
  const content = readFileSync(fullPath, "utf-8");
  return JSON.parse(content) as T;
}

export function writeJsonFile<T>(relativePath: string, data: T): void {
  const fullPath = join(getContentPath(), relativePath);
  const dir = fullPath.substring(0, fullPath.lastIndexOf("/"));
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(fullPath, JSON.stringify(data, null, 2) + "\n", "utf-8");
}

// ============================================
// Listening Items
// ============================================

export function getListeningItems(): ListeningItem[] {
  return readJsonFile<ListeningItem[]>("listening/items.json");
}

export function addListeningItem(item: ListeningItem): void {
  const items = getListeningItems();
  items.push(item);
  writeJsonFile("listening/items.json", items);
}

export function updateListeningItem(index: number, item: ListeningItem): void {
  const items = getListeningItems();
  items[index] = item;
  writeJsonFile("listening/items.json", items);
}

export function deleteListeningItem(index: number): void {
  const items = getListeningItems();
  items.splice(index, 1);
  writeJsonFile("listening/items.json", items);
}

// ============================================
// Markdown/Card Utilities
// ============================================

function parseFrontmatter(content: string): { frontmatter: CardFrontmatter; body: string } {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    throw new Error("Invalid frontmatter format");
  }

  const yamlContent = match[1];
  const body = match[2].trim();

  // Simple YAML parser for our use case
  const frontmatter: Record<string, unknown> = {};
  const lines = yamlContent.split("\n");

  for (const line of lines) {
    const colonIndex = line.indexOf(":");
    if (colonIndex === -1) continue;

    const key = line.slice(0, colonIndex).trim();
    let value = line.slice(colonIndex + 1).trim();

    // Handle quoted strings
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    // Handle arrays
    if (value.startsWith("[") && value.endsWith("]")) {
      const arrayContent = value.slice(1, -1);
      frontmatter[key] = arrayContent.split(",").map((item) => item.trim().replace(/^["']|["']$/g, ""));
    } else {
      frontmatter[key] = value;
    }
  }

  return {
    frontmatter: frontmatter as unknown as CardFrontmatter,
    body,
  };
}

function generateFrontmatter(frontmatter: CardFrontmatter): string {
  const lines = [
    "---",
    `id: "${frontmatter.id}"`,
    `title: "${frontmatter.title}"`,
    `subtitle: "${frontmatter.subtitle}"`,
    `date: "${frontmatter.date}"`,
    `summary: "${frontmatter.summary}"`,
    `tags: [${frontmatter.tags.map((t) => t).join(", ")}]`,
  ];

  if (frontmatter.image) {
    lines.push(`image: "${frontmatter.image}"`);
  }

  lines.push("---");
  return lines.join("\n");
}

export function getCards(signalType: "projects" | "journal"): Card[] {
  const cardsPath = join(getContentPath(), signalType, "cards");

  if (!existsSync(cardsPath)) {
    return [];
  }

  const files = readdirSync(cardsPath).filter((f) => f.endsWith(".md"));
  const cards: Card[] = [];

  for (const file of files) {
    const filePath = join(cardsPath, file);
    const content = readFileSync(filePath, "utf-8");

    try {
      const { frontmatter, body } = parseFrontmatter(content);
      cards.push({
        frontmatter,
        content: body,
        filePath,
      });
    } catch (e) {
      console.error(`Failed to parse ${file}:`, e);
    }
  }

  // Sort by date descending
  cards.sort((a, b) => new Date(b.frontmatter.date).getTime() - new Date(a.frontmatter.date).getTime());

  return cards;
}

export function createCard(
  signalType: "projects" | "journal",
  frontmatter: CardFrontmatter,
  content: string = ""
): string {
  const cardsPath = join(getContentPath(), signalType, "cards");

  if (!existsSync(cardsPath)) {
    mkdirSync(cardsPath, { recursive: true });
  }

  const fileName = `${frontmatter.id}.md`;
  const filePath = join(cardsPath, fileName);

  const fileContent = `${generateFrontmatter(frontmatter)}\n\n${content}`;
  writeFileSync(filePath, fileContent, "utf-8");

  return filePath;
}

export function updateCard(filePath: string, frontmatter: CardFrontmatter, content: string): void {
  const fileContent = `${generateFrontmatter(frontmatter)}\n\n${content}`;
  writeFileSync(filePath, fileContent, "utf-8");
}

export function deleteCard(filePath: string): void {
  const fs = require("fs");
  fs.unlinkSync(filePath);
}

// ============================================
// Signal Utilities
// ============================================

export function getSignals(): Signal[] {
  const contentPath = getContentPath();
  const signals: Signal[] = [];

  const dirs = readdirSync(contentPath, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name);

  for (const dir of dirs) {
    const signalPath = join(contentPath, dir, "signal.json");
    if (existsSync(signalPath)) {
      const content = readFileSync(signalPath, "utf-8");
      signals.push(JSON.parse(content));
    }
  }

  return signals.sort((a, b) => a.freq - b.freq);
}

// ============================================
// Post-Save Hook
// ============================================

export async function runGenerate(): Promise<void> {
  const projectPath = getProjectPath();
  try {
    await execAsync("pnpm generate", { cwd: projectPath });
  } catch (error) {
    console.error("Failed to run pnpm generate:", error);
    throw error;
  }
}

// ============================================
// Tag Utilities
// ============================================

export function getAllTags(signalType: "projects" | "journal"): string[] {
  const cards = getCards(signalType);
  const tagSet = new Set<string>();

  for (const card of cards) {
    for (const tag of card.frontmatter.tags) {
      tagSet.add(tag);
    }
  }

  return Array.from(tagSet).sort();
}

// ============================================
// Date Utilities
// ============================================

export function getTodayDate(): string {
  const now = new Date();
  return now.toISOString().split("T")[0];
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// ============================================
// ID Generation
// ============================================

export function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim();
}

export function isIdUnique(id: string, signalType: "projects" | "journal"): boolean {
  const cards = getCards(signalType);
  return !cards.some((card) => card.frontmatter.id === id);
}

