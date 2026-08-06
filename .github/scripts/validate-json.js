/* Validates every .json file in the theme, every {% schema %} block in
   sections/, and the range settings inside those schemas.

   The range rules are here because `shopify theme check` does not enforce
   them — a schema with an out-of-range `step` passes locally and is rejected
   by the Shopify API on push, which fails the whole section and cascades into
   "section type does not refer to an existing section file" for any template
   that uses it. */
const fs = require('fs');
const path = require('path');

let failed = 0;

function fail(message) {
  failed++;
  console.error(message);
}

/* ---------------------------------------------------------------- JSON --- */

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
      fail(`invalid JSON      ${full}    ${error.message}`);
    }
  }
}

walk('.');

/* ------------------------------------------------------ range settings --- */

const MAX_STEPS = 101;

function checkRange(setting, where) {
  if (setting.type !== 'range') return;

  const { id, min, max, step } = setting;
  const label = `${where}  ${id}`;

  if (typeof step !== 'number' || step <= 0) {
    fail(`invalid range     ${label}    step must be a positive number`);
    return;
  }

  if (min >= max) {
    fail(`invalid range     ${label}    min (${min}) must be less than max (${max})`);
    return;
  }

  const steps = (max - min) / step;
  if (steps > MAX_STEPS) {
    fail(`invalid range     ${label}    ${steps} steps, Shopify allows at most ${MAX_STEPS} (min=${min} max=${max} step=${step})`);
  }

  if (setting.default === undefined) return;

  if (setting.default < min || setting.default > max) {
    fail(`invalid range     ${label}    default ${setting.default} is outside ${min}-${max}`);
  } else if ((setting.default - min) % step !== 0) {
    fail(`invalid range     ${label}    default ${setting.default} is not on a step boundary from min=${min} step=${step}`);
  }
}

/* --------------------------------------------------- section schemas ----- */

for (const file of fs.readdirSync('sections')) {
  if (!file.endsWith('.liquid')) continue;

  const source = fs.readFileSync(path.join('sections', file), 'utf8');
  const match = source.match(/\{%\s*schema\s*%\}([\s\S]*?)\{%\s*endschema\s*%\}/);
  if (!match) continue;

  let schema;
  try {
    schema = JSON.parse(match[1]);
  } catch (error) {
    fail(`invalid schema    sections/${file}    ${error.message}`);
    continue;
  }

  for (const setting of schema.settings || []) {
    checkRange(setting, `sections/${file}`);
  }

  for (const block of schema.blocks || []) {
    for (const setting of block.settings || []) {
      checkRange(setting, `sections/${file} block:${block.type}`);
    }
  }
}

if (failed > 0) {
  console.error(`\n${failed} problem(s) found`);
  process.exit(1);
}

console.log('JSON, section schemas and range settings all valid');
