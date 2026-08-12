#!/usr/bin/env node
'use strict';

const fs = require('fs');

function fail(message) {
  throw new Error(message);
}

const ALLOWED_COLUMN_TYPES = new Set(['text', 'number', 'boolean', 'date', 'select', 'json']);

function validateColumns(columns) {
  if (!Array.isArray(columns)) {
    fail('list.columns must be an array');
  }
  const seen = new Set();
  for (const column of columns) {
    if (!column || typeof column !== 'object') {
      fail('list.columns entries must be objects');
    }
    const key = String(column.key || '').trim();
    if (!key) {
      fail('column missing required "key"');
    }
    if (seen.has(key)) {
      fail(`duplicate column key: ${key}`);
    }
    seen.add(key);
    const label = String(column.label || '').trim();
    if (!label) {
      fail(`column ${key} missing required "label"`);
    }
    const type = String(column.type || 'text').toLowerCase();
    if (!ALLOWED_COLUMN_TYPES.has(type)) {
      fail(`column ${key} has invalid type: ${column.type}`);
    }
    if (type === 'select' && column.options && !Array.isArray(column.options)) {
      fail(`column ${key} options must be an array`);
    }
  }
}

function validateList(payload) {
  if (!payload || typeof payload !== 'object') {
    fail('payload must be an object');
  }
  if (payload.schemaVersion !== 1) {
    fail(`unsupported schemaVersion: ${payload.schemaVersion}`);
  }
  if (!String(payload.listId || '').trim()) {
    fail('payload missing required "listId"');
  }
  const list = payload.list;
  if (!list || typeof list !== 'object') {
    fail('payload missing required "list" object');
  }
  if (!String(list.id || '').trim()) {
    fail('list.id is required');
  }
  if (list.id !== payload.listId) {
    fail(`list.id (${list.id}) must match payload.listId (${payload.listId})`);
  }
  if (!String(list.name || '').trim()) {
    fail('list.name is required');
  }
  if (!String(list.collectionId || '').trim()) {
    fail('list.collectionId is required');
  }
  validateColumns(list.columns || []);
  if (list.pipelineId !== undefined && typeof list.pipelineId !== 'string') {
    fail('list.pipelineId must be a string when set');
  }
}

function main() {
  const target = process.argv[2];
  if (!target) {
    fail('Usage: node scripts/validate-list.js <path-to-list.json>');
  }
  const raw = fs.readFileSync(target, 'utf8');
  let payload;
  try {
    payload = JSON.parse(raw);
  } catch (error) {
    fail(`Invalid JSON in ${target}: ${error.message}`);
  }
  validateList(payload);
  console.log(`OK: ${target}`);
}

try {
  main();
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}
