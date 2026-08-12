---
name: list-builder
description: >
  Build, validate, and maintain Git-backed Gabriel Operator data lists by
  editing assets/list.json and data/records.json. Use this skill when defining
  a personal list schema or generating table rows that sync from Git into
  Gabriel Operator.
metadata:
  author: gabriel-operator
  version: "1.0"
compatibility: Requires Node.js 16+ for validation scripts.
---

# List Builder

## Using this skill in coding agents

Gabriel Operator skills are designed for Claude Code, Codex, Cursor, Hermes, OpenClaw, and any agent that supports skill packs. Work in the git-backed list repository connected to your Gabriel list.

### Install the skill pack

| Agent | Install |
|-------|---------|
| **Claude Code** | `npx skills add go-code-bot/list-builder` |
| **Codex** | `codex plugin marketplace add Gabriel-Operator/gabriel-operator-coding-agent-plugin --sparse .agents/plugins` then install the Gabriel Operator plugin |
| **Cursor** | `npx github:go-code-bot/list-builder add ./my-list` or copy into `.cursor/skills/list-builder/` |
| **Hermes / generic CLI** | `npx github:go-code-bot/list-builder add ./my-list` |
| **OpenClaw** | `npx skills add go-code-bot/list-builder` then `openclaw gateway connect --url https://your-openclaw-gateway` |
| **Gabriel Operator monorepo** | `cp -R server/skills/list-builder ./your-git-repo/` |

Alternative curl installer:

```bash
curl -fsSL https://raw.githubusercontent.com/go-code-bot/list-builder/main/install.sh | bash
```

### Modify with your coding agent

1. Open the git-backed list repository.
2. Tell your agent: *"Read `SKILL.md` and update `assets/list.json` (column schema, name, pipeline binding) and/or `data/records.json` (table rows) for \<describe the list change\>."*
3. Validate before committing:
   ```bash
   node scripts/validate-list.js assets/list.json
   node scripts/validate-records.js data/records.json
   ```
4. Commit and push to the default branch.

**Example prompts:**
- *"Add a select column for portion size with options small, medium, large."*
- *"Generate ten grocery rows with realistic item names and quantities."*
- **OpenClaw:** *"Update assets/list.json and data/records.json, run both validators, and prepare the list for Git sync."*

### Sync to Gabriel

1. Run both validators (see above).
2. Commit and push to the default branch.
3. Open the list in Gabriel and sync so `data/records.json` imports into the table projection.

## Git-backed list repositories

When this skill is materialized as a Git repository for one list, the repo
contains the scaffold plus `assets/list.json`. Each list is **personal to the
user that created or imported it** — the same list payload can be imported by
another user, and each user gets their own independent Git binding. The
runtime reads the synced default branch / database projection; non-default
branches are for authoring and review.

Use this skill when editing `assets/list.json` or `data/records.json` for a
Git-backed list.

## Mental Model

- One repository owns one list.
- A list is the **column schema + display name + optional pipeline binding** for
  rows that live in an `app_data_records` collection. The list does not own
  rows — it owns the *shape* and the *identity* of the column set.
- `list.collectionId` points at the runtime app-data collection backing the
  rows. Two lists may share a collection if they are projections of the same
  underlying data.
- `list.pipelineId` (optional) declares that columns are inherited from a
  pipeline at render time. If set, edits to pipeline columns flow into this
  list automatically; standalone lists own their column definitions outright.
- Runtime table rows can be authored in `data/records.json`. After the default
  branch is pushed, Gabriel imports that file into the database projection.
- Per-user UI state still does not belong in Git.
- Keep the `id` stable. Renaming the list is fine; do not regenerate the id
  unless you intentionally fork the list into a new identity.

## Canonical File

For schema edits, edit:

```text
assets/list.json
```

Expected wrapper:

```json
{
  "schemaVersion": 1,
  "listId": "list_123",
  "list": {
    "id": "list_123",
    "name": "Grocery List",
    "description": "Personal grocery items",
    "collectionId": "coll_abc",
    "columns": [],
    "pipelineId": "pl_xyz"
  },
  "commitMessage": "Update list definition"
}
```

## Columns

Columns are the table schema — same shape as pipeline columns so the two
worlds are interchangeable.

```json
{
  "key": "item_key",
  "label": "Item Key",
  "type": "text",
  "required": true,
  "options": ["small", "medium", "large"]
}
```

Allowed types: `text`, `number`, `boolean`, `date`, `select`. The `options`
array is only meaningful for `select`-typed columns.

## Common Edits

Rename the list:

1. Update `list.name`. Optionally tweak `list.description`.
2. Leave `list.id` unchanged.

Add a column (standalone list):

1. Append a new entry to `list.columns[]`.
2. Use a unique `key`.
3. Pick the simplest matching `type`.

Bind / unbind a pipeline:

1. Set `list.pipelineId` to the pipeline id you want to inherit columns from.
   Existing `list.columns[]` becomes the cached snapshot — at runtime, the
   pipeline's columns shadow it.
2. To detach, clear `list.pipelineId` and freeze the columns you want to keep
   into `list.columns[]`.

Model existing-case lineage:

1. Mirror every field referenced by a pipeline `existingCasePolicy` in the
   bound List schema. Identity, attempt, mode, source-record, and source-run
   fields are text columns; reused answer keys are a native JSON column.
2. Keep previous cases immutable. A reuse choice creates a new row whose
   lineage columns reference the source row and run; it never reopens or
   overwrites the source row.
3. Do not store approval grants, submission keys, receipts, evidence, errors,
   or pipeline state in launch-decision metadata. Those remain governed fields
   on the new case row.
4. Never add runtime case rows to Git while modelling this schema.
5. In the UI, define the policy from **Pipeline → Manage → Config → Existing-case
   detection**. Every selectable field comes from the Pipeline/List column schema;
   add or correct the shared column first instead of typing an undeclared key.
6. `locatorField` is a resource locator, not a universal `form_url` constant. Lists
   for other domains may expose `product_url`, `listing_url`, or another stable URL,
   with a separate text identity column for the canonical hash.

## Validation

Run:

```bash
node scripts/validate-list.js assets/list.json
```

The validator rejects missing required fields, duplicate column keys, invalid
column types, and malformed schema wrappers.

## Row Data

For row generation, edit:

```text
data/records.json
```

Expected wrapper:

```json
{
  "schemaVersion": 1,
  "listId": "list_123",
  "collectionId": "coll_abc",
  "writeMode": "upsert",
  "upsertKey": "email",
  "records": [
    {
      "id": "optional-existing-record-id",
      "data": {
        "email": "person@example.com"
      }
    }
  ]
}
```

Rules:

1. Keep `listId`, `collectionId`, `writeMode`, and `upsertKey` stable unless
   the user explicitly asks to change import behavior.
2. Put visible table fields under `records[].data`.
3. Use only column keys from `references/list-contract.json`, except internal
   keys beginning with `_`.
4. Run:

```bash
node scripts/validate-records.js data/records.json
```

After validation, commit and push to the default branch. Gabriel will sync
`data/records.json` into the table.
