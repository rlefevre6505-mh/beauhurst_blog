# Dataset-to-blog

A Nuxt application that turns a company CSV into a server-rendered, SEO-ready ranking article. The included home page uses `content/fintech_companies_seed.csv`; use `/create` to upload another dataset. The application uses PapaParse to parse csv data

Deployment Link: https://beauhurst-blog-green.vercel.app/

Repo Link: https://github.com/rlefevre6505-mh/beauhurst_blog

## Setup

Install dependencies with `npm install`.

## Development

Run `npm run dev` and open `http://localhost:3000`. To generate AI-written article copy, set `GEMINI_API_KEY` in `.env.local` or provide `NUXT_GEMINI_API_KEY` in the environment (`GEMINI_KEY` is also supported for compatibility). The default model is `gemini-3.5-flash-lite`; `NUXT_GEMINI_MODEL` can override it. The API key is used only by the server and is never returned to the browser. Without a key, the app creates concise, factual copy directly from computed dataset statistics.

CSV files need a `Company` (or `Name`) column and a `Total Raised` (or `Amount Raised`) column. Optional columns include `Region`, `Stage`, `Employees`, `Description`, `Website` and `Industries`. Enter a required blog title when uploading; the article uses that title, while AI generates the introduction and insights. Without an AI key, the app creates factual copy directly from computed dataset statistics. Fundraising amounts must use one currency per file; `£`, `$`, `€` and unmarked numeric amounts are supported. Uploads are limited to 2 MB and 5,000 companies.

Generated dataset records are stored as JSON under `.data/blogs` during local development and served at `/blog/<dataset-name>-fundraising`. On Vercel, blog records and upload error records use a private Vercel Blob store because function filesystems are not persistent. Create a private Blob store and connect it to the Vercel project so `BLOB_STORE_ID` and Vercel OIDC credentials are available, or configure `BLOB_READ_WRITE_TOKEN`. For local Blob testing, configure `BLOB_READ_WRITE_TOKEN`; otherwise local file storage is used.

Failed upload records include CSV contents (up to the 2 MB upload limit), timestamps and error messages. The log rotates at 50 MB, keeping the newest records. These records are viewable without a password at `/admin/upload-errors` and through its API, so do not upload confidential or personal data.

Build and preview with `npm run build` and `npm run preview`.
