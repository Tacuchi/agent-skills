import { readFileSync, writeFileSync } from 'node:fs';

const index = JSON.parse(readFileSync(new URL('../catalog/index.json', import.meta.url), 'utf8'));
if (index.schema_version !== 1 || index.revision !== 1 || !Array.isArray(index.entries) || index.entries.length !== 0) {
  throw new Error('El índice inicial debe tener esquema 1, revisión 1 y cero ofertas');
}

const readmePath = new URL('../README.md', import.meta.url);
const readme = readFileSync(readmePath, 'utf8');
const block = `<!-- catalog:start -->\nRevisión del índice: **1** (esquema 1).\n\nNo hay ofertas vigentes.\n\nNo hay ofertas retiradas.\n<!-- catalog:end -->`;
const current = readme.match(/<!-- catalog:start -->[\s\S]*?<!-- catalog:end -->/g);
if (!current || current.length !== 1) throw new Error('README debe contener un único bloque de catálogo');
if (process.argv.includes('--check')) {
  if (current[0] !== block) throw new Error('README no coincide con catalog/index.json');
} else {
  writeFileSync(readmePath, readme.replace(current[0], block));
}
