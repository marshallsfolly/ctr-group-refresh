# CTR Group refresh

A concept site for [CTR Group](https://www.ctrc.com), the shipyard and skilled-trades staffing firm. It shows a search-first job site, candidate accounts, a recruiter console and an SEO overhaul. It's built to present to CTR, so all jobs and people are sample data.

Live preview: https://marshallsfolly.github.io/ctr-group-refresh/ (marked `noindex`)

## What's in it

- **Search first.** The home page is a query bar. People type what they want in plain words ("pipe welder near Norfolk, nights, $35+") and the list updates as they type. Each understood piece shows as a chip; tapping a chip removes those words from the sentence. Quick buttons, region counters and sort controls also edit the sentence, so the sentence is always the whole search. When nothing matches, the search widens one step at a time and says what it widened.
- **The reader** is [jevbar](https://github.com/marshallsfolly/jevbar)'s core, vendored in `src/assets/js/jevbar/` (MIT). It runs `readOffline` against a job-search schema (`src/assets/js/query.js`): code settles trades, places and radius, pay, shift, credentials, perks and typos, so it's instant and works offline. A server with a TypeSafe key could later hand the same schema to Jev for vaguer requests.
- **Sample data:** 1,500 jobs across 49 shipyard towns and 24 trades, plus 400 candidates. Seeded, so every build is identical (`tools/data.mjs`). Pay follows trade, class, region and shift. Per diem applies past 60 miles from a CTR office. Credentials follow the yard type. Real clients stay unnamed ("Naval shipbuilder"), the way staffing firms list them.
- **Accounts:** LinkedIn sign-in (mocked consent), real browser passkeys (WebAuthn, no server yet) and email links (mocked). The profile holds applications, video interviews with a calendar invite, onboarding paperwork, credentials with expiry warnings, job alerts and a shareable trade card.
- **Recruiter console** (`/recruit/`): a kanban pipeline with drag between stages, filtered with the same plain-words reader ("6G pipe welders with TWIC in screening"). A candidate sheet has screening, credential checks, scheduling, document requests and notes. There are also calendar, document and onboarding views, and a video room that uses your real camera with a simulated other side.
- **SEO:** a static page per job with `JobPosting` data, trade hubs, trade-by-town pages (only where 3+ jobs exist), town pages, `EmploymentAgency` data for the four offices, breadcrumbs, a sitemap and a site search action. `/audit/` compares this with ctrc.com today.
- **Phone first and installable:** a bottom tab bar, safe-area padding, a manifest with shortcuts, and a service worker that caches the shell and the job index. Search and saved jobs work offline.

## Design

Swiss mono with a nod to [Brass Hands](https://brasshands.com), taken from the shipyard rather than copied:
- **Color:** haze gray background (Navy ship paint), charcoal ink, safety orange as the only accent. Orange never carries small text on gray.
- **Type:** Inter Tight for headlines, Martian Mono for labels and readouts, Big Shoulders Stencil for numbers and the wordmark. All are SIL OFL, self-hosted in `src/assets/fonts/` with their licenses.
- **Visual devices:** blueprint welding symbols as trade glyphs, job cards styled as riveted data plates, a Plimsoll load-line mark for the logo, hazard-tape bands, and a hull draft-mark scroll ruler on wide screens.

## Build

No dependencies. Node 20 or later.

```sh
node tools/generate.mjs                # writes docs/ (mockup: noindex, GitHub Pages URLs)
node tools/generate.mjs --production   # indexable, canonicals on www.ctrc.com
node tools/check.mjs                   # JSON-LD, links, h1s, titles, precache, manifest
```

`docs/` is the output and what GitHub Pages serves. Edit `src/` and `tools/`, then regenerate.

## Layout

```
src/assets/js/catalog.js   trades, levels, credentials, places, offices (shared by Node and the browser)
src/assets/js/query.js     the query reader and matcher
src/assets/js/render.js    job rows and data plates (same markup at build time and live)
src/assets/js/*.js         page scripts: search, auth, account, saved, recruit, room, employers
src/assets/css/site.css    the design system
tools/data.mjs             seeded sample data
tools/site.mjs, pages.mjs  page templates
tools/generate.mjs         the build
tools/sw.template.js       service worker
tools/check.mjs            static checks
RESEARCH.md                notes on ctrc.com today and the Brass Hands design language
```
