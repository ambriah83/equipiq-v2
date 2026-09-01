#!/usr/bin/env node
/**
 * scan.js — workspace scanner for the second brain.
 *
 * Walks the workspace, classifies every file into a department, extracts
 * titles/headings from markdown and text files, discovers Claude Code skills
 * and MCP connectors, and writes:
 *
 *   brain/index.json  — full retrieval index consumed by brain.js
 *   brain/map.js      — display dataset (window.BRAIN_DATA) for dashboard.html
 *
 * Deterministic, dependency-free. Usage:
 *   node second-brain/scan.js [workspaceRoot]
 */
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const SCRIPT_DIR = __dirname;
const CONFIG_PATH = path.join(SCRIPT_DIR, 'os.config.json');
const OUT_DIR = path.join(SCRIPT_DIR, 'brain');

const IGNORE_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '.next', '.cache', 'coverage',
  '__pycache__', '.venv', 'venv', '.turbo', '.parcel-cache', 'out',
  '.svelte-kit', 'vendor', 'tmp', '.idea', '.vscode-server', 'brain',
]);
const TEXT_EXT = new Set(['.md', '.mdx', '.txt', '.markdown']);
const MAX_FILES = 60000;
const MAX_PARSE_BYTES = 512 * 1024;
const MAX_PARSE_LINES = 400;
const MAX_DISPLAY_FILES = 6000;

function loadConfig() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
  } catch (e) {
    console.error(`Could not read ${CONFIG_PATH}: ${e.message}`);
    process.exit(1);
  }
}

function classify(relPath, departments) {
  const lower = relPath.toLowerCase();
  for (const dept of departments) {
    for (const pattern of dept.match || []) {
      if (lower.includes(pattern.toLowerCase())) return dept.id;
    }
  }
  const fallback = departments.find((d) => !d.match || d.match.length === 0);
  return fallback ? fallback.id : departments[departments.length - 1].id;
}

function extractDoc(absPath) {
  // Title + headings from the first MAX_PARSE_LINES lines of a text file.
  let raw;
  try {
    raw = fs.readFileSync(absPath, 'utf8');
  } catch {
    return { title: null, headings: [] };
  }
  const lines = raw.split(/\r?\n/).slice(0, MAX_PARSE_LINES);
  const headings = [];
  let title = null;
  for (let i = 0; i < lines.length; i++) {
    const m = lines[i].match(/^(#{1,4})\s+(.+?)\s*#*\s*$/);
    if (m) {
      const text = m[2].trim();
      headings.push({ text, line: i + 1, level: m[1].length });
      if (!title && m[1].length === 1) title = text;
    }
  }
  if (!title && headings.length) title = headings[0].text;
  return { title, headings };
}

function tokenize(str) {
  return String(str || '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 2);
}

function walk(root) {
  const files = [];
  const stack = ['.'];
  while (stack.length && files.length < MAX_FILES) {
    const rel = stack.pop();
    const abs = path.join(root, rel);
    let entries;
    try {
      entries = fs.readdirSync(abs, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      if (entry.name.startsWith('.') && entry.name !== '.claude' && entry.name !== '.mcp.json') continue;
      const childRel = rel === '.' ? entry.name : `${rel}/${entry.name}`;
      if (entry.isDirectory()) {
        if (!IGNORE_DIRS.has(entry.name)) stack.push(childRel);
      } else if (entry.isFile()) {
        files.push(childRel);
        if (files.length >= MAX_FILES) break;
      }
    }
  }
  return files.sort();
}

function discoverSkills(roots) {
  const skills = [];
  const seen = new Set();
  for (const base of roots) {
    let dirs;
    try {
      dirs = fs.readdirSync(base, { withFileTypes: true }).filter((d) => d.isDirectory());
    } catch {
      continue;
    }
    for (const d of dirs) {
      if (seen.has(d.name)) continue;
      const skillMd = path.join(base, d.name, 'SKILL.md');
      if (!fs.existsSync(skillMd)) continue;
      seen.add(d.name);
      let desc = '';
      try {
        const head = fs.readFileSync(skillMd, 'utf8').slice(0, 2000);
        const dm = head.match(/description:\s*["']?(.{10,160}?)["']?\s*(?:\n|$)/i);
        if (dm) desc = dm[1].trim();
      } catch { /* description stays empty */ }
      skills.push({ name: d.name, path: skillMd, desc });
    }
  }
  return skills.sort((a, b) => a.name.localeCompare(b.name));
}

function discoverApps(root, config) {
  const apps = (config.apps || []).map((a) => ({ ...a, source: 'config' }));
  const seen = new Set(apps.map((a) => a.name.toLowerCase()));
  for (const candidate of [path.join(root, '.mcp.json'), path.join(os.homedir(), '.mcp.json')]) {
    try {
      const parsed = JSON.parse(fs.readFileSync(candidate, 'utf8'));
      for (const name of Object.keys(parsed.mcpServers || {})) {
        if (!seen.has(name.toLowerCase())) {
          seen.add(name.toLowerCase());
          apps.push({ name, kind: 'MCP', source: candidate });
        }
      }
    } catch { /* file absent or unparsable — fine */ }
  }
  return apps;
}

function main() {
  const config = loadConfig();
  const rootArg = process.argv[2] || config.workspaceRoot || '..';
  const root = path.resolve(SCRIPT_DIR, rootArg);
  if (!fs.existsSync(root)) {
    console.error(`Workspace root not found: ${root}`);
    process.exit(1);
  }
  console.log(`Scanning ${root} ...`);
  const t0 = Date.now();

  const relFiles = walk(root);
  const index = [];
  for (const rel of relFiles) {
    const abs = path.join(root, rel);
    let stat;
    try {
      stat = fs.statSync(abs);
    } catch {
      continue;
    }
    const ext = path.extname(rel).toLowerCase();
    const entry = {
      path: rel,
      name: path.basename(rel),
      ext,
      size: stat.size,
      mtime: stat.mtimeMs,
      dept: classify(rel, config.departments),
      title: null,
      headings: [],
    };
    if (TEXT_EXT.has(ext) && stat.size <= MAX_PARSE_BYTES) {
      const doc = extractDoc(abs);
      entry.title = doc.title;
      entry.headings = doc.headings;
    }
    entry.keywords = [...new Set([
      ...tokenize(entry.name.replace(ext, '')),
      ...tokenize(entry.title),
      ...entry.headings.flatMap((h) => tokenize(h.text)),
    ])].slice(0, 40);
    index.push(entry);
  }

  const skillRoots = [
    path.join(root, '.claude', 'skills'),
    path.join(os.homedir(), '.claude', 'skills'),
  ];
  const skills = discoverSkills(skillRoots);
  const apps = discoverApps(root, config);

  // Display dataset: sample files proportionally per department if huge.
  const byDept = {};
  for (const f of index) (byDept[f.dept] = byDept[f.dept] || []).push(f);
  const deptCounts = Object.fromEntries(Object.entries(byDept).map(([k, v]) => [k, v.length]));
  let displayFiles = index;
  if (index.length > MAX_DISPLAY_FILES) {
    displayFiles = [];
    const keepRatio = MAX_DISPLAY_FILES / index.length;
    for (const list of Object.values(byDept)) {
      const step = Math.max(1, Math.round(1 / keepRatio));
      for (let i = 0; i < list.length; i += step) displayFiles.push(list[i]);
    }
  }

  const data = {
    meta: {
      root,
      scannedAt: new Date().toISOString(),
      totalFiles: index.length,
      shownFiles: displayFiles.length,
      durationMs: Date.now() - t0,
    },
    config: {
      osName: config.osName,
      owner: config.owner,
      org: config.org,
      timezones: config.timezones,
      routines: config.routines,
      microApps: config.microApps,
      skillsDeck: config.skillsDeck,
      emailPanel: config.emailPanel,
      agenda: config.agenda,
    },
    departments: config.departments.map((d) => ({ ...d, count: deptCounts[d.id] || 0 })),
    files: displayFiles.map((f) => ({ p: f.path, n: f.name, d: f.dept, t: f.title })),
    skills,
    apps,
  };

  fs.mkdirSync(OUT_DIR, { recursive: true });
  fs.writeFileSync(path.join(OUT_DIR, 'index.json'), JSON.stringify({ root, files: index, skills, apps }, null, 0));
  fs.writeFileSync(path.join(OUT_DIR, 'map.js'), `window.BRAIN_DATA = ${JSON.stringify(data)};\n`);

  console.log(`Indexed ${index.length} files (${data.meta.durationMs} ms).`);
  console.log(`Departments: ${data.departments.map((d) => `${d.name}=${d.count}`).join('  ')}`);
  console.log(`Skills: ${skills.length}   Apps: ${apps.length}`);
  console.log(`Wrote brain/index.json and brain/map.js — open dashboard.html`);
}

main();
