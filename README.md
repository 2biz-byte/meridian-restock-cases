# Gabriel Operator — list-builder skill pack

Canonical skill scaffold for **Git-backed personal data lists**: `assets/list.json`, `data/records.json`, validation scripts, and authoring guides.

Published from **[go-code-bot/list-builder](https://github.com/go-code-bot/list-builder)**.

## Install

```bash
npx github:go-code-bot/list-builder
npx github:go-code-bot/list-builder add ./my-list
npx github:go-code-bot/list-builder sync ./my-list
```

Or:

```bash
curl -fsSL https://raw.githubusercontent.com/go-code-bot/list-builder/main/install.sh | bash
curl -fsSL https://raw.githubusercontent.com/go-code-bot/list-builder/main/install.sh | bash -s -- ./my-list
```

## What gets installed

```text
SKILL.md
assets/list.json
references/list-contract.json
data/records.json
scripts/validate-list.js
scripts/validate-records.js
prompts/codex.md
prompts/claude-code.md
```

`assets/list.json` is the canonical list definition. It stores the list id,
name, description, optional `pipelineId`, and column schema. It must not
store per-user UI state.

`data/records.json` is the agent-editable row contract. After validation,
commit and push it to the default branch, then sync the list in Gabriel.

## Validate

```bash
node scripts/validate-list.js assets/list.json
node scripts/validate-records.js data/records.json
```
