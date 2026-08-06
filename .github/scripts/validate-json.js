/* Parses every .json file in the theme and every {% schema %} block in
   sections/. A malformed schema does not break Liquid rendering, it just makes
   the section silently unconfigurable in the theme editor, so it is worth
   catching in CI rather than in the admin. */
const fs = require('fs');
const path = require('path');

let failed = 0;

function walk(dir) {
  for (const entry of fs.readdirSync(dir)) {
    if (entry === '.git' || entry === 'node_modules') continue;

    const full = path.join(dir, entry);
    if (fs.statSync(full).isDirectory()) {
      walk(full);
      continue;
    }

    if (!entry.endsWith('.json')) continue;

    try {
      JSON.parse(fs.readFileSync(full, 'utf8'));
    } catch (error) {
      failed++;
      console.error(`invalid JSON    ${full}    ${error.message}`);
    }
  }
}

walk('.');

for (const file of fs.readdirSync('sections')) {
  if (!file.endsWith('.liquid')) continue;

  const source = fs.readFileSync(path.join('sections', file), 'utf8');
  const match = source.match(/\{%\s*schema\s*%\}([\s\S]*?)\{%\s*endschema\s*%\}/);
  if (!match) continue;

  try {
    JSON.parse(match[1]);
  } catch (error) {
    failed++;
    console.error(`invalid schema  sections/${file}    ${error.message}`);
  }
}

if (failed > 0) {
  console.error(`\n${failed} file(s) failed to parse`);
  process.exit(1);
}

console.log('all JSON files and section schemas parse cleanly');
