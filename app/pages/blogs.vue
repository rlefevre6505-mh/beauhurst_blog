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

useSeoMeta({
  title: 'Company data insights and rankings',
  description: 'Explore company rankings and fundraising insights built from company datasets.',
})
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
          <a :href="blog.slug === 'uk-fintech-fundraising' ? '/' : `/blog/${blog.slug}`">
            <span class="blog-industry">{{ blog.industry }} · {{ blog.stats.companyCount }} companies</span>
            <strong>{{ blog.copy.title }}</strong>
            <span class="blog-description">{{ blog.copy.metaDescription }}</span>
            <span class="read-link">Explore ranking <span aria-hidden="true">→</span></span>
          </a>
        </li>
      </ul>
    </section>
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
.blog-list a { color: inherit; display: flex; flex-direction: column; padding: 24px 4px; text-decoration: none; }
.blog-list a:hover strong { color: var(--teal); }
.blog-industry { color: var(--teal); font-size: 11px; font-weight: 750; letter-spacing: .07em; margin-bottom: 9px; text-transform: uppercase; }
.blog-list strong { font-size: clamp(20px, 3vw, 27px); letter-spacing: -.035em; line-height: 1.2; }
.blog-description { color: var(--muted); font-size: 13px; line-height: 1.6; margin-top: 9px; max-width: 680px; }
.read-link { color: var(--teal); font-size: 12px; font-weight: 750; margin-top: 15px; }
@media (max-width: 600px) { .archive-page { padding: 0 18px; } .archive-content { padding: 53px 0; } .brand { font-size: 17px; } .archive-header > a:last-child { font-size: 11px; } }
</style>
