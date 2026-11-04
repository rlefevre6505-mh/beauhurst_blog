import { existsSync } from 'node:fs'

export function getGeminiApiKey(runtimeConfig: { geminiApiKey: string }): string {
  const environmentKey = process.env.NUXT_GEMINI_API_KEY
    || process.env.GEMINI_API_KEY
    || process.env['GEMINI-KEY']
  if (!environmentKey && !runtimeConfig.geminiApiKey && existsSync('.env.local')) {
    process.loadEnvFile('.env.local')
  }
  return process.env.NUXT_GEMINI_API_KEY
    || process.env.GEMINI_API_KEY
    || process.env['GEMINI-KEY']
    || runtimeConfig.geminiApiKey
}
