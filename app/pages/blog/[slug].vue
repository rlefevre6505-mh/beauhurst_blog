<script setup lang="ts">
import type { BlogDataset } from '#shared/dataset'

const route = useRoute()
if (route.params.slug === 'uk-fintech-fundraising') await navigateTo('/', { redirectCode: 301 })
const { data: blog, error } = await useFetch<BlogDataset>(`/api/blogs/${encodeURIComponent(String(route.params.slug))}`)
if (error.value || !blog.value) {
  throw createError({
    statusCode: error.value?.statusCode || 404,
    statusMessage: error.value?.statusMessage || 'Blog not found',
    fatal: true,
  })
}
const siteUrl = useRuntimeConfig().public.siteUrl

useSeoMeta({
  title: () => blog.value?.copy.title,
  description: () => blog.value?.copy.metaDescription,
  ogTitle: () => blog.value?.copy.title,
  ogDescription: () => blog.value?.copy.metaDescription,
  ogType: 'article',
  twitterCard: 'summary_large_image',
})
useHead({ link: [{ rel: 'canonical', href: () => `${siteUrl}/blog/${blog.value?.slug}` }] })

</script>

<template>
  <BlogArticle v-if="blog" :blog="blog" />
</template>
