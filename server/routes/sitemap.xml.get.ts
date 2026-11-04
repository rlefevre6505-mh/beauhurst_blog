import { listBlogs } from '../utils/blogs'

function escapeXml(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
}

export default defineEventHandler(async (event) => {
  const siteUrl = String(useRuntimeConfig(event).public.siteUrl).replace(/\/+$/, '')
  const blogs = await listBlogs()
  const urls = [
    `${siteUrl}/`,
    `${siteUrl}/blogs`,
    ...blogs.filter(blog => blog.slug !== 'uk-fintech-fundraising').map(blog => `${siteUrl}/blog/${blog.slug}`),
  ]
  setHeader(event, 'content-type', 'application/xml; charset=utf-8')
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(url => `  <url><loc>${escapeXml(url)}</loc></url>`).join('\n')}\n</urlset>`
})
