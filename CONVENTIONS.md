# Conventions for automated changes

Read CLAUDE.md first. This file is the short version for tickets.

## Where things live
- Document types (page, blog, faq, author, redirect, singletons): apps/studio/schemaTypes/documents
- Page-builder blocks: packages/sanity-blocks/src, one directory per block (schema, GROQ projection, React component, Markdown serializer, thumbnail). Follow the block checklist in CLAUDE.md.
- GROQ queries: packages/sanity/src/query.ts
- Slug rules: apps/studio/utils/slug-validation.ts
- Routes: apps/web/src/app

## Registering a new schema type
Find where an existing type of the same kind (for example faq) is imported and registered under apps/studio/schemaTypes, and add the new type in exactly the same places. Copy the structure of that example.
Registering a new document schema: Create the schema under apps/studio/schemaTypes/documents/, then import it and add it to the documents array in apps/studio/schemaTypes/documents/index.ts. The Studio automatically includes it through apps/studio/schemaTypes/index.ts, which aggregates documents, definitions, and shared block schemas.

## Generated files: never edit by hand
- apps/studio/schema.json and packages/sanity/src/sanity.types.ts are generated.
- After any schema change, run typegen: extract first, then type. Running only the second step leaves a stale schema.

## Rules
- Make the smallest change that satisfies the ticket.
- Schema `name` is camelCase. File names are kebab-case.
- Do not change package.json, pnpm-lock.yaml, .github, or any .env file. No new dependencies.
- Use the same field helpers and patterns as nearby schemas.
- Finish with: files changed, and why, in a few lines.