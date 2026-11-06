import { deleteGeneratedBlog } from '../../utils/blogs'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) throw createError({ statusCode: 404, statusMessage: 'Generated blog not found.' })
  await deleteGeneratedBlog(slug)
  return { success: true }
})
