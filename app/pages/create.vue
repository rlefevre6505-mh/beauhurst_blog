<script setup lang="ts">
const selectedFile = ref<File | null>(null)
const blogTitle = ref('')
const errorMessage = ref('')
const isSubmitting = ref(false)
const { data: serviceStatus } = await useFetch<{ aiConfigured: boolean }>('/api/blogs/status')
const generatedByAi = computed(() => serviceStatus.value?.aiConfigured ?? false)

useSeoMeta({
  title: 'Create a data-led company ranking blog',
  description: 'Upload a company CSV to create an SEO-ready, data-led ranking blog.',
  robots: 'noindex, nofollow',
})

function onFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  selectedFile.value = input.files?.[0] ?? null
  errorMessage.value = ''
}

async function submitDataset() {
  if (!selectedFile.value || isSubmitting.value) return
  isSubmitting.value = true
  errorMessage.value = ''
  const body = new FormData()
  body.append('file', selectedFile.value)
  body.append('title', blogTitle.value)

  try {
    const result = await $fetch<{ url: string }>('/api/blogs/upload', { method: 'POST', body })
    await navigateTo(result.url)
  } catch (error) {
    errorMessage.value = error && typeof error === 'object' && 'data' in error
      ? String((error as { data?: { statusMessage?: string } }).data?.statusMessage || 'The blog could not be created.')
      : 'The blog could not be created. Please try again.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <main class="create-page">
    <header class="create-header">
      <a class="brand" href="/">Beauhurst <span>Insights</span></a>
      <a href="/">← Back to the ranking</a>
    </header>

    <section class="create-content">
      <p class="eyebrow">DATASET TO ARTICLE</p>
      <h1>Turn your company data into a story.</h1>
      <p class="lead">
        Upload a CSV and create a shareable, search-ready ranking with real statistics and a consistent article layout.
      </p>

      <form class="upload-card" @submit.prevent="submitDataset">
        <label class="field-label" for="blog-title">Blog title</label>
        <input id="blog-title" v-model="blogTitle" name="title" autocomplete="off" placeholder="e.g. UK healthtech companies leading fundraising" maxlength="120" required>

        <label class="field-label file-label" for="csv-file">Company dataset CSV</label>
        <input id="csv-file" class="file-input" type="file" name="file" accept=".csv,text/csv" required @change="onFileChange">
        <span class="file-hint">Up to 2 MB. Include a Company and Total Raised column. Region, Stage, Employees, Description, Website and Industries are optional.</span>

        <p class="ai-note">
          {{ generatedByAi
            ? 'AI copy generation is configured. The generated article is grounded in your uploaded data.'
            : 'AI is not configured in this environment, so the article will use factual copy generated directly from your data.' }}
        </p>
        <p v-if="errorMessage" class="form-error" role="alert">{{ errorMessage }}</p>
        <button type="submit" :disabled="!selectedFile || isSubmitting">
          {{ isSubmitting ? 'Creating your blog…' : 'Generate blog' }}
          <span aria-hidden="true">→</span>
        </button>
      </form>

      <p class="privacy-note">Your dataset is stored by this demo application to serve the generated article. Do not upload confidential or personal data.</p>
    </section>
  </main>
</template>

<style>
.create-page { --ink: #122a35; --muted: #587078; --teal: #0c746d; color: var(--ink); min-height: 100vh; padding: 0 42px; }
.create-header { align-items: center; border-bottom: 1px solid #dce8e5; display: flex; justify-content: space-between; margin: 0 auto; max-width: 1160px; min-height: 76px; }
.create-header > a:last-child { color: var(--teal); font-size: 13px; font-weight: 700; text-decoration: none; }
.brand { color: var(--ink); font-size: 19px; font-weight: 750; letter-spacing: -.04em; text-decoration: none; }
.brand span { color: var(--teal); font-weight: 500; }
.create-content { margin: 0 auto; max-width: 720px; padding: 76px 0; }
.eyebrow { color: var(--teal); font-size: 11px; font-weight: 800; letter-spacing: .13em; margin: 0 0 16px; text-transform: uppercase; }
.create-content h1 { font-size: clamp(38px, 6vw, 60px); letter-spacing: -.055em; line-height: 1.04; margin: 0 0 18px; }
.lead { color: var(--muted); font-size: 17px; line-height: 1.65; margin: 0 0 32px; max-width: 620px; }
.upload-card { background: #f6f9f7; border: 1px solid #e3ece8; border-radius: 12px; padding: clamp(20px, 5vw, 36px); }
.field-label { display: block; font-size: 13px; font-weight: 750; margin-bottom: 9px; }
.field-label span { color: #839397; font-size: 12px; font-weight: 400; }
.upload-card input:not([type="file"]) { background: white; border: 1px solid #cbd9d5; border-radius: 6px; color: var(--ink); font: inherit; margin-bottom: 25px; min-height: 45px; padding: 0 12px; width: 100%; }
.upload-card input:focus-visible, .file-input:focus-visible { outline: 3px solid #63b2a1; outline-offset: 2px; }
.file-label { margin-bottom: 10px; }
.file-input { display: block; font: inherit; font-size: 13px; max-width: 100%; }
.file-input::file-selector-button { background: white; border: 1px solid #cbd9d5; border-radius: 5px; color: var(--ink); cursor: pointer; font: inherit; font-weight: 650; margin-right: 12px; padding: 10px 13px; }
.file-hint { color: var(--muted); display: block; font-size: 11px; line-height: 1.6; margin-top: 10px; }
.ai-note { background: #e8f4ef; border-radius: 6px; color: #315953; font-size: 12px; line-height: 1.55; margin: 23px 0; padding: 12px 14px; }
.form-error { color: #a32929; font-size: 13px; line-height: 1.5; }
.upload-card button { align-items: center; background: #0c746d; border: 0; border-radius: 6px; color: white; cursor: pointer; display: flex; font: inherit; font-size: 13px; font-weight: 750; gap: 25px; justify-content: space-between; min-height: 48px; padding: 0 17px; width: 100%; }
.upload-card button:hover:not(:disabled) { background: #095e58; }
.upload-card button:disabled { cursor: not-allowed; opacity: .58; }
.privacy-note { color: #7a8e93; font-size: 11px; line-height: 1.6; margin-top: 17px; }
@media (max-width: 600px) { .create-page { padding: 0 18px; } .create-content { padding: 53px 0; } .brand { font-size: 17px; } .create-header > a:last-child { font-size: 11px; } }
</style>
