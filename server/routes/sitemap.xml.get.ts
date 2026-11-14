import { listBlogs } from '../utils/blogs'

function escapeXml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
}

export default defineEventHandler(async (event) => {
  const siteUrl = String(useRuntimeConfig(event).public.siteUrl).replace(/\/+$/, '')
  const blogs = await listBlogs()
  const entries = [
    { loc: `${siteUrl}/` },
    { loc: `${siteUrl}/blogs` },
    ...blogs
      .filter(blog => blog.slug !== 'uk-fintech-fundraising')
      .map(blog => ({ loc: `${siteUrl}/blog/${blog.slug}`, lastmod: blog.updatedAt })),
  ]
  setHeader(event, 'content-type', 'application/xml; charset=utf-8')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.map(entry => `  <url><loc>${escapeXml(entry.loc)}</loc>${'lastmod' in entry ? `<lastmod>${escapeXml(entry.lastmod)}</lastmod>` : ''}</url>`).join('\n')}\n</urlset>`
})
