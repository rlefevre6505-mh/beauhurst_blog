import { getGeminiApiKey } from '../../utils/gemini'

export default defineEventHandler((event) => {
  const config = useRuntimeConfig(event)
  return {
    aiConfigured: Boolean(getGeminiApiKey(config)),
  }
})
