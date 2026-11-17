# Dataset-to-blog

A Nuxt application that turns a company CSV into a server-rendered, SEO-ready ranking article. The included home page uses `content/fintech_companies_seed.csv`; use `/create` to upload another dataset. Papa Parse handles CSV parsing.

Deployment Link: https://beauhurst-blog-green.vercel.app/

Repo Link: https://github.com/rlefevre6505-mh/beauhurst_blog

## Run locally

1. Install a supported version of Node.js and npm.
2. Clone this repository, open its directory in a terminal, and install dependencies:

   ```sh
   npm install
   ```

3. Start the development server:

   ```sh
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000). The home page shows the included sample ranking. To create another article, select **Create a dataset blog**, enter a title, upload a CSV, and submit. The created article opens at `/blog/<dataset-name>-fundraising`; the blogs archive is at `/blogs`.

### Optional: enable AI-generated copy

Without an AI key, the app creates factual copy from the uploaded dataset's computed statistics. To use Gemini, add this to a local `.env.local` file in the project root:

```dotenv
GEMINI_API_KEY=your-gemini-api-key
```

Alternatively, set `NUXT_GEMINI_API_KEY` in the environment (`GEMINI_KEY` is also supported for compatibility). The default model is `gemini-3.5-flash-lite`; set `NUXT_GEMINI_MODEL` to override it. The key is used on the server and is not returned to the browser. Restart the dev server after changing environment variables.

### CSV requirements

CSV files need a `Company` (or `Name`) column and a `Total Raised` (or `Amount Raised`) column. Optional columns include `Region`, `Stage`, `Employees`, `Description`, `Website` and `Industries`. Fundraising amounts must use one currency per file; `£`, `$`, `€` and unmarked numeric amounts are supported. Uploads are limited to 2 MB and 5,000 companies.

### Local data and privacy

Generated dataset records are stored as JSON under `.data/blogs` during local development. Failed upload records include CSV contents (up to the 2 MB upload limit), timestamps and error messages. The log rotates at 50 MB, keeping the newest records. These records are viewable without a password at `/admin/upload-errors` and through its API, so do not upload confidential or personal data.

On Vercel, blog records and upload error records use a private Vercel Blob store because function filesystems are not persistent. Create a private Blob store and connect it to the Vercel project so `BLOB_STORE_ID` and Vercel OIDC credentials are available, or configure `BLOB_READ_WRITE_TOKEN`. For local Blob testing, configure `BLOB_READ_WRITE_TOKEN`; otherwise local file storage is used.

Build and preview with `npm run build` and `npm run preview`.
