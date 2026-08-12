#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = process.cwd();
const recordsPath = process.argv[2] || path.join('data', 'records.json');
const contractPath = path.join(root, 'references', 'list-contract.json');

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function fail(message) {
  throw new Error(message);
}

const contract = readJson(contractPath);
const payload = readJson(path.resolve(root, recordsPath));
const list = contract.list || {};
const columns = Array.isArray(list.columns) ? list.columns : [];
const columnByKey = new Map(columns.map((column) => [column.key, column]));

if (!payload || typeof payload !== 'object' || Array.isArray(payload)) fail('data/records.json must be an object.');
if (payload.schemaVersion !== 1) fail('schemaVersion must be 1.');
if (payload.listId !== list.id) fail(`listId must be ${list.id}.`);
if (payload.collectionId !== list.collectionId) fail(`collectionId must be ${list.collectionId}.`);
if (payload.writeMode !== undefined && payload.writeMode !== 'append' && payload.writeMode !== 'upsert') {
  fail('writeMode must be append or upsert.');
}
if (payload.upsertKey && !columnByKey.has(payload.upsertKey)) {
  fail('upsertKey must reference a list column.');
}
if (!Array.isArray(payload.records)) fail('records must be an array.');

for (const [index, entry] of payload.records.entries()) {
  const rowNumber = index + 1;
  if (!entry || typeof entry !== 'object' || Array.isArray(entry)) fail(`Row ${rowNumber} must be an object.`);
  if (!entry.data || typeof entry.data !== 'object' || Array.isArray(entry.data)) fail(`Row ${rowNumber} data must be an object.`);
  for (const key of Object.keys(entry.data)) {
    if (key.startsWith('_')) continue;
    if (!columnByKey.has(key)) fail(`Row ${rowNumber} field "${key}" is not in the list schema.`);
  }
  for (const column of columns) {
    const value = entry.data[column.key];
    if (value === undefined || value === null || value === '') {
      if (column.required) fail(`Row ${rowNumber} is missing required field "${column.key}".`);
      continue;
    }
    if (column.type === 'number' && typeof value !== 'number') fail(`Row ${rowNumber} field "${column.key}" must be a number.`);
    if (column.type === 'boolean' && typeof value !== 'boolean') fail(`Row ${rowNumber} field "${column.key}" must be a boolean.`);
    if (column.type === 'date' && typeof value === 'string' && Number.isNaN(Date.parse(value))) {
      fail(`Row ${rowNumber} field "${column.key}" must be a parseable date string.`);
    }
    if (column.type === 'select' && Array.isArray(column.options) && column.options.length > 0 && !column.options.includes(String(value))) {
      fail(`Row ${rowNumber} field "${column.key}" must be one of: ${column.options.join(', ')}.`);
    }
  }
}

console.log(`Validated ${payload.records.length} row(s) for ${list.name || list.id}.`);
