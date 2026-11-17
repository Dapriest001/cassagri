import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.dirname(fileURLToPath(import.meta.url));
const envText = await readFile(path.join(root, '.env'), 'utf8');
const env = {};

for (const [index, rawLine] of envText.split(/\r?\n/).entries()) {
  const line = rawLine.trim();
  if (!line || line.startsWith('#')) continue;

  const separator = line.indexOf('=');
  if (separator < 1) throw new Error(`Invalid .env entry on line ${index + 1}`);
  const name = line.slice(0, separator).trim();
  const value = line.slice(separator + 1).trim();
  env[name] = value.replace(/^(["'])(.*)\1$/, '$2');
}

const supabaseUrl = env.SUPABASE_URL;
const supabaseKey = env.SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY in .env');
}
if (!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(supabaseUrl)) {
  throw new Error('SUPABASE_URL must be an HTTPS Supabase project URL');
}
if (!supabaseKey.startsWith('sb_publishable_')) {
  throw new Error('Only an sb_publishable_ key is allowed in browser configuration');
}

const config = { supabaseUrl, supabaseKey };
await writeFile(
  path.join(root, 'config.js'),
  `window.CASSAGRI_CONFIG = Object.freeze(${JSON.stringify(config)});\n`,
);
console.log('Generated config.js from .env (publishable key only).');