import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const messagesDir = path.join(root, 'messages');

function flatten(obj, prefix = '', out = new Set()) {
  if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
    for (const [k, v] of Object.entries(obj)) {
      flatten(v, prefix ? `${prefix}.${k}` : k, out);
    }
  } else {
    out.add(prefix);
  }
  return out;
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function scanHardcodedStringsInTsx(dir) {
  const results = [];
  const stack = [dir];
  while (stack.length) {
    const current = stack.pop();
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === 'dist' || entry.name === 'build') continue;
        stack.push(full);
        continue;
      }
      if (!entry.isFile()) continue;
      if (!/\.(tsx|ts|jsx|js)$/.test(entry.name)) continue;

      const content = fs.readFileSync(full, 'utf8');
      const lines = content.split(/\r?\n/);
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.trim().startsWith('//') || line.trim().startsWith('*')) continue;

        // Very strict and intentionally noisy heuristics:
        // - JSX text nodes: > Some text <
        // - common attributes: placeholder="...", aria-label="...", title="...", alt="..."
        // Exclusions: t("..."), t('...'), i18n files, JSON files.
        const fileRel = path.relative(root, full).replaceAll('\\', '/');
        if (fileRel.includes('/lib/i18n/')) continue;

        const suspectJsxText = />\s*[A-Za-zÀ-ÖØ-öø-ÿ][^<{]{2,}</.test(line) && !/t\(|useTranslations/.test(line);
        const suspectAttr =
          /(placeholder|aria-label|title|alt)=["'][^"']*[A-Za-zÀ-ÖØ-öø-ÿ][^"']*["']/.test(line) &&
          !/t\(|useTranslations/.test(line);

        if (suspectJsxText || suspectAttr) {
          results.push({ file: fileRel, line: i + 1, text: line.trim() });
          if (results.length >= 200) return results;
        }
      }
    }
  }
  return results;
}

function main() {
  const files = fs.readdirSync(messagesDir).filter((f) => f.endsWith('.json'));
  if (!files.includes('fr.json') || !files.includes('en.json')) {
    console.error('Missing required locales: fr.json and en.json must exist.');
    process.exit(1);
  }

  const baseFile = 'fr.json';
  const base = flatten(readJson(path.join(messagesDir, baseFile)));

  let failed = false;
  for (const file of files) {
    // Only enforce for supported locales (fr/en)
    if (!['fr.json', 'en.json'].includes(file)) continue;

    const keys = flatten(readJson(path.join(messagesDir, file)));
    const missing = [...base].filter((k) => !keys.has(k));
    const extra = [...keys].filter((k) => !base.has(k));

    if (missing.length || extra.length) {
      failed = true;
      console.error(`\n${file}`);
      console.error(`  keys=${keys.size} missing=${missing.length} extra=${extra.length}`);
      if (missing.length) console.error(`  missing(sample): ${missing.slice(0, 30).join(', ')}`);
      if (extra.length) console.error(`  extra(sample): ${extra.slice(0, 30).join(', ')}`);
    }
  }

  const hardcoded = scanHardcodedStringsInTsx(path.join(root, 'app'));
  const hardcodedComponents = scanHardcodedStringsInTsx(path.join(root, 'components'));
  const suspects = [...hardcoded, ...hardcodedComponents].slice(0, 200);

  if (suspects.length) {
    failed = true;
    console.error(`\nHardcoded UI strings suspects (showing up to ${suspects.length}):`);
    for (const s of suspects) {
      console.error(`- ${s.file}:${s.line}  ${s.text}`);
    }
  }

  if (failed) {
    console.error('\ncheck-i18n: FAILED');
    process.exit(1);
  }
  console.log('check-i18n: OK');
}

main();

