// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/content',
    '@nuxt/a11y',
    '@nuxt/ui',
  ],
  runtimeConfig: {
    geminiApiKey: '',
    geminiModel: 'gemini-3.5-flash-lite',
    public: {
      siteUrl: 'https://www.beauhurst.com',
    },
  },
  nitro: {
    serverAssets: [{ baseName: 'content', dir: './content' }],
  },
  devtools: { enabled: true },
  compatibilityDate: '2024-04-03',
})
