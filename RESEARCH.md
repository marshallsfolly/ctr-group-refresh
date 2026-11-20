# CTR Group refresh: research notes (2026-11-19)

## Client: current ctrc.com
- Brand "CTR Group", legal "CTR Corporation". Staffing/recruiting since 1987. HQ Newport News VA;
  offices Portsmouth VA, Mobile AL, National City CA. Main 757-873-5900, toll-free 1-855-CTR-JOBS.
- Services: direct hire, contract, temporary, temp-to-hire, executive search, trades training program.
- Core trades: welder (MIG/TIG/pipe/structural), ship fitter, pipefitter, boilermaker, inside/outside
  machinist, QC & NDT inspector, electrician, painter, sheet metal mechanic, crane operator, fire watch,
  maintenance mechanic, planner/scheduler, carpenter, warehouse/forklift, plus engineers.
- Stack: WordPress + Yoast, built by Haley Marketing. Jobs live on a separate board (careers.ctrc.com,
  "index.smpl" URLs), which showed zero postings at fetch time. Only login is an external Avionte portal.
- Safety is a stated pillar (Safety Manager quote; 90-day replacement guarantee).

## SEO gaps found
- No JobPosting structured data (so no Google for Jobs listings), and the jobs sit on a separate subdomain.
- No LocalBusiness schema for the 4 offices; Organization schema lacks phone/address/sameAs/foundingDate.
- Headings look like h3/h4 with no h1 (confirm in the DOM).
- The same 4 testimonials and 3 news teasers repeat on every page (duplicate/thin content).
- Name inconsistency: "CTR Group" vs "CTR Corporation"; stale "Over 35 Years" (1987 means 39).
- Empty alt on blog thumbnails; PNGs used for photos; nav label drift ("Blog"/"Blogs", "Pipefitters"/"Pipe Fitters").
- Sitemap present (Yoast index), robots.txt allows all.

## Inspiration: brasshands.com (Framer)
- Type: "Construct Mono" (commercial stencil-ish mono, all caps) for labels/readouts; Inter-like grotesk at -0.02em for headlines.
- Color: steel gray #ADB3B7 (dominant ground), charcoal #242424, safety orange #FF6200 / #FF781E / #FF7235, pale #E7ECE5.
- Motifs: dot-grid ground, corner-bracket viewfinder frames, 45-degree hazard hatching on the main CTA,
  status readouts ("STATUS: DEPLOYED IN SECTOR", "FIELD OPERATION: ACTIVE"), bracketed nav "[ Store ] [ Portal ]",
  indexed releases "[01] [02] [03]", stock-style tags ("Low Stock", "Sold Out"), flag glyph, lowercase sign-offs.
