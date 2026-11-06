<script setup lang="ts">
interface UploadErrorLog {
  id: string
  occurredAt: string
  csvContent: string | null
  csvBytes: number | null
  csvTruncated: boolean
  errorMessages: string[]
}

interface UploadErrorLogPage {
  records: UploadErrorLog[]
  page: number
  pageSize: number
  total: number
}

const errorMessage = ref('')
const isLoading = ref(false)
const result = ref<UploadErrorLogPage | null>(null)

useSeoMeta({
  title: 'Upload error log',
  robots: 'noindex, nofollow',
})

async function loadPage(page = 1) {
  if (isLoading.value) return
  isLoading.value = true
  errorMessage.value = ''
  try {
    result.value = await $fetch<UploadErrorLogPage>('/api/admin/upload-errors', {
      query: { page },
    })
  } catch (error) {
    errorMessage.value = error && typeof error === 'object' && 'data' in error
      ? String((error as { data?: { statusMessage?: string } }).data?.statusMessage || 'The upload error log could not be loaded.')
      : 'The upload error log could not be loaded. Please try again.'
    result.value = null
  } finally {
    isLoading.value = false
  }
}

onMounted(() => loadPage())
</script>

<template>
  <main class="log-page">
    <header class="log-header">
      <a class="brand" href="/">Beauhurst <span>Insights</span></a>
      <a href="/blogs">Blog archive</a>
    </header>
    <section class="log-content">
      <p class="eyebrow">ADMINISTRATION</p>
      <h1>Upload error log</h1>
      <p class="intro">Records include uploaded CSV contents and error details. Treat this information as confidential.</p>

      <p v-if="isLoading" class="intro" role="status">Loading error log…</p>
      <p v-if="errorMessage" class="error-message" role="alert">{{ errorMessage }}</p>
      <template v-if="result">
        <p class="record-count">{{ result.total }} recorded error{{ result.total === 1 ? '' : 's' }}</p>
        <p v-if="!result.records.length" class="empty-state">No upload errors have been recorded.</p>
        <ol v-else class="record-list">
          <li v-for="record in result.records" :key="record.id" class="record">
            <h2>{{ record.occurredAt }}</h2>
            <ul class="messages">
              <li v-for="(message, index) in record.errorMessages" :key="index">{{ message }}</li>
            </ul>
            <p v-if="record.csvContent === null" class="csv-status">No CSV file was available.</p>
            <details v-else>
              <summary>CSV contents ({{ record.csvBytes }} bytes{{ record.csvTruncated ? ', truncated to 2 MB' : '' }})</summary>
              <pre>{{ record.csvContent }}</pre>
            </details>
          </li>
        </ol>
        <nav v-if="result.total > result.pageSize" class="pagination" aria-label="Log pages">
          <button type="button" :disabled="isLoading || result.page <= 1" @click="loadPage(result.page - 1)">Newer</button>
          <span>Page {{ result.page }} of {{ Math.ceil(result.total / result.pageSize) }}</span>
          <button
            type="button"
            :disabled="isLoading || result.page >= Math.ceil(result.total / result.pageSize)"
            @click="loadPage(result.page + 1)"
          >
            Older
          </button>
        </nav>
      </template>
    </section>
  </main>
</template>

<style>
.log-page { --ink: #122a35; --muted: #587078; --teal: #0c746d; color: var(--ink); margin: 0 auto; max-width: 1000px; padding: 0 32px; }
.log-header { align-items: center; border-bottom: 1px solid #dce8e5; display: flex; justify-content: space-between; min-height: 76px; }
.log-header a:last-child { color: var(--teal); font-size: 13px; font-weight: 700; text-decoration: none; }
.brand { color: var(--ink); font-size: 19px; font-weight: 750; letter-spacing: -.04em; text-decoration: none; }
.brand span { color: var(--teal); font-weight: 500; }
.log-content { margin: 0 auto; max-width: 760px; padding: 58px 0; }
.eyebrow { color: var(--teal); font-size: 11px; font-weight: 800; letter-spacing: .13em; margin: 0 0 14px; text-transform: uppercase; }
.log-content h1 { font-size: clamp(36px, 6vw, 52px); letter-spacing: -.05em; margin: 0 0 12px; }
.intro, .empty-state, .record-count { color: var(--muted); font-size: 14px; line-height: 1.6; }
.pagination button { background: var(--teal); border: 0; border-radius: 6px; color: white; cursor: pointer; font: inherit; font-size: 13px; font-weight: 700; min-height: 42px; padding: 0 16px; }
.pagination button:disabled { cursor: not-allowed; opacity: .55; }
.error-message { color: #a32929; font-size: 13px; }
.record-count { font-weight: 700; margin: 28px 0 14px; }
.record-list { list-style: none; margin: 0; padding: 0; }
.record { border: 1px solid #dce8e5; border-radius: 8px; margin: 14px 0; padding: 18px; }
.record h2 { font-size: 15px; margin: 0 0 12px; }
.messages { color: #a32929; font-size: 13px; line-height: 1.6; padding-left: 20px; }
.record details { margin-top: 16px; }
.record summary { color: var(--teal); cursor: pointer; font-size: 13px; font-weight: 700; }
.record pre { background: #f6f9f7; border-radius: 6px; font-size: 12px; margin: 12px 0 0; max-height: 420px; overflow: auto; padding: 12px; white-space: pre-wrap; overflow-wrap: anywhere; }
.csv-status { color: var(--muted); font-size: 13px; }
.pagination { align-items: center; display: flex; gap: 16px; justify-content: center; margin: 28px 0; }
.pagination span { color: var(--muted); font-size: 13px; }
@media (max-width: 600px) { .log-page { padding: 0 18px; } .log-content { padding: 42px 0; } .brand { font-size: 17px; } }
</style>
