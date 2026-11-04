import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import type { BlogCopy, BlogDataset, Company } from '#shared/dataset'
import { formatMoney, parseCompanyCsv, summarizeCompanies } from '#shared/dataset'

const generatedDirectory = join(process.cwd(), '.data', 'blogs')
const seedCsvPath = join(process.cwd(), 'content', 'fintech_companies_seed.csv')
export const seedSlug = 'uk-fintech-fundraising'

export async function getSeedBlog(): Promise<BlogDataset> {
  const seedCsv = await useStorage('assets:content').getItem('fintech_companies_seed.csv')
  if (typeof seedCsv !== 'string') throw createError({ statusCode: 500, statusMessage: 'The fintech seed CSV is unavailable.' })
  const { companies, currency } = parseCompanyCsv(seedCsv)
  const stats = summarizeCompanies(companies)
  const industry = 'UK fintech'
  return {
    slug: seedSlug,
    industry,
    companies,
    currency,
    stats,
    copy: {
      title: `The ${stats.companyCount} UK fintech companies leading the fundraising rankings`,
      introduction: `Which UK fintech companies have raised the most? This ranking explores ${stats.companyCount} fintech businesses, from payments and banking to wealth management and financial software. Together, they have raised ${formatMoney(stats.totalRaised, currency)}, with ${stats.topCompany.name} at the top of the list.`,
      metaDescription: `Explore the 100 UK fintech companies ranked by total fundraising. Compare funding, stage and region, and discover the biggest fintech fundraising insights.`,
      insights: [
        `${stats.topCompany.name} tops the ranking with ${formatMoney(stats.topCompany.totalRaised, currency)} raised.`,
        `Across all ${stats.companyCount} companies, total fundraising reaches ${formatMoney(stats.totalRaised, currency)}.`,
        `${stats.leadingRegion} has the most companies in the ranking, with ${stats.leadingRegionCount} of the ${stats.companyCount} businesses.`,
        `The median fundraising total is ${formatMoney(stats.medianRaised, currency)}.`,
      ],
      generatedByAi: false,
    },
    updatedAt: new Date().toISOString(),
  }
}

export async function getGeneratedBlog(slug: string): Promise<BlogDataset | null> {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return null
  try {
    return JSON.parse(await readFile(join(generatedDirectory, `${slug}.json`), 'utf8')) as BlogDataset
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null
    throw error
  }
}

export async function listBlogs(): Promise<Array<Pick<BlogDataset, 'slug' | 'industry' | 'copy' | 'stats' | 'updatedAt'>>> {
  const seed = await getSeedBlog()
  let filenames: string[]
  try {
    filenames = await readdir(generatedDirectory)
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') filenames = []
    else throw error
  }
  const generated = await Promise.all(filenames.filter(name => name.endsWith('.json')).map(async (name) => {
    return getGeneratedBlog(name.slice(0, -5))
  }))
  return [seed, ...generated.filter((blog): blog is BlogDataset => blog !== null)]
    .map(({ slug, industry, copy, stats, updatedAt }) => ({ slug, industry, copy, stats, updatedAt }))
}

export function slugify(value: string): string {
  return value.toLowerCase().normalize('NFKD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70)
}

export async function createBlogFromCsv(input: {
  filename: string
  csv: string
  copy: BlogCopy
  industry?: string
}): Promise<BlogDataset> {
  const { companies, currency } = parseCompanyCsv(input.csv)
  const industry = input.industry?.trim() || inferIndustry(input.filename)
  const stats = summarizeCompanies(companies)
  const baseSlug = slugify(industry) || 'dataset'
  const slug = `${baseSlug}-fundraising`
  const existing = slug === seedSlug ? await getSeedBlog() : await getGeneratedBlog(slug)
  if (existing) {
    throw createError({ statusCode: 409, statusMessage: `A blog already exists at /blog/${slug}. Rename the CSV or choose another dataset name.` })
  }
  const blog: BlogDataset = {
    slug,
    industry,
    companies,
    currency,
    stats,
    copy: input.copy,
    updatedAt: new Date().toISOString(),
  }
  await mkdir(generatedDirectory, { recursive: true })
  try {
    await writeFile(join(generatedDirectory, `${slug}.json`), JSON.stringify(blog, null, 2), { flag: 'wx' })
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EEXIST') {
      throw createError({ statusCode: 409, statusMessage: `A blog already exists at /blog/${slug}. Rename the CSV or choose another dataset name.` })
    }
    throw error
  }
  return blog
}

export function inferIndustry(filename: string): string {
  return filename.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ').trim() || 'company'
}

export function getCompanySummary(companies: Company[]): string {
  return companies.slice(0, 12).map((company, index) =>
    `${index + 1}. ${company.name}: ${company.totalRaised}${company.description ? `; ${company.description.slice(0, 180)}` : ''}`,
  ).join('\n')
}
