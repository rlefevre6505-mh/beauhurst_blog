import { createFallbackCopy, parseCompanyCsv, summarizeCompanies } from '#shared/dataset'
import { createBlogFromCsv, getCompanySummary, inferIndustry } from '../../utils/blogs'
import { getGeminiApiKey } from '../../utils/gemini'
import { recordUploadError } from '../../utils/upload-error-logs'
import type { H3Event } from 'h3'

const maxUploadBytes = 2 * 1024 * 1024

interface GeneratedCopy {
  title: string
  introduction: string
  metaDescription: string
  insights: string[]
}

function validateCopy(value: unknown): GeneratedCopy {
  if (!value || typeof value !== 'object') throw new Error('Gemini returned an invalid response.')
  const copy = value as Record<string, unknown>
  if (typeof copy.title !== 'string' || typeof copy.introduction !== 'string'
    || typeof copy.metaDescription !== 'string' || !Array.isArray(copy.insights)
    || copy.insights.length < 3 || !copy.insights.every(item => typeof item === 'string')) {
    throw new Error('Gemini did not return all required blog fields.')
  }
  return {
    title: copy.title.slice(0, 120),
    introduction: copy.introduction.slice(0, 1200),
    metaDescription: copy.metaDescription.slice(0, 160),
    insights: copy.insights.slice(0, 5).map((item: string) => item.slice(0, 300)),
  }
}

async function generateCopy(
  event: H3Event,
  blogTitle: string,
  industry: string,
  industries: string[],
  currency: string | null,
  companies: ReturnType<typeof parseCompanyCsv>['companies'],
) {
  const config = useRuntimeConfig(event)
  const stats = summarizeCompanies(companies)
  const apiKey = getGeminiApiKey(config)
  if (!apiKey) return { ...createFallbackCopy(industry, stats, currency), title: blogTitle }

  const model = String(config.geminiModel)
  let response: {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> }
    }>
  }
  try {
    response = await $fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      headers: { 'x-goog-api-key': apiKey },
      body: {
        systemInstruction: {
          parts: [{
            text: 'Write accurate, useful SEO blog copy from the supplied dataset only. Do not invent facts, rankings, dates, or trends. Return a JSON object with title, introduction, metaDescription, and 3-5 concise insights. Use natural language, avoid keyword stuffing, and describe this dataset rather than making unsupported market-wide claims.',
          }],
        },
        contents: [{
          role: 'user',
          parts: [{
            text: JSON.stringify({
              title: blogTitle,
              industry,
              csvIndustries: industries,
              currency: currency ?? 'not specified',
              statistics: stats,
              leadingCompanies: getCompanySummary(companies),
              requirements: {
                title: 'Use the supplied title exactly.',
                introduction: 'A readable introduction of 2-3 sentences, grounded in the supplied statistics.',
                metaDescription: 'Accurate search snippet, maximum 160 characters.',
                insights: '3-5 factual insights grounded in the supplied statistics.',
              },
            }),
          }],
        }],
        generationConfig: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: 'OBJECT',
            properties: {
              title: { type: 'STRING' },
              introduction: { type: 'STRING' },
              metaDescription: { type: 'STRING' },
              insights: { type: 'ARRAY', items: { type: 'STRING' } },
            },
            required: ['title', 'introduction', 'metaDescription', 'insights'],
          },
        },
      },
    })
  } catch (error) {
    const fetchError = error && typeof error === 'object'
      ? error as {
          name?: unknown
          message?: unknown
          status?: unknown
          statusCode?: unknown
          statusMessage?: unknown
          data?: unknown
        }
      : {}
    const responseData = fetchError.data && typeof fetchError.data === 'object'
      ? fetchError.data as { error?: unknown }
      : {}
    const upstreamError = responseData.error && typeof responseData.error === 'object'
      ? responseData.error as { message?: unknown }
      : {}
    const upstreamMessage = typeof upstreamError.message === 'string'
      ? upstreamError.message.replace(/[\r\n]+/g, ' ').slice(0, 300)
      : undefined
    const statusCode = fetchError.statusCode ?? fetchError.status
    console.error('Gemini copy generation failed', {
      name: typeof fetchError.name === 'string' ? fetchError.name : 'Unknown error',
      statusCode,
      statusMessage: upstreamMessage
        ?? (typeof fetchError.statusMessage === 'string' ? fetchError.statusMessage : undefined),
      message: typeof fetchError.message === 'string' ? fetchError.message : undefined,
    })
    const diagnostic = upstreamMessage
      ? `Gemini request failed${statusCode ? ` (${statusCode})` : ''}: ${upstreamMessage}`
      : 'Gemini could not generate this blog. Check the API key and model configuration, then try again.'
    throw createError({ statusCode: 502, statusMessage: diagnostic })
  }

  const content = response.candidates?.[0]?.content?.parts?.map(part => part.text ?? '').join('').trim()
  if (!content) throw createError({ statusCode: 502, statusMessage: 'Gemini returned no blog copy.' })
  try {
    return { ...validateCopy(JSON.parse(content)), title: blogTitle, generatedByAi: true }
  } catch (error) {
    console.error('Invalid blog copy returned by Gemini', error instanceof Error ? error.name : 'Unknown error')
    throw createError({ statusCode: 502, statusMessage: 'Gemini returned invalid blog content.' })
  }
}

export default defineEventHandler(async (event) => {
  let uploadedFile: Buffer | null = null
  try {
    const parts = await readMultipartFormData(event)
    const file = parts?.find(part => part.name === 'file')
    uploadedFile = file?.data ?? null
    if (!file?.data?.length) throw createError({ statusCode: 400, statusMessage: 'Choose a CSV file to upload.' })
    if (file.data.length > maxUploadBytes) throw createError({ statusCode: 413, statusMessage: 'CSV uploads must be 2 MB or smaller.' })
    if (file.filename && !file.filename.toLowerCase().endsWith('.csv')) {
      throw createError({ statusCode: 400, statusMessage: 'Upload a .csv file.' })
    }

    const blogTitle = parts?.find(part => part.name === 'title')?.data.toString('utf8').trim()
    if (!blogTitle) throw createError({ statusCode: 400, statusMessage: 'Enter a blog title.' })
    if (blogTitle.length > 120) throw createError({ statusCode: 400, statusMessage: 'Blog titles must be 120 characters or fewer.' })

    const csv = file.data.toString('utf8')
    let parsed: ReturnType<typeof parseCompanyCsv>
    try {
      parsed = parseCompanyCsv(csv)
    } catch (error) {
      throw createError({
        statusCode: 400,
        statusMessage: error instanceof Error ? error.message : 'The CSV could not be read.',
      })
    }
    const industryCounts = new Map<string, number>()
    for (const company of parsed.companies) {
      for (const value of company.industries) {
        industryCounts.set(value, (industryCounts.get(value) ?? 0) + 1)
      }
    }
    const industries = [...industryCounts.entries()]
      .sort(([a, countA], [b, countB]) => countB - countA || a.localeCompare(b))
      .slice(0, 12)
      .map(([value]) => value)
    const industry = industries[0] || inferIndustry(file.filename || 'company')
    const copy = await generateCopy(event, blogTitle, industry, industries, parsed.currency, parsed.companies)
    const blog = await createBlogFromCsv({ filename: file.filename || 'dataset.csv', csv, copy, industry })
    return { slug: blog.slug, title: blog.copy.title, url: `/blog/${blog.slug}`, generatedByAi: blog.copy.generatedByAi }
  } catch (error) {
    const errorMessages = error && typeof error === 'object'
      ? [
          'statusMessage' in error && typeof error.statusMessage === 'string' ? error.statusMessage : '',
          'message' in error && typeof error.message === 'string' ? error.message : '',
        ].filter(Boolean)
      : [String(error)]
    try {
      await recordUploadError(uploadedFile, [...new Set(errorMessages.length ? errorMessages : ['Unknown upload error.'])], maxUploadBytes)
    } catch (loggingError) {
      console.error('Could not record upload error', loggingError)
      throw createError({ statusCode: 500, statusMessage: 'The upload failed and its error could not be recorded.' })
    }
    if (error && typeof error === 'object' && 'statusCode' in error) throw error
    console.error('Could not generate or save blog', error)
    throw createError({ statusCode: 500, statusMessage: 'The blog could not be generated.' })
  }
})
