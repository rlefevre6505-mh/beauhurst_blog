<script setup lang="ts">
import type { BlogDataset } from '#shared/dataset'

const { data: blog } = await useFetch<BlogDataset>('/api/blogs/uk-fintech-fundraising')
if (!blog.value) throw createError({ statusCode: 500, statusMessage: 'The fintech dataset could not be loaded.' })
const siteUrl = useRuntimeConfig().public.siteUrl

useSeoMeta({
  title: blog.value.copy.title,
  description: blog.value.copy.metaDescription,
  ogTitle: blog.value.copy.title,
  ogDescription: blog.value.copy.metaDescription,
  ogType: 'article',
  twitterCard: 'summary_large_image',
})
useHead({ link: [{ rel: 'canonical', href: `${siteUrl}/` }] })
</script>

<template>
  <BlogArticle v-if="blog" :blog="blog" />
</template>
