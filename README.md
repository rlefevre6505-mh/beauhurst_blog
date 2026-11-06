# Dataset-to-blog

A Nuxt application that turns a company CSV into a server-rendered, SEO-ready ranking article. The included home page uses `content/fintech_companies_seed.csv`; use `/create` to upload another dataset.

## Setup

Install dependencies with `npm install`.

## Development

Run `npm run dev` and open `http://localhost:3000`. To generate AI-written article copy, set `GEMINI_API_KEY` in `.env.local` or provide `NUXT_GEMINI_API_KEY` in the environment (`GEMINI-KEY` is also supported for compatibility). The default model is `gemini-3.5-flash-lite`; `NUXT_GEMINI_MODEL` can override it. The API key is used only by the server and is never returned to the browser. Without a key, the app creates concise, factual copy directly from computed dataset statistics.

CSV files need a `Company` (or `Name`) column and a `Total Raised` (or `Amount Raised`) column. Values are trimmed and blank rows are skipped. Malformed CSV records, rows with a different number of columns, and rows missing a company name or fundraising amount are rejected with row-specific feedback. Optional columns include `Region`, `Stage`, `Employees`, `Description`, `Website` and `Industries`. Fundraising amounts must use one currency per file; `£`, `$`, `€` and unmarked numeric amounts are supported. Uploads are limited to 2 MB and 5,000 companies.

Generated dataset records are stored as JSON under `.data/blogs` and served at `/blog/<dataset-name>-fundraising`. This file-based storage suits a single Node server/demo; production deployments with ephemeral or multiple instances should replace it with shared persistent storage and add authentication, upload quotas and moderation.

Build and preview with `npm run build` and `npm run preview`.
