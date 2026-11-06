<script setup lang="ts">
interface BlogListing {
  slug: string
  industry: string
  copy: { title: string, metaDescription: string }
  stats: { companyCount: number }
  updatedAt: string
}

const { data: blogs } = await useFetch<BlogListing[]>('/api/blogs')
if (!blogs.value) throw createError({ statusCode: 500, statusMessage: 'The blog archive could not be loaded.' })

const deleteDialog = ref<HTMLDialogElement | null>(null)
const blogToDelete = ref<BlogListing | null>(null)
const deleteError = ref('')
const isDeleting = ref(false)

useSeoMeta({
  title: 'Company data insights and rankings',
  description: 'Explore company rankings and fundraising insights built from company datasets.',
})

function confirmDelete(blog: BlogListing) {
  blogToDelete.value = blog
  deleteError.value = ''
  deleteDialog.value?.showModal()
}

function closeDeleteDialog() {
  if (!isDeleting.value) deleteDialog.value?.close()
}

async function deleteBlog() {
  const blog = blogToDelete.value
  if (!blog || isDeleting.value) return

  isDeleting.value = true
  deleteError.value = ''
  try {
    await $fetch(`/api/blogs/${encodeURIComponent(blog.slug)}`, { method: 'DELETE' })
    blogs.value = blogs.value?.filter(item => item.slug !== blog.slug) ?? []
    deleteDialog.value?.close()
    blogToDelete.value = null
  } catch (error) {
    deleteError.value = error && typeof error === 'object' && 'data' in error
      ? String((error as { data?: { statusMessage?: string } }).data?.statusMessage || 'The blog could not be deleted.')
      : 'The blog could not be deleted. Please try again.'
  } finally {
    isDeleting.value = false
  }
}
</script>

<template>
  <main class="archive-page">
    <header class="archive-header">
      <a class="brand" href="/">Beauhurst <span>Insights</span></a>
      <a href="/create">Create a dataset blog <span aria-hidden="true">↗</span></a>
    </header>
    <section class="archive-content">
      <p class="eyebrow">DATA-LED COMPANY RANKINGS</p>
      <h1>Explore the data.</h1>
      <p class="archive-intro">Rankings and insights drawn from company datasets, with the underlying figures made easy to explore.</p>
      <ul class="blog-list">
        <li v-for="blog in blogs" :key="blog.slug">
          <div class="blog-item">
            <a :href="blog.slug === 'uk-fintech-fundraising' ? '/' : `/blog/${blog.slug}`">
              <span class="blog-industry">{{ blog.industry }} · {{ blog.stats.companyCount }} companies</span>
              <strong>{{ blog.copy.title }}</strong>
              <span class="blog-description">{{ blog.copy.metaDescription }}</span>
              <span class="read-link">Explore ranking <span aria-hidden="true">→</span></span>
            </a>
            <button
              v-if="blog.slug !== 'uk-fintech-fundraising'"
              class="delete-button"
              type="button"
              :aria-label="`Delete ${blog.copy.title}`"
              @click="confirmDelete(blog)"
            >
              Delete
            </button>
          </div>
        </li>
      </ul>
    </section>
    <dialog ref="deleteDialog" class="delete-dialog" aria-labelledby="delete-title" @cancel.prevent="closeDeleteDialog">
      <h2 id="delete-title">Delete this blog?</h2>
      <p v-if="blogToDelete">“{{ blogToDelete.copy.title }}” will be permanently removed.</p>
      <p v-if="deleteError" class="delete-error" role="alert">{{ deleteError }}</p>
      <div class="dialog-actions">
        <button class="cancel-button" type="button" :disabled="isDeleting" @click="closeDeleteDialog">Cancel</button>
        <button class="confirm-delete-button" type="button" :disabled="isDeleting" @click="deleteBlog">
          {{ isDeleting ? 'Deleting…' : 'Delete blog' }}
        </button>
      </div>
    </dialog>
  </main>
</template>

<style>
body { background: #fff; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 0; }
.archive-page, .archive-page * { box-sizing: border-box; }
.archive-page { --ink: #122a35; --muted: #587078; --teal: #0c746d; color: var(--ink); margin: 0 auto; max-width: 1160px; padding: 0 42px; }
.archive-header { align-items: center; border-bottom: 1px solid #dce8e5; display: flex; justify-content: space-between; min-height: 76px; }
.archive-header > a:last-child { color: var(--teal); font-size: 13px; font-weight: 700; text-decoration: none; }
.brand { color: var(--ink); font-size: 19px; font-weight: 750; letter-spacing: -.04em; text-decoration: none; }
.brand span { color: var(--teal); font-weight: 500; }
.archive-content { margin: 0 auto; max-width: 860px; padding: 76px 0; }
.eyebrow { color: var(--teal); font-size: 11px; font-weight: 800; letter-spacing: .13em; margin: 0 0 17px; text-transform: uppercase; }
.archive-content h1 { font-size: clamp(42px, 6vw, 64px); letter-spacing: -.055em; line-height: 1.04; margin: 0 0 16px; }
.archive-intro { color: var(--muted); font-size: 17px; line-height: 1.65; margin: 0 0 36px; max-width: 620px; }
.blog-list { border-top: 1px solid #dce8e5; list-style: none; margin: 0; padding: 0; }
.blog-list li { border-bottom: 1px solid #dce8e5; }
.blog-item { align-items: center; display: flex; gap: 20px; }
.blog-list a { color: inherit; display: flex; flex: 1; flex-direction: column; min-width: 0; padding: 24px 4px; text-decoration: none; }
.blog-list a:hover strong { color: var(--teal); }
.blog-industry { color: var(--teal); font-size: 11px; font-weight: 750; letter-spacing: .07em; margin-bottom: 9px; text-transform: uppercase; }
.blog-list strong { font-size: clamp(20px, 3vw, 27px); letter-spacing: -.035em; line-height: 1.2; }
.blog-description { color: var(--muted); font-size: 13px; line-height: 1.6; margin-top: 9px; max-width: 680px; }
.read-link { color: var(--teal); font-size: 12px; font-weight: 750; margin-top: 15px; }
.delete-button, .cancel-button, .confirm-delete-button { border: 1px solid #cbd9d5; border-radius: 6px; cursor: pointer; font: inherit; font-size: 12px; font-weight: 700; padding: 9px 13px; }
.delete-button, .cancel-button { background: white; color: var(--ink); }
.delete-button:hover, .cancel-button:hover:not(:disabled) { background: #f2f7f5; }
.delete-dialog { border: 1px solid #dce8e5; border-radius: 12px; color: var(--ink); max-width: min(440px, calc(100vw - 32px)); padding: 28px; width: 100%; }
.delete-dialog::backdrop { background: rgb(18 42 53 / 48%); }
.delete-dialog h2 { font-size: 22px; letter-spacing: -.03em; margin: 0 0 10px; }
.delete-dialog p { color: var(--muted); font-size: 14px; line-height: 1.6; margin: 0; overflow-wrap: anywhere; }
.delete-dialog .delete-error { color: #a32929; margin-top: 14px; }
.dialog-actions { display: flex; gap: 10px; justify-content: flex-end; margin-top: 24px; }
.confirm-delete-button { background: #a32929; border-color: #a32929; color: white; }
.confirm-delete-button:hover:not(:disabled) { background: #842020; }
.delete-button:disabled, .cancel-button:disabled, .confirm-delete-button:disabled { cursor: not-allowed; opacity: .6; }
@media (max-width: 600px) { .archive-page { padding: 0 18px; } .archive-content { padding: 53px 0; } .brand { font-size: 17px; } .archive-header > a:last-child { font-size: 11px; } }
</style>
