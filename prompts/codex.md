# Codex Prompt

You are updating the Gabriel Operator data list "Meridian Weekly Restock Pipeline list" through Git.

1. Clone this repository and read SKILL.md plus references/list-contract.json.
2. Add or update rows in data/records.json only. Put table fields under records[].data.
3. Preserve listId, collectionId, writeMode, and upsertKey unless the user explicitly asks to change import behavior.
4. Run node scripts/validate-records.js before committing.
5. Commit and push to the default branch. Gabriel will sync data/records.json into the table.
