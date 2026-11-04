import { getGeneratedBlog, getSeedBlog, seedSlug } from '../../utils/blogs'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (slug === seedSlug) return getSeedBlog()
  const blog = slug ? await getGeneratedBlog(slug) : null
  if (!blog) throw createError({ statusCode: 404, statusMessage: 'Blog not found' })
  return blog
})
