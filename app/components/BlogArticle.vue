<script setup lang="ts">
import type { BlogDataset } from '#shared/dataset'
import { formatMoney } from '#shared/dataset'

const props = defineProps<{ blog: BlogDataset }>()
const siteUrl = useRuntimeConfig().public.siteUrl
const route = useRoute()
const structuredData = computed(() => JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'Article',
  headline: props.blog.copy.title,
  description: props.blog.copy.metaDescription,
  dateModified: props.blog.updatedAt,
  author: { '@type': 'Organization', name: 'Beauhurst' },
  mainEntityOfPage: { '@type': 'WebPage', '@id': `${siteUrl}${route.path}` },
}).replace(/</g, '\\u003c'))

useHead({
  script: [{ type: 'application/ld+json', innerHTML: structuredData }],
  link: [{ rel: 'canonical', href: `${siteUrl}${route.path}` }],
})
</script>

<template>
  <main class="article-shell">
    <header class="site-header">
      <a class="brand" href="/">Beauhurst <span>Insights</span></a>
      <nav class="header-links" aria-label="Main navigation">
        <a class="archive-link" href="/blogs">All insights</a>
        <a class="create-link" href="/create">Create a dataset blog <span aria-hidden="true">↗</span></a>
      </nav>
    </header>

    <article>
      <section class="hero">
        <p class="eyebrow">DATA INSIGHT <span aria-hidden="true">/</span> {{ blog.industry }}</p>
        <h1>{{ blog.copy.title }}</h1>
        <p class="intro">{{ blog.copy.introduction }}</p>
        <p class="updated">A data-led ranking · {{ blog.stats.companyCount }} companies</p>
      </section>

      <section class="stats-grid" aria-label="Key fundraising statistics">
        <div class="stat-card stat-card-primary">
          <span>Total raised</span>
          <strong>{{ formatMoney(blog.stats.totalRaised, blog.currency) }}</strong>
          <small>Across {{ blog.stats.companyCount }} companies</small>
        </div>
        <div class="stat-card">
          <span>Top-ranked company</span>
          <strong>{{ blog.stats.topCompany.name }}</strong>
          <small>{{ formatMoney(blog.stats.topCompany.totalRaised, blog.currency) }} raised</small>
        </div>
        <div class="stat-card">
          <span>Median raised</span>
          <strong>{{ formatMoney(blog.stats.medianRaised, blog.currency) }}</strong>
          <small>Per company in this dataset</small>
        </div>
        <div class="stat-card">
          <span>Leading region</span>
          <strong>{{ blog.stats.leadingRegion }}</strong>
          <small>{{ blog.stats.leadingRegionCount }} companies · {{ blog.stats.regionCount }} regions</small>
        </div>
      </section>

      <section class="article-copy">
        <div>
          <p class="eyebrow">THE BIG PICTURE</p>
          <h2>What the {{ blog.industry }} fundraising data shows</h2>
        </div>
        <p class="section-intro">
          The figures below rank the companies in this dataset by total fundraising. The summary highlights the largest
          raises and the dataset's regional mix; it describes these companies only, not the whole market.
        </p>
        <ul class="insights">
          <li v-for="(insight, index) in blog.copy.insights" :key="insight">
            <span class="insight-number">{{ String(index + 1).padStart(2, '0') }}</span>
            <span>{{ insight }}</span>
          </li>
        </ul>
      </section>

      <section class="ranking-section" aria-labelledby="ranking-title">
        <div class="section-heading">
          <div>
            <p class="eyebrow">THE FULL RANKING</p>
            <h2 id="ranking-title">{{ blog.stats.companyCount }} companies ranked by total raised</h2>
          </div>
          <p>Sorted from highest to lowest reported fundraising</p>
        </div>
        <div class="table-scroll" tabindex="0" role="region" aria-label="Company fundraising ranking; scroll horizontally to see all columns">
          <table>
            <caption>{{ blog.copy.title }} — full ranking by reported total fundraising</caption>
            <thead>
              <tr>
                <th scope="col">Rank</th>
                <th scope="col">Company</th>
                <th scope="col">Region</th>
                <th scope="col">Stage</th>
                <th scope="col" class="amount">Total raised</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(company, index) in blog.companies" :key="company.name">
                <td class="rank">{{ String(index + 1).padStart(2, '0') }}</td>
                <th scope="row" class="company-name">
                  <a v-if="company.website && /^https?:\/\//i.test(company.website)" :href="company.website" target="_blank" rel="noopener noreferrer">
                    {{ company.name }} <span class="external" aria-label="opens in a new tab">↗</span>
                  </a>
                  <span v-else>{{ company.name }}</span>
                  <small v-if="company.description">{{ company.description }}</small>
                </th>
                <td>{{ company.region }}</td>
                <td><span class="stage-pill">{{ company.stage }}</span></td>
                <td class="amount">{{ formatMoney(company.totalRaised, blog.currency) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p class="data-note">Fundraising totals are shown as supplied in the dataset. Rankings reflect reported totals and may not capture every funding event.</p>
      </section>
    </article>

    <footer class="site-footer">
      <span>Beauhurst Insights</span>
      <a href="/create">Build a blog from your dataset <span aria-hidden="true">→</span></a>
    </footer>
  </main>
</template>

<style>
body { background: #fff; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; margin: 0; }
.article-shell, .article-shell * { box-sizing: border-box; }
.article-shell {
  --ink: #122a35;
  --muted: #587078;
  --teal: #0c746d;
  --line: #dce8e5;
  color: var(--ink);
  margin: 0 auto;
  max-width: 1160px;
  padding: 0 42px;
}

.site-header, .site-footer {
  align-items: center;
  display: flex;
  justify-content: space-between;
}

.site-header { border-bottom: 1px solid var(--line); min-height: 76px; }
.header-links { align-items: center; display: flex; gap: 25px; }
.archive-link { color: var(--muted); font-size: 13px; font-weight: 650; text-decoration: none; }
.archive-link:hover { color: var(--teal); }
.brand { color: var(--ink); font-size: 19px; font-weight: 750; letter-spacing: -.04em; text-decoration: none; }
.brand span { color: var(--teal); font-weight: 500; }
.create-link { color: var(--teal); font-size: 13px; font-weight: 700; text-decoration: none; }
.create-link:hover, .site-footer a:hover { text-decoration: underline; }

.hero { max-width: 850px; padding: 80px 0 42px; }
.eyebrow { color: var(--teal); font-size: 11px; font-weight: 800; letter-spacing: .13em; margin: 0 0 17px; text-transform: uppercase; }
.eyebrow span { color: #a4b9b4; padding: 0 5px; }
h1, h2, p { margin-top: 0; }
h1 { font-size: clamp(38px, 6vw, 65px); letter-spacing: -.055em; line-height: 1.04; margin-bottom: 22px; max-width: 850px; }
.intro { color: #49616a; font-size: 19px; line-height: 1.65; margin-bottom: 22px; max-width: 760px; }
.updated { color: #7a8e93; font-size: 12px; font-weight: 650; letter-spacing: .045em; margin-bottom: 0; }

.stats-grid { display: grid; gap: 12px; grid-template-columns: repeat(4, minmax(0, 1fr)); margin-bottom: 92px; }
.stat-card { background: #f3f7f5; border: 1px solid #e8efec; border-radius: 9px; display: flex; flex-direction: column; min-height: 144px; padding: 22px; }
.stat-card-primary { background: #e8f4ef; border-color: #d5e9e1; }
.stat-card span { color: var(--muted); font-size: 12px; font-weight: 650; margin-bottom: 16px; }
.stat-card strong { font-size: clamp(19px, 2vw, 25px); letter-spacing: -.04em; line-height: 1.15; overflow-wrap: anywhere; }
.stat-card small { color: var(--muted); font-size: 11px; margin-top: auto; padding-top: 10px; }

.article-copy { display: grid; gap: 8px 48px; grid-template-columns: 1fr 1fr; margin: 0 auto 100px; max-width: 960px; }
.article-copy h2, .section-heading h2 { font-size: clamp(26px, 3.6vw, 38px); letter-spacing: -.045em; line-height: 1.15; margin-bottom: 0; }
.section-intro { color: var(--muted); font-size: 15px; line-height: 1.75; padding-top: 28px; }
.insights { border-top: 1px solid var(--line); grid-column: 1 / -1; list-style: none; margin: 22px 0 0; padding: 0; }
.insights li { align-items: baseline; border-bottom: 1px solid var(--line); display: grid; font-size: 15px; gap: 20px; grid-template-columns: 34px 1fr; line-height: 1.6; padding: 17px 0; }
.insight-number { color: var(--teal); font-size: 11px; font-weight: 800; letter-spacing: .08em; }

.ranking-section { margin-bottom: 80px; }
.section-heading { align-items: end; display: flex; gap: 32px; justify-content: space-between; margin-bottom: 25px; }
.section-heading .eyebrow { margin-bottom: 12px; }
.section-heading > p { color: var(--muted); font-size: 12px; margin-bottom: 4px; white-space: nowrap; }
.table-scroll { border: 1px solid var(--line); border-radius: 9px; overflow-x: auto; }
.table-scroll:focus-visible { outline: 3px solid #63b2a1; outline-offset: 3px; }
table { border-collapse: collapse; min-width: 760px; text-align: left; width: 100%; }
caption { height: 1px; overflow: hidden; position: absolute; width: 1px; clip: rect(0, 0, 0, 0); }
thead { background: #f3f7f5; }
th, td { border-bottom: 1px solid #e7eeeb; padding: 14px 15px; vertical-align: top; }
thead th { color: #526a70; font-size: 10px; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; }
tbody td, tbody th { font-size: 13px; }
tbody tr:last-child > * { border-bottom: 0; }
tbody tr:hover { background: #f9fbfa; }
.rank { color: #7f9497; font-size: 11px; font-variant-numeric: tabular-nums; width: 54px; }
.company-name { font-weight: 700; min-width: 240px; text-align: left; }
.company-name a { color: var(--ink); text-decoration-color: #acc9c2; text-underline-offset: 3px; }
.company-name a:hover { color: var(--teal); }
.company-name small { color: var(--muted); display: block; font-size: 11px; font-weight: 400; line-height: 1.5; margin-top: 5px; max-width: 400px; }
.external { color: var(--teal); font-size: 10px; }
.stage-pill { background: #edf3f1; border-radius: 99px; color: #425f5d; display: inline-block; font-size: 10px; padding: 4px 9px; white-space: nowrap; }
.amount { font-variant-numeric: tabular-nums; font-weight: 700; text-align: right; white-space: nowrap; }
.data-note { color: #778a8e; font-size: 11px; line-height: 1.6; margin: 15px 0 0; }
.site-footer { border-top: 1px solid var(--line); color: #718589; font-size: 12px; min-height: 76px; }
.site-footer a { color: var(--teal); font-weight: 700; text-decoration: none; }

@media (max-width: 760px) {
  .article-shell { padding: 0 20px; }
  .hero { padding: 57px 0 32px; }
  .intro { font-size: 17px; }
  .stats-grid { gap: 9px; grid-template-columns: repeat(2, minmax(0, 1fr)); margin-bottom: 72px; }
  .stat-card { min-height: 132px; padding: 16px; }
  .article-copy { display: block; margin-bottom: 74px; }
  .section-intro { padding-top: 18px; }
  .insights { margin-top: 25px; }
  .section-heading { align-items: start; display: block; }
  .section-heading > p { margin: 12px 0 0; white-space: normal; }
}

@media (max-width: 420px) {
  .article-shell { padding: 0 16px; }
  .brand { font-size: 17px; }
  .create-link { font-size: 11px; }
  .stats-grid { grid-template-columns: 1fr 1fr; }
  .stat-card strong { font-size: 18px; }
  .site-footer { align-items: start; flex-direction: column; gap: 8px; justify-content: center; }
}
</style>
