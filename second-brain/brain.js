#!/usr/bin/env node
/**
 * brain.js — deterministic retrieval over the second-brain index.
 *
 * No LLM calls. Strips a natural-language query to keywords, scores every
 * indexed file WITHOUT opening any of them, then opens only the winner and
 * returns just the best-matching section. If that section points to another
 * indexed file (markdown link or "see: path"), the pointer is followed.
 *
 * Usage:
 *   node second-brain/brain.js "which TTS voice do we use"
 *   node second-brain/brain.js --list "deployment"      # candidates only
 *   node second-brain/brain.js --top 10 "supabase"      # widen candidate list
 *
 * Run scan.js first; this reads brain/index.json.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const SCRIPT_DIR = __dirname;
const INDEX_PATH = path.join(SCRIPT_DIR, 'brain', 'index.json');

const STOPWORDS = new Set([
  'the', 'and', 'for', 'are', 'was', 'were', 'what', 'which', 'where', 'when',
  'who', 'how', 'why', 'did', 'does', 'do', 'can', 'could', 'should', 'would',
  'our', 'your', 'their', 'his', 'her', 'its', 'this', 'that', 'these', 'those',
  'with', 'from', 'into', 'about', 'use', 'used', 'using', 'get', 'got', 'have',
  'has', 'had', 'been', 'being', 'you', 'they', 'them', 'there', 'here', 'find',
  'file', 'files', 'show', 'give', 'need', 'want', 'please', 'tell', 'know',
]);

function tokenize(str) {
  return String(str || '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

function loadIndex() {
  try {
    return JSON.parse(fs.readFileSync(INDEX_PATH, 'utf8'));
  } catch (e) {
    console.error(`No index at ${INDEX_PATH} — run: node second-brain/scan.js`);
    process.exit(1);
  }
}

function scoreFile(file, tokens) {
  let score = 0;
  const nameTokens = tokenize(file.name);
  const pathTokens = tokenize(file.path);
  const titleTokens = tokenize(file.title);
  const headingTokens = file.headings ? file.headings.flatMap((h) => tokenize(h.text)) : [];
  const keywords = new Set(file.keywords || []);
  for (const t of tokens) {
    if (nameTokens.includes(t)) score += 4;
    if (titleTokens.includes(t)) score += 3;
    if (headingTokens.includes(t)) score += 2;
    if (pathTokens.includes(t)) score += 2;
    if (keywords.has(t)) score += 1;
    // Prefix credit: "deploy" should hit "deployment".
    if (nameTokens.some((n) => n.startsWith(t) && n !== t)) score += 2;
    if (headingTokens.some((h) => h.startsWith(t) && h !== t)) score += 1;
  }
  // Slight boost for markdown knowledge files over code.
  if (file.ext === '.md' || file.ext === '.txt') score *= 1.2;
  return score;
}

function bestSection(absPath, tokens, headings) {
  let raw;
  try {
    raw = fs.readFileSync(absPath, 'utf8');
  } catch {
    return null;
  }
  const lines = raw.split(/\r?\n/);
  if (!headings || headings.length === 0) {
    return { heading: '(whole file, first 60 lines)', text: lines.slice(0, 60).join('\n') };
  }
  let best = null;
  let bestScore = -1;
  for (const h of headings) {
    const hTokens = tokenize(h.text);
    let s = 0;
    for (const t of tokens) {
      if (hTokens.includes(t)) s += 3;
      if (hTokens.some((x) => x.startsWith(t))) s += 1;
    }
    if (s > bestScore) {
      bestScore = s;
      best = h;
    }
  }
  if (!best) return { heading: '(top of file)', text: lines.slice(0, 60).join('\n') };
  // Section = from this heading to the next heading of same-or-higher level.
  const start = best.line - 1;
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    const m = lines[i].match(/^(#{1,4})\s+/);
    if (m && m[1].length <= best.level) {
      end = i;
      break;
    }
  }
  return { heading: best.text, text: lines.slice(start, Math.min(end, start + 80)).join('\n') };
}

function findPointer(sectionText, index, root) {
  // Markdown link to a relative path, or a "see: path" line.
  const patterns = [/\]\(([^)#\s]+\.(?:md|txt|mdx))\)/i, /^see:?\s+([^\s]+\.(?:md|txt|mdx))/im];
  for (const re of patterns) {
    const m = sectionText.match(re);
    if (!m) continue;
    const target = m[1].replace(/^\.\//, '');
    const hit = index.files.find((f) => f.path.endsWith(target) || f.path === target);
    if (hit) return hit;
  }
  return null;
}

function main() {
  const args = process.argv.slice(2);
  let listOnly = false;
  let top = 5;
  const queryParts = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--list') listOnly = true;
    else if (args[i] === '--top') top = parseInt(args[++i], 10) || 5;
    else queryParts.push(args[i]);
  }
  const query = queryParts.join(' ');
  if (!query) {
    console.error('Usage: node second-brain/brain.js "your question"');
    process.exit(1);
  }

  const index = loadIndex();
  const tokens = tokenize(query);
  if (tokens.length === 0) {
    console.error('Query reduced to no keywords — be more specific.');
    process.exit(1);
  }

  const scored = index.files
    .map((f) => ({ f, s: scoreFile(f, tokens) }))
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, top);

  console.log(`query: ${query}`);
  console.log(`keywords: ${tokens.join(', ')}`);
  if (scored.length === 0) {
    console.log('No candidates in the index. Try other keywords or rescan (node second-brain/scan.js).');
    process.exit(0);
  }
  console.log('candidates:');
  for (const { f, s } of scored) console.log(`  ${s.toFixed(1).padStart(6)}  ${f.path}`);
  if (listOnly) return;

  const winner = scored[0].f;
  const abs = path.join(index.root, winner.path);
  const section = bestSection(abs, tokens, winner.headings);
  if (!section) {
    console.log(`\nBest match: ${winner.path} (could not read file)`);
    return;
  }
  console.log(`\n=== ${winner.path} :: ${section.heading} ===`);
  console.log(section.text);

  const pointer = findPointer(section.text, index, index.root);
  if (pointer && pointer.path !== winner.path) {
    const pAbs = path.join(index.root, pointer.path);
    const pSection = bestSection(pAbs, tokens, pointer.headings);
    if (pSection) {
      console.log(`\n=== followed pointer -> ${pointer.path} :: ${pSection.heading} ===`);
      console.log(pSection.text);
    }
  }
}

main();
