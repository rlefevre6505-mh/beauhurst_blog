import Papa from 'papaparse'

export interface Company {
  name: string
  region: string
  stage: string
  employees: string
  totalRaised: number
  description: string
  website: string
  industries: string[]
}

export interface BlogCopy {
  title: string
  introduction: string
  metaDescription: string
  insights: string[]
  generatedByAi: boolean
}

export interface DatasetStats {
  companyCount: number
  totalRaised: number
  medianRaised: number
  averageRaised: number
  topCompany: Company
  topFiveRaised: number
  leadingRegion: string
  leadingRegionCount: number
  regionCount: number
}

export interface BlogDataset {
  slug: string
  industry: string
  companies: Company[]
  currency: string | null
  stats: DatasetStats
  copy: BlogCopy
  updatedAt: string
}

const aliases: Record<string, string[]> = {
  name: ['company', 'companyname', 'business', 'name'],
  totalRaised: ['totalraised', 'totalfundraising', 'fundraising', 'amountraised', 'totalfunding', 'fundsraised'],
  region: ['region', 'location', 'headquarters', 'hq'],
  stage: ['stage', 'fundingstage', 'investmentstage'],
  employees: ['employees', 'employeecount', 'team size'],
  description: ['description', 'companydescription', 'summary'],
  website: ['website', 'url', 'companywebsite'],
  industries: ['industries', 'industry', 'sectors', 'sector'],
}

function throwCsvIssues(issues: string[]): never {
  const displayedIssues = issues.slice(0, 8).join(' ')
  const remainingCount = issues.length - 8
  const remainingMessage = remainingCount > 0 ? ` And ${remainingCount} more issue(s).` : ''
  throw new Error(`The CSV has problems that need fixing: ${displayedIssues}${remainingMessage}`)
}

function normalizeHeader(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, '')
}

function findColumn(headers: string[], field: keyof typeof aliases): number {
  const accepted = (aliases[field] ?? []).map(normalizeHeader)
  return headers.findIndex(header => accepted.includes(normalizeHeader(header)))
}

function parseAmount(value: string): { amount: number, currency: string | null } {
  const currencyMatch = value.match(/[£$€]|(?:GBP|USD|EUR)/i)?.[0]?.toUpperCase()
  const currency = currencyMatch
    ? ({ '£': 'GBP', '$': 'USD', '€': 'EUR', GBP: 'GBP', USD: 'USD', EUR: 'EUR' } as Record<string, string>)[currencyMatch] ?? null
    : null
  const normalized = value.replace(/[£$€,\s]|GBP|USD|EUR/gi, '')
  if (!/^\d+(?:\.\d+)?$/.test(normalized)) {
    throw new Error(`Could not read fundraising amount "${value}". Use a number with an optional £, $, or € symbol.`)
  }
  const amount = Number(normalized)
  if (!Number.isFinite(amount) || amount < 0) throw new Error(`Invalid fundraising amount "${value}".`)
  return { amount, currency }
}

export function parseCompanyCsv(csv: string): { companies: Company[], currency: string | null } {
  const result = Papa.parse<string[]>(csv.replace(/^\uFEFF/, ''), {
    delimiter: ',',
    skipEmptyLines: 'greedy',
    transform: value => value.trim(),
  })
  if (result.errors.length) {
    throwCsvIssues(result.errors.map((error) =>
      typeof error.row === 'number'
        ? `Could not parse CSV record ${error.row + 1}: ${error.message}`
        : `Could not parse the CSV format: ${error.message}`,
    ))
  }

  const rows = result.data
  if (rows.length < 2) throw new Error('The CSV must include a header and at least one company.')
  if (rows.length > 5001) throw new Error('CSV can contain no more than 5,000 companies.')

  const headers = rows[0] ?? []
  const issues: string[] = []
  for (const [index, cells] of rows.slice(1).entries()) {
    if (cells.length !== headers.length) {
      issues.push(`Row ${index + 2} has ${cells.length} columns; expected ${headers.length}.`)
    }
    if (cells.some(value => /^[=+\-@]/.test(value.replace(/^[\u0000-\u0020\uFEFF]+/, '')))) {
      issues.push(`Row ${index + 2} contains a value beginning with a spreadsheet formula character. Remove formulas and upload plain values.`)
    }
  }
  if (issues.length) throwCsvIssues(issues)

  const columns = {
    name: findColumn(headers, 'name'),
    totalRaised: findColumn(headers, 'totalRaised'),
    region: findColumn(headers, 'region'),
    stage: findColumn(headers, 'stage'),
    employees: findColumn(headers, 'employees'),
    description: findColumn(headers, 'description'),
    website: findColumn(headers, 'website'),
    industries: findColumn(headers, 'industries'),
  }
  if (columns.name < 0 || columns.totalRaised < 0) {
    throw new Error('CSV needs a Company (or Name) column and a Total Raised (or Amount Raised) column.')
  }

  let currency: string | null = null
  const companies: Company[] = []
  for (const [index, cells] of rows.slice(1).entries()) {
    const rowNumber = index + 2
    const name = cells[columns.name] ?? ''
    const amount = cells[columns.totalRaised] ?? ''
    if (!name) issues.push(`Row ${rowNumber} is missing a company name.`)
    if (!amount) issues.push(`Row ${rowNumber} is missing a total raised amount.`)
    if (!name || !amount) continue

    let parsedAmount: ReturnType<typeof parseAmount>
    try {
      parsedAmount = parseAmount(amount)
    } catch (error) {
      issues.push(`Row ${rowNumber}: ${error instanceof Error ? error.message : 'Invalid fundraising amount.'}`)
      continue
    }
    if (parsedAmount.currency) {
      if (currency && currency !== parsedAmount.currency) {
        issues.push(`Row ${rowNumber} uses a different currency from the other fundraising amounts.`)
        continue
      }
      currency = parsedAmount.currency
    }

    const value = (column: number) => column < 0 ? '' : (cells[column] ?? '')
    companies.push({
      name,
      region: value(columns.region) || 'Not specified',
      stage: value(columns.stage) || 'Not specified',
      employees: value(columns.employees) || 'Not specified',
      totalRaised: parsedAmount.amount,
      description: value(columns.description),
      website: value(columns.website),
      industries: value(columns.industries).split(/\s*;\s*/).filter(Boolean),
    })
  }

  if (issues.length) throwCsvIssues(issues)
  companies.sort((a, b) => b.totalRaised - a.totalRaised)
  return { companies, currency }
}

export function summarizeCompanies(companies: Company[]): DatasetStats {
  if (!companies.length) throw new Error('A dataset needs at least one company.')
  const ranked = [...companies].sort((a, b) => b.totalRaised - a.totalRaised)
  const totalRaised = ranked.reduce((total, company) => total + company.totalRaised, 0)
  const sortedAmounts = ranked.map(company => company.totalRaised).sort((a, b) => a - b)
  const midpoint = Math.floor(sortedAmounts.length / 2)
  const medianRaised = sortedAmounts.length % 2
    ? sortedAmounts[midpoint] ?? 0
    : ((sortedAmounts[midpoint - 1] ?? 0) + (sortedAmounts[midpoint] ?? 0)) / 2
  const regions = new Map<string, number>()
  for (const company of ranked) {
    regions.set(company.region, (regions.get(company.region) ?? 0) + 1)
  }
  const leadingRegion = [...regions.entries()].sort((a, b) => b[1] - a[1])[0]
  const topCompany = ranked[0]
  if (!leadingRegion || !topCompany) throw new Error('Could not calculate statistics for this company dataset.')

  return {
    companyCount: ranked.length,
    totalRaised,
    medianRaised,
    averageRaised: totalRaised / ranked.length,
    topCompany,
    topFiveRaised: ranked.slice(0, 5).reduce((total, company) => total + company.totalRaised, 0),
    leadingRegion: leadingRegion[0],
    leadingRegionCount: leadingRegion[1],
    regionCount: regions.size,
  }
}

export function formatMoney(amount: number, currency: string | null): string {
  return new Intl.NumberFormat('en-GB', currency
    ? { style: 'currency', currency, maximumFractionDigits: 0 }
    : { maximumFractionDigits: 0 }).format(amount)
}

export function createFallbackCopy(industry: string, stats: DatasetStats, currency: string | null): BlogCopy {
  const sector = industry.replace(/[-_]+/g, ' ')
  const topAmount = formatMoney(stats.topCompany.totalRaised, currency)
  return {
    title: `${stats.companyCount} ${sector} companies ranked by fundraising`,
    introduction: `Explore the ${stats.companyCount} ${sector} companies in this dataset, ranked by total fundraising. Together they have raised ${formatMoney(stats.totalRaised, currency)}. ${stats.topCompany.name} leads with ${topAmount}.`,
    metaDescription: `${stats.companyCount} ${sector} companies ranked by total fundraising. See the leaders, regional picture and key statistics in the dataset.`,
    insights: [
      `${stats.topCompany.name} ranks first, with ${topAmount} in total fundraising.`,
      `The companies in this dataset have raised ${formatMoney(stats.totalRaised, currency)} altogether.`,
      `${stats.leadingRegion} is the most represented region, with ${stats.leadingRegionCount} ${stats.leadingRegionCount === 1 ? 'company' : 'companies'}.`,
      `The median fundraising total is ${formatMoney(stats.medianRaised, currency)}.`,
    ],
    generatedByAi: false,
  }
}
